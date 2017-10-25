const moment = require('moment-timezone');
const _ = require('lodash');
const config = require('../config/config');
const util_number = require('../lib/number');
const util_string = require('../lib/string');
const util_IDGenerator = require('../lib/IDGenerator');
const util_weChat = require('../lib/weChat');
const util_queue = require('../lib/queue');
const MsgService = require('../lib/messageservice-api');
const client = require('../lib/redis').getClient();
const service_master_register = require('./master_register');
const service_transBonusLog = require('./transBonusLog');
const service_orderlist_bid = require('./orderlist_bid');
const service_ticker = require('./ticker');

//下单机器深度查询时间段（h）
const ORDER_ROBOT_DEPTH_DURATION = Number(process.env.ORDER_ROBOT_DEPTH_DURATION);
//订单过期时长
const ORDER_EXPIRE = process.env.ORDER_EXPIRE;
//订单过期时长（机器订单）
const ORDER_ROBOT_EXPIRE = process.env.ORDER_ROBOT_EXPIRE;
//平台交易手续费
const TRANS_FEE_RATE = Number(process.env.TRANS_FEE_RATE);

/**
 * 委托
 * @param server
 * @param username
 * @param moneyfrom
 * @param borrowid
 * @param coinType
 * @param bors
 * @param quantity
 * @param bidprice
 * @param total
 * @param isMarket
 * @param isMatch
 * @param isInQueue
 */
exports.save = (server, username, moneyfrom, borrowid, tradePlatform, coinType, bors, quantity, bidprice, total, isMarket = 0, isMatch = 0, isInQueue = 1, isRobot = 0, followUsername, followOrderid) => {

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];

  const Master_register = DB.getModel('master_register');
  const Borrowlist = DB.getModel('borrowlist');
  const AutoInvest = DB.getModel('autoInvest');
  const FollowInvest = DB.getModel('followInvest');
  const Orderlist_bid = DB.getModel('orderlist_bid');
  const Fund_in_out = DB.getModel('fund_in_out');

  //币种
  if (!config.coin[coinType]) throw new Error('货币类型不存在');
  //市价单
  if (isMarket) {
    if (bors == 'b' && total <= 0) throw new Error('委托总价不能小于零');
    if (bors == 's' && quantity <= 0) throw new Error('委托数量不能小于零');
  } else {//限价单
    if (quantity <= 0) throw new Error('委托数量不能小于零');
    if (bidprice <= 0) throw new Error('委托价格不能小于零');
    total = util_number.ceil(quantity * bidprice, 2)
  }

  //钱包model
  let Wallet = Master_register;
  //钱包查询条件
  const criteriaForWallet = {username: username};
  //字段名称（货币余额）
  const fieldForCoinBalance = config.coin[coinType].field_prefix + '_balance';
  //字段名称（货币余额--冻结）
  const fieldForCoinBalanceFrozen = config.coin[coinType].field_prefix + '_balance_f';
  //文档--订单
  let docForOrder = {};
  //文档--钱包
  let docForWallet = {};
  //文档--钱包
  let docForFund = {};

  //赠金钱包（status为2的可以使用）
  if (moneyfrom == 'c') {
    Wallet = Borrowlist;
    criteriaForWallet.borrowid = borrowid;
    criteriaForWallet.status = 2;
  }
  //定投钱包（status为0的可以使用）
  if (moneyfrom == 't') {
    Wallet = AutoInvest;
    criteriaForWallet.autoInvestId = borrowid;
    criteriaForWallet.status = 0;
  }
  //跟投钱包（status为0的可以使用）
  if (moneyfrom == 'f') {
    Wallet = FollowInvest;
    criteriaForWallet.followInvestId = borrowid;
    criteriaForWallet.status = 0;
  }

  return service_ticker.getTickerStatus(server, tradePlatform, coinType).then(data => {
    if (!data) throw new Error('该交易所接口状态错误，暂时中止服务');

    //查询钱包a
    return Wallet.findOne({where: criteriaForWallet});
  }).then(wallet => {
    if (!wallet) throw new Error('钱包不存在');
    if (bors == 'b' && wallet.rmb_balance < total) throw new Error('余额不足');
    if (bors == 's' && wallet[fieldForCoinBalance] < quantity) throw new Error('货币数量不足');

    //获取委托单号、流水号
    return Promise.all([
      util_IDGenerator.get('orderlist_bid'),
      util_IDGenerator.get('fund_in_out', config.coin[coinType].code)
    ]);
  }).then(ids => {

    //文档--订单
    docForOrder = {
      orderid: ids[0],
      username: username,
      bors: bors,
      tradePlatform: tradePlatform,
      followUsername: followUsername,
      followOrderid: followOrderid,
      curr_type: config.coin[coinType].code,
      moneyfrom: moneyfrom,
      borrowid: borrowid,
      quantity: quantity,
      bidprice: bidprice,
      total: total,
      orderdate: moment().format('YYYYMMDD'),
      orderdatedetail: moment().format('YYYYMMDDHHmm'),
      isRobot: isRobot,
      isMarket: isMarket,
      // expiredAt: new Date(isRobot == 0 || isMatch == 1 ? (Date.now() + Number(ORDER_EXPIRE) * 60 * 60 * 1000) : (Date.now() - 1000)),
      expiredAt: new Date(Date.now() + Number(isRobot ? ORDER_ROBOT_EXPIRE : ORDER_EXPIRE) * 60 * 60 * 1000)
    };

    //买
    if (bors == 'b') {
      //钱包有足够的人民币
      criteriaForWallet.rmb_balance = {$gte: total};
      //文档--钱包（冻结人民币）
      docForWallet.rmb_balance = Sequelize.literal(`cast(rmb_balance - ${total} as decimal(11, 2))`);
      docForWallet.rmb_balance_f = Sequelize.literal(`cast(rmb_balance_f + ${total} as decimal(11, 2))`);
      //文档--流水
      docForFund = {
        transNumber: ids[1],
        username: docForOrder.username,
        orderid: docForOrder.orderid,
        fundmoneystatus: 'buyfrozen',
        curr_type: 0,
        addorminus: 'minus',
        actiondate: moment().format('YYYYMMDD'),
        paymode: docForOrder.moneyfrom,
        borrowid: docForOrder.borrowid,
        price: docForOrder.bidprice,
        quantity: docForOrder.quantity,
        money: docForOrder.total
      };
    }

    //卖
    if (bors == 's') {
      //钱包有足够的货币
      criteriaForWallet[fieldForCoinBalance] = {$gte: quantity};
      //文档--钱包（冻结货币）
      docForWallet[fieldForCoinBalance] = Sequelize.literal(`cast(${fieldForCoinBalance} - ${quantity} as decimal(11, ${config.coin[coinType].decimal}))`);
      docForWallet[fieldForCoinBalanceFrozen] = Sequelize.literal(`cast(${fieldForCoinBalanceFrozen} + ${quantity} as decimal(11, ${config.coin[coinType].decimal}))`);
      //文档--流水
      docForFund = {
        transNumber: ids[1],
        username: docForOrder.username,
        orderid: docForOrder.orderid,
        fundmoneystatus: 'sellfrozen',
        curr_type: config.coin[coinType].code,
        addorminus: 'minus',
        actiondate: moment().format('YYYYMMDD'),
        paymode: docForOrder.moneyfrom,
        borrowid: docForOrder.borrowid,
        price: docForOrder.bidprice,
        quantity: docForOrder.quantity,
        money: docForOrder.total
      };
    }

    //事务
    return Sequelize.transaction(t => {

      //钱包
      return Wallet.update(docForWallet, {where: criteriaForWallet, transaction: t}).then(data => {
        //coin数量不足
        if (data[0] != 1) throw new Error('货币数量不足');
        //下单
        return Orderlist_bid.create(docForOrder, {transaction: t});
      }).then(data => {
        docForOrder = data;
        //   //订单插入队列
        //   const MQ = new MsgService(process.env.QUEUE_ORDER);
        //   if (!isInQueue) return Promise.resolve();
        //   //插入队列
        //   const msg = {type: process.env.QUEUE_ORDER_TYPE_ORDER, id: docForOrder.id, bors: docForOrder.bors};
        //   return MQ.enQueue(msg, 8, 1);
        // }).then(() => {
        //插入流水
        return Fund_in_out.create(docForFund, {transaction: t});
      });
    }).then(() => {

      if (isInQueue) {
        //订单插入队列
        const MQ = new MsgService(process.env.QUEUE_ORDER);
        //插入队列
        const msg = {type: process.env.QUEUE_ORDER_TYPE_ORDER, id: docForOrder.id, bors: docForOrder.bors};
        MQ.enQueue(msg, 8, 0);
      }

      //插入跟投队列
      util_queue.insert('followInvest', docForOrder);

      /**
       * 推送钱包金额变动消息
       */
      service_master_register.pushAllWallet(server, borrowid, username);

      /**
       * 更新用户交易信息
       */
      if (moneyfrom == 'w') service_master_register.setTradedExchangesAndTradedCoins(server, username, tradePlatform, coinType);

      /**
       * 更新交易所、货币领投人数量
       */
      this.setLeaderCountForExchangeAndCoin(server, docForOrder);

      // /**
      //  * 推送深度
      //  */
      // this.pushDepth(server, coinType);
      //
      // /**
      //  * 行情
      //  */
      // this.pushTicker(server, coinType);

      return Promise.resolve(docForOrder);
    });
  });
};

/**
 * 创建匹配订单
 *
 * 创建好后插入撮合队列
 * 可以把匹配订单拆成多个
 *
 * @param server
 * @param order 需要匹配的订单
 * @param lastprice 最新成交价（对应对比行情的成交价）
 * @param isInQueue 是否进入队列（对手单默认进入队列）
 */
exports.createMatchOrder = (server, order, lastprice, isInQueue = 1, isAutoMath = 1) => {

  //下单机器帐号数组
  const ORDER_ROBOT_ACCOUNTS = process.env.ORDER_ROBOT_ACCOUNTS.split(';');
  //帐号
  const acount = ORDER_ROBOT_ACCOUNTS[Math.round(Math.random() * (ORDER_ROBOT_ACCOUNTS.length - 1))].split(',');


  let matchOrder = {};

  let coinType;

  for (let key in config.coin) {
    if (config.coin[key].code == order.curr_type) coinType = config.coin[key].name;
  }

  const decimal = config.coin[coinType].decimal;
  const moneyfrom = 'w';
  const bors = order.bors == 's' ? 'b' : 's';
  const bidprice = lastprice;
  const isMarket = 0;
  const isMatch = 1;
  const isRobot = 1;

  let quantity = Number(Number(order.quantity - order.nowquantity).toFixed(decimal));

  //如果买单是市价单，数量通过购买金额计算
  if (order.isMarket == 1 && order.bors == 'b') {
    quantity = Number((Number(order.total - order.nowdealtotal) / lastprice).toFixed(decimal));
  }

  //委托
  return service_orderlist_bid.save(server, acount[0], moneyfrom, 0, coinType, bors, quantity, bidprice, null, isMarket, isMatch, isInQueue, isRobot).then(data => {
    matchOrder = data;
    logger.info('created match order for not trans order', matchOrder.orderid);
    //修改订单为匹配过的订单
    return order.update({isMatched: 1});
  }).then(() => {
    logger.info('update not trans order status', order.orderid);
    //撮合
    if (isAutoMath) return this.match(server, matchOrder, order);
    return Promise.resolve();
  }).then(() => {
    return Promise.resolve(matchOrder);
  });

};

/**
 * 撮合订单
 *
 * 促销信息
 * { on: { title: '开起促销', value: '1' },
    rate: { title: '奖金比例', value: 0.002 },
    count: { title: '奖金次数/人/天', value: 4 },
    bonus: { title: '奖金金额/人/天', value: 200 },
    amount: { title: '最低成交金额', value: 1000 }
  }
 *
 * @param server
 * @param order1
 * @param order2
 * @returns {Promise.<TResult>}
 */
exports.match = (server, order1, order2) => {

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];
  const Master_register = DB.getModel('master_register');
  const Borrowlist = DB.getModel('borrowlist');
  const AutoInvest = DB.getModel('autoInvest');
  const Orderlist_bid = DB.getModel('orderlist_bid');
  const Orderlist_bid_log = DB.getModel('orderlist_bid_log');
  const Fund_in_out = DB.getModel('fund_in_out');
  const Realtimeprice = DB.getModel('realtimeprice');
  const Realtimeprice_log = DB.getModel('realtimeprice_log');
  const Promotion = DB.getModel('promotion');

  let buyOrder, sellOrder;
  if (order1.bors == 'b' && order2.bors == 's') {
    buyOrder = order1;
    sellOrder = order2;
  }
  if (order1.bors == 's' && order2.bors == 'b') {
    buyOrder = order2;
    sellOrder = order1;
  }
  if (!buyOrder || !sellOrder) throw new Error('order wrong');

  //货币类型
  let coinType;

  for (let key in config.coin) {
    if (config.coin[key].code == buyOrder.curr_type) coinType = config.coin[key].name;
  }

  //字段名称（货币余额）
  const fieldForCoinBalance = config.coin[coinType].field_prefix + '_balance';
  //字段名称（货币余额--冻结）
  const fieldForCoinBalanceFrozen = config.coin[coinType].field_prefix + '_balance_f';
  //交易货币数量小数位数
  const decimal = config.coin[coinType].decimal;

  //查询买卖双方的钱包
  let queryBuyer, querySeller, ModelWalletBuyer, ModelWalletSeller;

  if (buyOrder.moneyfrom == 'w') {
    ModelWalletBuyer = Master_register;
    queryBuyer = {username: buyOrder.username};
  } else if (buyOrder.moneyfrom == 'c') {
    ModelWalletBuyer = Borrowlist;
    queryBuyer = {borrowid: buyOrder.borrowid};
  } else {
    ModelWalletBuyer = AutoInvest;
    queryBuyer = {autoInvestId: buyOrder.borrowid};
  }

  if (sellOrder.moneyfrom == 'w') {
    ModelWalletSeller = Master_register;
    querySeller = {username: sellOrder.username};
  } else if (sellOrder.moneyfrom == 'c') {
    ModelWalletSeller = Borrowlist;
    querySeller = {borrowid: sellOrder.borrowid};
  } else {
    ModelWalletSeller = AutoInvest;
    querySeller = {autoInvestId: buyOrder.borrowid};
  }

  let orderlist_bid_log;
  let lastprice;
  let promotion = {on: {value: 0}};
  //当日实际交易次数（完全成交和部分成交的订单）
  let buyerMatchCount = 0;
  let sellerMatchCount = 0;
  //当日获得奖金次数
  let buyerBonusCount = 0;
  let sellerBonusCount = 0;
  //当日获得奖金总额
  let buyerHasBonus = 0;
  let sellerHasBonus = 0;
  //本次撮合应得奖金数额
  let buyerBonus = 0;
  let sellerBonus = 0;
  //本次撮合应扣手续费数额
  let buyerTransFee = 0;
  let sellerTransFee = 0;
  //交易流水号
  let array_transNumber;
  //交易奖金流水号
  let array_transNumber_bonus;
  //交易撮合流水号
  let array_transNumber_match;
  //买家钱包
  let walletBuyer;
  //卖家钱包
  let walletSeller;

  let transQuantity, tranPrice, transTotal, surplusQuantity;

  const startTimeForToday = new Date(moment(moment().format('YYYYMMDD')));

  logger.info('查询最新成交价');
  //最新成交价
  return client.hgetAsync(['lastprice', coinType]).then(data => {
    lastprice = data;

    logger.info('查询买卖双发当天有效委托次数（实际成交数量>0）');
    //查询买卖双发当天有效委托次数（实际成交数量>0）
    const task = [];
    if (buyOrder.moneyfrom == 'w') {
      task.push(Orderlist_bid.count({
        where: {
          username: buyOrder.username,
          nowquantity: {$gt: 0},
          createdAt: {$gte: startTimeForToday}
        }
      }));
    } else {
      task.push(Promise.resolve(0));
    }
    if (sellOrder.moneyfrom == 'w') {
      task.push(Orderlist_bid.count({
        where: {
          username: sellOrder.username,
          nowquantity: {$gt: 0},
          createdAt: {$gte: startTimeForToday}
        }
      }));
    } else {
      task.push(Promise.resolve(0));
    }
    return Promise.all(task);
  }).then(datas => {
    buyerMatchCount = datas[0];
    sellerMatchCount = datas[1];

    logger.info('查询买卖双发当天撮合数量、获得奖金金额');
    //查询买卖双发当天撮合数量、获得奖金金额
    return Fund_in_out.findAll({
      raw: true,
      attributes: [
        'username',
        [Sequelize.fn('SUM', Sequelize.col('money')), 'bonus'],
        [Sequelize.fn('COUNT', 1), 'count'],
      ],
      where: {
        username: [sellOrder.username, buyOrder.username],
        fundmoneystatus: 'feebonus',
        createdAt: {$gte: startTimeForToday}
      },
      group: 'username'
    });
  }).then(data => {
    data.forEach(item => {
      if (item.username == buyOrder.username) {
        buyerBonusCount = item.count;
        buyerHasBonus = item.bonus;
      }
      if (item.username == sellOrder.username) {
        sellerBonusCount = item.count;
        sellerHasBonus = item.bonus;
      }
    });

    logger.info('获取交易促销信息（TRANS_BONUS）');
    //获取交易促销信息（TRANS_BONUS）
    return Promotion.findOne({
      where: {code: 'TRANS_BONUS'}
    });
  }).then(data => {
    if (data) promotion = JSON.parse(data.doc);

    logger.info('获取流水号');
    //获取流水号
    return Promise.all([
      util_IDGenerator.gets('fund_in_out', 5, buyOrder.curr_type),
      util_IDGenerator.gets('fund_in_out', 3, 0),
      util_IDGenerator.gets('orderlist_bid_log', 1, buyOrder.curr_type)
    ]);
  }).then(data => {
    array_transNumber = data[0];
    array_transNumber_bonus = data[1];
    array_transNumber_match = data[2];

    //事务
    return Sequelize.transaction(t => {

      return Promise.all([
        ModelWalletBuyer.findOne({where: queryBuyer, transaction: t}),
        ModelWalletSeller.findOne({where: querySeller, transaction: t})
        // ModelWalletBuyer.findOne({where: {id: datas[0].id}, forUpdate: true, transaction: t}),
        // ModelWalletSeller.findOne({where: {id: datas[1] ? datas[1].id : null}, forUpdate: true, transaction: t})
      ]).then(datas => {
        //钱包不存在
        // if (!datas[0] || !datas[1]) return Promise.reject(new Error('not found'));
        if (!datas[0]) return Promise.reject(new Error('walletBuyer not found'));
        if (!datas[1]) return Promise.reject(new Error('walletSeller not found'));

        //买家钱包
        walletBuyer = datas[0];
        //卖家钱包
        walletSeller = datas[1];
        //买入订单剩余成交数量
        let leftQuantityBuyOrder;
        //卖出订单剩余成交数量
        let leftQuantitySellOrder;

        //买卖都不是市价单
        if (buyOrder.isMarket == 0 && sellOrder.isMarket == 0) {

          //买入订单剩余成交数量
          leftQuantityBuyOrder = Number(Number(buyOrder.quantity - buyOrder.nowquantity).toFixed(decimal));
          //卖出订单剩余成交数量
          leftQuantitySellOrder = Number(Number(sellOrder.quantity - sellOrder.nowquantity).toFixed(decimal));
          //获取两笔订单剩余交易数量最小值作为本次交易的交易数量
          transQuantity = leftQuantityBuyOrder < leftQuantitySellOrder ? leftQuantityBuyOrder : leftQuantitySellOrder;
          //交易价格（挂单早的为准）
          if (buyOrder.id > sellOrder.id) tranPrice = sellOrder.bidprice;
          if (buyOrder.id < sellOrder.id) tranPrice = buyOrder.bidprice;
          //成交总价（成交数量*卖出订单单价）
          transTotal = Number(Number(transQuantity * tranPrice).toFixed(2));

        }

        //买卖都是市价单
        if (buyOrder.isMarket == 1 && sellOrder.isMarket == 1) {

          //成交价格以市场价的最新成交价计算
          tranPrice = lastprice;

          //买入订单剩余成交数量
          leftQuantityBuyOrder = util_number.floor(Number(buyOrder.total - buyOrder.nowdealtotal) / tranPrice, decimal);
          //卖出订单剩余成交数量
          leftQuantitySellOrder = Number(Number(sellOrder.quantity - sellOrder.nowquantity).toFixed(decimal));
          //获取两笔订单剩余交易数量最小值作为本次交易的交易数量
          transQuantity = leftQuantityBuyOrder < leftQuantitySellOrder ? leftQuantityBuyOrder : leftQuantitySellOrder;
          // //成交总价（交易数量以卖方为准：成交数量*卖出订单单价，交易数量以买方为准：买方剩余购买额）（买方剩余交易数量可能存在误差）
          // transTotal = leftQuantityBuyOrder <= leftQuantitySellOrder ? Number(Number(buyOrder.total - buyOrder.nowdealtotal).toFixed(2)) : Number(Number(transQuantity * tranPrice).toFixed(2));
          //成交总价（成交数量*卖出订单单价）
          transTotal = Number(Number(transQuantity * tranPrice).toFixed(2));
          //实际成交总价
          const transTotal_ = transQuantity * tranPrice;
          //剩余购买数量
          surplusQuantity = util_number.floor(Number(buyOrder.total - buyOrder.nowdealtotal - transTotal_) / tranPrice, decimal);

        }

        //买单是市价单
        if (buyOrder.isMarket == 1 && sellOrder.isMarket == 0) {

          //成交价格以卖方为准
          tranPrice = sellOrder.bidprice;

          //买入订单剩余成交数量
          leftQuantityBuyOrder = util_number.floor(Number(buyOrder.total - buyOrder.nowdealtotal) / tranPrice, decimal);
          //卖出订单剩余成交数量
          leftQuantitySellOrder = Number(Number(sellOrder.quantity - sellOrder.nowquantity).toFixed(decimal));
          //获取两笔订单剩余交易数量最小值作为本次交易的交易数量
          transQuantity = leftQuantityBuyOrder < leftQuantitySellOrder ? leftQuantityBuyOrder : leftQuantitySellOrder;
          // //成交总价（交易数量以卖方为准：成交数量*卖出订单单价，交易数量以买方为准：买方剩余购买额）（买方剩余交易数量可能存在误差）
          // transTotal = leftQuantityBuyOrder <= leftQuantitySellOrder ? Number(Number(buyOrder.total - buyOrder.nowdealtotal).toFixed(2)) : Number(Number(transQuantity * tranPrice).toFixed(2));
          //成交总价（成交数量*卖出订单单价）
          transTotal = Number(Number(transQuantity * tranPrice).toFixed(2));
          //实际成交总价
          const transTotal_ = transQuantity * tranPrice;
          //剩余购买数量
          surplusQuantity = util_number.floor(Number(buyOrder.total - buyOrder.nowdealtotal - transTotal_) / tranPrice, decimal);

        }

        //卖单是市价单
        if (buyOrder.isMarket == 0 && sellOrder.isMarket == 1) {

          //成交价格以买方为准
          tranPrice = buyOrder.bidprice;

          //买入订单剩余成交数量
          leftQuantityBuyOrder = Number(Number(buyOrder.quantity - buyOrder.nowquantity).toFixed(decimal));
          //卖出订单剩余成交数量
          leftQuantitySellOrder = Number(Number(sellOrder.quantity - sellOrder.nowquantity).toFixed(decimal));
          //获取两笔订单剩余交易数量最小值作为本次交易的交易数量
          transQuantity = leftQuantityBuyOrder < leftQuantitySellOrder ? leftQuantityBuyOrder : leftQuantitySellOrder;
          //成交总价（成交数量*卖出订单单价）
          transTotal = Number(Number(transQuantity * tranPrice).toFixed(2));

        }

        //如果撮合数量为0则有一方委托单状态需要修改为完全成交
        if (transQuantity == 0) {
          const Order = leftQuantityBuyOrder < leftQuantitySellOrder ? buyOrder : sellOrder;
          return Order.update({status: 2}, {transaction: t});
        }

        //买家交易手续费（当天有效交易超过10次的收取手续费）扣除所买的货币
        if (buyerMatchCount > 10) buyerTransFee = Number((transQuantity * TRANS_FEE_RATE).toFixed(decimal));
        //买家交易手续费（当天有效交易超过10次的收取手续费）扣除获得的金额
        if (sellerMatchCount > 10) sellerTransFee = Number((transTotal * TRANS_FEE_RATE).toFixed(2));

        //买入订单修改文档
        let buyOrderDoc = {
          nowquantity: Number(Number(buyOrder.nowquantity + transQuantity).toFixed(decimal)),
          nowdealtotal: Number(Number(buyOrder.nowdealtotal + transTotal).toFixed(2))
        };
        //如果当前成交量达到下单量，订单状态修改为已成交
        if (buyOrderDoc.nowquantity == buyOrder.quantity) buyOrderDoc.status = 2;//买入订单修改文档
        //如果当前成交额达到购买额，订单状态修改为已成交（市价单）
        if (buyOrderDoc.nowdealtotal == buyOrder.total) buyOrderDoc.status = 2;//买入订单修改文档
        //如果剩余金额购买的数量为零，订单状态修改为已成交（市价单）
        if (surplusQuantity == 0) buyOrderDoc.status = 2;//买入订单修改文档


        //卖出订单修改文档
        let sellOrderDoc = {
          nowquantity: Number(Number(sellOrder.nowquantity + transQuantity).toFixed(decimal)),
          nowdealtotal: Number(Number(sellOrder.nowdealtotal + transTotal).toFixed(2))
        };
        //如果当前成交量达到下单量，订单状态修改为已成交
        if (sellOrderDoc.nowquantity == sellOrder.quantity) sellOrderDoc.status = 2;


        //买家钱包修改文档（从rmb_balance_f冻结资金中扣除本次交易金额，增加持有交易货币数量）
        let buyWalletDoc = {
          rmb_balance_f: Sequelize.literal(`cast(rmb_balance_f - ${transTotal} as decimal(11, 2))`)
        };
        queryBuyer.rmb_balance_f = {$gte: transTotal};
        //如果订单完全成交则累加对应钱包的交易数量
        if (buyOrderDoc.status == 2) buyWalletDoc.tradeCount = Sequelize.literal(`cast(tradeCount + 1 as decimal(11))`);
        //买家交易奖金（用户订单、订单完全成交、交易奖金开起、日交易数量未达到每日赠送奖金数量上限、交易金额达到最低限额、当天获得交易奖金未超过上限、订单由我的钱包进行交易）
        if (buyOrder.isRobot == 0 && buyOrderDoc.status == 2 && promotion.on.value == 1 && buyerBonusCount < promotion.count.value && buyOrderDoc.nowdealtotal >= promotion.amount.value && buyerHasBonus < promotion.bonus.value && buyOrder.moneyfrom == 'w') {
          buyerBonus = Number(Number(buyOrderDoc.nowdealtotal * promotion.rate.value).toFixed(2));
          //每天交易奖金上限判断
          if (buyerBonus + buyerHasBonus > promotion.bonus.value) buyerBonus = Number(Number(promotion.bonus.value - buyerHasBonus).toFixed(2));
          //添加奖金
          buyWalletDoc.rmb_balance = Sequelize.literal(`cast(rmb_balance + ${buyerBonus} as decimal(11, 2))`);
        }
        //当买入订单已完全成交，且实际交易金额小余委托金额时，解冻剩余资金
        if (buyOrderDoc.status == 2 && buyOrderDoc.nowdealtotal < buyOrder.total) {
          //剩余资金
          let leftFund = Number(Number(buyOrder.total - buyOrderDoc.nowdealtotal).toFixed(2));
          //解冻
          buyWalletDoc.rmb_balance_f = Sequelize.literal(`cast(rmb_balance_f - ${transTotal + leftFund} as decimal(11, 2))`);
          //恢复持有金额
          buyWalletDoc.rmb_balance = Sequelize.literal(`cast(rmb_balance + ${leftFund + buyerBonus} as decimal(11, 2))`);
        }
        //货币
        buyWalletDoc[fieldForCoinBalance] = Sequelize.literal(`cast(${fieldForCoinBalance} + ${transQuantity - buyerTransFee} as decimal(11, ${decimal}))`);


        //卖家钱包修改文档（从btc_balance_f或bt2_balance_f冻结数量中扣除本次交易数量，增加持有资金数量）
        let sellWalletDoc = {
          rmb_balance: Sequelize.literal(`cast(rmb_balance + ${transTotal - sellerTransFee} as decimal(11, 2))`)
        };
        //如果订单完全成交则累加对应钱包的交易数量
        if (sellOrderDoc.status == 2) sellWalletDoc.tradeCount = Sequelize.literal(`cast(tradeCount + 1 as decimal(11))`);
        //卖家交易奖金（用户订单、订单完全成交、交易奖金开起、日交易数量未达到每日赠送奖金数量上限、交易金额达到最低限额、当天获得交易奖金未超过上限、订单由我的钱包进行交易）
        if (sellOrder.isRobot == 0 && sellOrderDoc.status == 2 && promotion.on.value == 1 && sellerBonusCount < promotion.count.value && sellOrderDoc.nowdealtotal >= promotion.amount.value && sellerHasBonus < promotion.bonus.value && sellOrder.moneyfrom == 'w') {
          sellerBonus = Number(Number(sellOrderDoc.nowdealtotal * promotion.rate.value).toFixed(2));
          //每天交易奖金上限判断
          if (sellerBonus + sellerHasBonus > promotion.bonus.value) sellerBonus = Number(Number(promotion.bonus.value - sellerHasBonus).toFixed(2));
          //添加奖金
          sellWalletDoc.rmb_balance = Sequelize.literal(`cast(rmb_balance + ${transTotal + sellerBonus - sellerTransFee} as decimal(11, 2))`)
        }
        //货币
        sellWalletDoc[fieldForCoinBalanceFrozen] = Sequelize.literal(`cast(${fieldForCoinBalanceFrozen} - ${transQuantity} as decimal(11, ${decimal}))`);
        querySeller[fieldForCoinBalanceFrozen] = {$gte: transQuantity};

        //订单撮合日志文档
        let orderLogDoc = {
          transNumber: array_transNumber_match[0],
          transType: order2.bors == 'b' ? 'buy' : 'sell',
          coinType: config.coin[coinType].name,
          buyOrderId: buyOrder.orderid,
          sellOrderId: sellOrder.orderid,
          quantity: transQuantity,
          transPrice: tranPrice,
          total: transTotal
        };

        //买家RMB变动日志（fund_in_out）（RMB减少）
        let buyFundForRMBDoc = {
          transNumber: array_transNumber[0],
          username: buyOrder.username,
          orderid: buyOrder.orderid,
          fundmoneystatus: 'buysucc',
          curr_type: 0,
          addorminus: 'minus',
          actiondate: moment().format('YYYYMMDD'),
          paymode: buyOrder.moneyfrom,
          borrowid: buyOrder.borrowid,
          price: sellOrder.bidprice,
          quantity: transQuantity,
          money: transTotal
        };
        //买家交易货币变动日志（fund_in_out）（持有货币增加）
        let buyFundForCoinDoc = {
          transNumber: array_transNumber[1],
          username: buyOrder.username,
          orderid: buyOrder.orderid,
          fundmoneystatus: 'buysucc',
          curr_type: buyOrder.curr_type,
          addorminus: 'add',
          actiondate: moment().format('YYYYMMDD'),
          paymode: buyOrder.moneyfrom,
          borrowid: buyOrder.borrowid,
          price: sellOrder.bidprice,
          quantity: transQuantity,
          money: transTotal
        };


        //卖家RMB变动日志（fund_in_out）（RMB增加）
        let sellFundForRMBDoc = {
          transNumber: array_transNumber[2],
          username: sellOrder.username,
          orderid: sellOrder.orderid,
          fundmoneystatus: 'sellsucc',
          curr_type: 0,
          addorminus: 'add',
          actiondate: moment().format('YYYYMMDD'),
          paymode: sellOrder.moneyfrom,
          borrowid: sellOrder.borrowid,
          price: sellOrder.bidprice,
          quantity: transQuantity,
          money: transTotal
        };
        //卖家交易货币变动日志（fund_in_out）（持有货币减少）
        let sellFundForCoinDoc = {
          transNumber: array_transNumber[3],
          username: sellOrder.username,
          orderid: sellOrder.orderid,
          fundmoneystatus: 'sellsucc',
          curr_type: buyOrder.curr_type,
          addorminus: 'minus',
          actiondate: moment().format('YYYYMMDD'),
          paymode: sellOrder.moneyfrom,
          borrowid: sellOrder.borrowid,
          price: sellOrder.bidprice,
          quantity: transQuantity,
          money: transTotal
        };

        //买家交易奖金流水文档
        let buyFundForBonusDoc;
        if (buyerBonus > 0) buyFundForBonusDoc = {
          transNumber: array_transNumber_bonus[0],
          username: buyOrder.username,
          orderid: buyOrder.orderid,
          fundmoneystatus: 'feebonus',
          curr_type: 0,
          addorminus: 'add',
          actiondate: moment().format('YYYYMMDD'),
          paymode: buyOrder.moneyfrom,
          borrowid: buyOrder.borrowid,
          price: 0,
          quantity: 0,
          money: buyerBonus
        };

        //卖家交易奖金流水文档
        let sellFundForBonusDoc;
        if (sellerBonus > 0) sellFundForBonusDoc = {
          transNumber: array_transNumber_bonus[1],
          username: sellOrder.username,
          orderid: sellOrder.orderid,
          fundmoneystatus: 'feebonus',
          curr_type: 0,
          addorminus: 'add',
          actiondate: moment().format('YYYYMMDD'),
          paymode: sellOrder.moneyfrom,
          borrowid: sellOrder.borrowid,
          price: 0,
          quantity: 0,
          money: sellerBonus
        };

        //买家交易手续费流水文档
        let buyFundForTransFeeDoc;
        if (buyerTransFee > 0) buyFundForTransFeeDoc = {
          transNumber: array_transNumber[4],
          username: buyOrder.username,
          orderid: buyOrder.orderid,
          fundmoneystatus: 'service',
          curr_type: buyOrder.curr_type,
          addorminus: 'minus',
          actiondate: moment().format('YYYYMMDD'),
          paymode: buyOrder.moneyfrom,
          borrowid: buyOrder.borrowid,
          price: 0,
          quantity: buyerTransFee,
          money: buyerTransFee
        };
        //卖家交易手续费流水文档
        let sellFundForTransFeeDoc;
        if (sellerTransFee > 0) sellFundForTransFeeDoc = {
          transNumber: array_transNumber_bonus[2],
          username: sellOrder.username,
          orderid: sellOrder.orderid,
          fundmoneystatus: 'service',
          curr_type: 0,
          addorminus: 'minus',
          actiondate: moment().format('YYYYMMDD'),
          paymode: sellOrder.moneyfrom,
          borrowid: sellOrder.borrowid,
          price: 0,
          quantity: sellerTransFee,
          money: sellerTransFee
        };

        logger.info('修改订单');
        //修改订单
        return Promise.all([
          buyOrder.update(buyOrderDoc, {transaction: t}),
          sellOrder.update(sellOrderDoc, {transaction: t})
        ]).then(datas => {
          logger.info('撮合日志');
          //撮合日志
          return Orderlist_bid_log.create(orderLogDoc, {transaction: t});
        }).then(data => {
          orderlist_bid_log = data;
          logger.info('钱包金额变动');
          console.log(queryBuyer);
          console.log(querySeller);
          //钱包金额变动
          return Promise.all([
            ModelWalletBuyer.update(buyWalletDoc, {where: queryBuyer, transaction: t}),
            ModelWalletSeller.update(sellWalletDoc, {where: querySeller, transaction: t})
          ]);
        }).then(datas => {
          console.log(datas);
          if (datas[0][0] != 1 || datas[1][0] != 1) throw new Error('wrong');
          logger.info('资金进出');
          //资金进出
          const docs = [buyFundForRMBDoc, buyFundForCoinDoc, sellFundForRMBDoc, sellFundForCoinDoc];
          if (buyFundForBonusDoc) docs.push(buyFundForBonusDoc);
          if (sellFundForBonusDoc) docs.push(sellFundForBonusDoc);
          if (buyerTransFee) docs.push(buyFundForTransFeeDoc);
          if (sellerTransFee) docs.push(sellFundForTransFeeDoc);
          return Fund_in_out.bulkCreate(docs, {transaction: t});
        }).then(() => {
          logger.info('最新成交价');
          client.hsetAsync(['lastprice', coinType, tranPrice]);
          return Realtimeprice.update({lastprice: tranPrice}, {where: {currencytype: order1.curr_type}});
        });
      });
    }).then(data => {
      //事务成功

      // //最新成交价
      // Realtimeprice.update({lastprice: tranPrice}, {where: {currencytype: order1.curr_type}});

      //推送最新交易
      if (orderlist_bid_log) socketUtil.emit('trades', _.pick(orderlist_bid_log, config.attributes.orderlist_bid_log.detail));

      //推送ticker
      this.pushTicker(server, coinType);

      //给撮合订单双方推送订单交易消息
      console.log('****************给撮合订单双方推送消息********************');
      console.log(order1.username);
      console.log(order2.username);
      socketUtil.send(order1.username, 'transOrder', order1);
      socketUtil.send(order2.username, 'transOrder', order2);

      //推送钱包金额变动消息
      [order1, order2].forEach(order => {
        service_master_register.pushAllWallet(server, order.borrowid, order.username);
      });

      //交易完全成交微信模板消息推送
      if (buyOrder.status == 2 && walletBuyer.subscribe == 1) util_weChat.sendTemplateMsgForMatch('bitekuang', walletBuyer.openid, walletBuyer.username, 'buy', coinType, buyOrder.nowquantity, buyOrder.nowdealtotal, new Date());
      if (sellOrder.status == 2 && walletSeller.subscribe == 1) util_weChat.sendTemplateMsgForMatch('bitekuang', walletSeller.openid, walletSeller.username, 'sell', coinType, sellOrder.nowquantity, sellOrder.nowdealtotal, new Date());

      //累加交易奖金
      if (buyerBonus > 0) service_transBonusLog.add(server, buyerBonus).catch(err => logger.error(err));
      if (sellerBonus > 0) service_transBonusLog.add(server, sellerBonus).catch(err => logger.error(err));

      //推送竞赛钱包交易记录
      const buyOrder_ = JSON.parse(JSON.stringify(buyOrder));
      const sellOrder_ = JSON.parse(JSON.stringify(sellOrder));
      buyOrder_.username = util_string.hidePhoneNumber(buyOrder_.username);
      sellOrder_.username = util_string.hidePhoneNumber(sellOrder_.username);
      if (buyOrder_.moneyfrom == 'c' && walletBuyer.borrowtype == 2 && !/^demo.*/.test(walletBuyer.username)) socketUtil.emit('transOrderForBorrowRace', buyOrder_);
      if (sellOrder_.moneyfrom == 'c' && walletSeller.borrowtype == 2 && !/^demo.*/.test(walletSeller.username)) socketUtil.emit('transOrderForBorrowRace', sellOrder_);

      //返回撮合的订单
      return Promise.resolve([order1, order2]);
    });
  })
};

/**
 * 成交
 *
 * 委买
 *    钱包》》扣除冻结资金
 *    流水》》扣除冻结资金
 *    订单》》增加货币数量
 * 委卖
 *    钱包》》增加卖出总额
 *    流水》》增加卖出总额
 *    订单》》扣除货币数量
 * 修改委托状态
 *
 *
 * @param server
 * @param order
 */
exports.deal = (server, order, price) => {

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];
  const Master_register = DB.getModel('master_register');
  const FollowInvest = DB.getModel('followInvest');
  const Orderlist_bid = DB.getModel('orderlist_bid');
  const Fund_in_out = DB.getModel('fund_in_out');


  //平台交易手续费
  const TRANS_FEE_RATE = Number(process.env.TRANS_FEE_RATE);

  //货币类型
  let coinType;
  for (let key in config.coin) {
    if (config.coin[key].code == order.curr_type) coinType = config.coin[key].name;
  }
  //交易货币数量小数位数
  const decimal = config.coin[coinType].decimal;
  //字段名称（货币余额）
  const fieldForCoinBalance = config.coin[coinType].field_prefix + '_balance';
  //字段名称（货币余额--冻结）
  const fieldForCoinBalanceFrozen = config.coin[coinType].field_prefix + '_balance_f';

  //钱包
  let Wallet;
  //条件
  let criteriaForWallet = {};
  let criteriaForOrder = {id: order.id};
  let criteriaForBuyOrder = {orderid: order.buyOrderid};
  //文档
  let docForWallet = {};
  let docForOrder = {};
  let docForBuyOrder = {};
  let docForFund = {};

  if (order.moneyfrom == 'w') {
    Wallet = Master_register;
    criteriaForWallet = {username: order.username};
  } else {
    Wallet = FollowInvest;
    criteriaForWallet = {followInvestId: order.borrowid};
  }

  //成交数量
  let quantity;
  //成交总额
  let total;
  //手续费
  let fee;

  /**
   * 限价单
   */
  if (order.isMarket == 0) {
    quantity = Number(Number(order.quantity - order.nowquantity).toFixed(decimal));
    total = order.bors == 'b' ? util_number.ceil(quantity * price, 2) : util_number.floor(quantity * price, 2);
  }

  /**
   * 市价单
   */
  if (order.isMarket == 1) {

    //委买
    if (order.bors == 'b') {
      total = util_number.floor(order.total - order.nowdealtotal, 2);
      quantity = util_number.floor(total / price, decimal);
    }

    //委卖
    if (order.bors == 's') {
      quantity = util_number.floor(order.quantity - order.nowquantity, decimal);
      total = util_number.ceil(quantity * price, 2);
    }
  }

  //手续费
  fee = util_number.ceil(order.bors == 'b' ? quantity * TRANS_FEE_RATE : total * TRANS_FEE_RATE, order.bors == 'b' ? decimal : 2);


  /**
   * 委买
   *    钱包》》扣除冻结资金
   *    流水》》扣除冻结资金
   *    订单》》增加货币数量
   */
  if (order.bors == 'b') {
    //剩余资金
    const leftBalance = order.total - order.nowdealtotal - total;
    //解冻资金
    const unfreezeBalance = Number(Number(total + leftBalance).toFixed(2));
    //钱包有足够的冻结资金
    criteriaForWallet.rmb_balance_f = {$gte: unfreezeBalance};
    //钱包增加未用完的资金
    docForWallet.rmb_balance = Sequelize.literal(`cast(rmb_balance + ${leftBalance} as decimal(18, 2))`);
    //钱包扣除冻结资金
    docForWallet.rmb_balance_f = Sequelize.literal(`cast(rmb_balance_f - ${unfreezeBalance} as decimal(18, 2))`);
    //增加交易次数
    docForWallet.tradeCount = Sequelize.literal(`cast(tradeCount + 1 as decimal(18))`);
    //订单增加交易货币数量（扣除手续费）
    docForOrder.coinBalance = Sequelize.literal(`cast(coinBalance + ${quantity - fee} as decimal(18, ${decimal}))`);
    //订单增加已交易数量
    docForOrder.nowquantity = Sequelize.literal(`cast(nowquantity + ${quantity} as decimal(18, ${decimal}))`);
    if (order.coinBalance) docForOrder.coinBalance = Sequelize.literal(`cast(coinBalance + ${quantity} as decimal(18, ${decimal}))`);
    if (!order.coinBalance) docForOrder.coinBalance = quantity;
    //订单增加已交易金额
    docForOrder.nowdealtotal = Sequelize.literal(`cast(nowdealtotal + ${total} as decimal(18, 2))`);
    //订单状态
    docForOrder.status = 2;
    //流水文档
    docForFund = {
      transNumber: null,
      username: order.username,
      orderid: order.orderid,
      fundmoneystatus: 'buysucc',
      curr_type: 0,
      addorminus: 'minus',
      actiondate: moment().format('YYYYMMDD'),
      paymode: order.moneyfrom,
      borrowid: order.borrowid,
      price: price,
      quantity: quantity,
      money: total
    };
  }

  /**
   * 委卖
   *    钱包》》增加卖出总额
   *    流水》》增加卖出总额
   *    订单》》扣除货币数量
   */
  if (order.bors == 's') {
    //对应的委买单有足够的冻结货币
    criteriaForBuyOrder.coinBalance_f = {$gte: quantity};
    // //钱包增加卖出总额（扣除手续费）
    // docForWallet.rmb_balance = Sequelize.literal(`cast(rmb_balance as decimal(18, 2))`);
    //增加交易次数
    docForWallet.tradeCount = Sequelize.literal(`cast(tradeCount + 1 as decimal(18))`);
    //订单增加已交易数量
    docForOrder.nowquantity = Sequelize.literal(`cast(nowquantity + ${quantity} as decimal(18, ${decimal}))`);
    //订单增加已交易金额
    docForOrder.nowdealtotal = Sequelize.literal(`cast(nowdealtotal + ${total} as decimal(18, 2))`);
    //对应的委买单》》扣除冻结货币数量
    docForBuyOrder.coinBalance_f = Sequelize.literal(`cast(coinBalance_f - ${quantity} as decimal(18, ${decimal}))`);
    //对应的委买单》》卖出金额
    docForBuyOrder.sellRMBBalance = util_number.floor(total - fee, 2);
    //订单状态
    docForOrder.status = 2;
    docForBuyOrder.status = 6;
    //流水文档
    docForFund = {
      transNumber: null,
      username: order.username,
      orderid: order.orderid,
      fundmoneystatus: 'sellsucc',
      curr_type: 0,
      addorminus: 'add',
      actiondate: moment().format('YYYYMMDD'),
      paymode: order.moneyfrom,
      borrowid: order.borrowid,
      price: price,
      quantity: quantity,
      money: total
    };
  }

  //获取流水号
  return util_IDGenerator.get('fund_in_out', order.bors == 'b' ? order.curr_type : 0).then(transNumber => {
    docForFund.transNumber = transNumber;

    //事务
    return Sequelize.transaction(t => {
      //钱包
      return Wallet.update(docForWallet, {where: criteriaForWallet, transaction: t}).then(data => {
        if (order.bors == 'b' && data[0] != 1) throw new Error('撮合失败');
        //订单
        return Orderlist_bid.update(docForOrder, {where: criteriaForOrder, transaction: t});
      }).then(data => {
        if (data[0] != 1) throw new Error('撮合失败');

        if (order.bors == 's') return Orderlist_bid.update(docForBuyOrder, {
          where: criteriaForBuyOrder,
          transaction: t
        });
        return Promise.resolve();
      }).then(data => {
        if (order.bors == 's' && data[0] != 1) throw new Error('撮合失败');
        //流水
        if (order.bors == 'b') return Fund_in_out.create(docForFund, {transaction: t});
        return Promise.resolve();
      });

    }).then(data => {
      return Orderlist_bid.findOne({where: {id: order.id}});
    }).then(data => {
      //插卖单插入队列（进行平台利益提成）
      if (order.bors == 's') util_queue.insert('commission', data);
      return Promise.resolve(data);
    });

  }).then(data => {

    //平均持仓天数
    this.updateAverageForHoldDay(server, data);

    return Promise.resolve(data);
  });

};

/**
 * 卖出（委买》》委卖）
 *
 *
 *
 * @param server
 * @param order
 */
exports.sell = (server, order, price = 0) => {

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];
  const Master_register = DB.getModel('master_register');
  const FollowInvest = DB.getModel('followInvest');
  const Orderlist_bid = DB.getModel('orderlist_bid');
  const Fund_in_out = DB.getModel('fund_in_out');


  if (order.bors == 's') throw new Error('委托类型错误');
  if (order.status != 2 && order.status != 4) throw new Error('委托状态错误');


  let criteriaForOrder = {
    id: order.id,
    status: [2, 4]
  };
  let docForOrder = {
    status: 5,
    coinBalance: 0,
    coinBalance_f: order.coinBalance
  };
  let docForSellOrder = _.pick(order, ['username', 'followUsername', 'tradePlatform', 'followOrderid', 'buyOrderid', 'profitRate', 'profitForLeader', 'commissionRate', 'curr_type', 'moneyfrom', 'borrowid']);

  docForSellOrder.buyOrderid = order.orderid;
  docForSellOrder.bors = 's';
  docForSellOrder.quantity = order.coinBalance;
  docForSellOrder.bidprice = price;
  docForSellOrder.total = util_number.floor(order.coinBalance * price, 2);
  docForSellOrder.orderdate = moment().format('YYYYMMDD');
  docForSellOrder.orderdatedetail = moment().format('YYYYMMDDHHmm');
  docForSellOrder.isMarket = price ? 0 : 1;

  //获取orderid
  return util_IDGenerator.get('orderlist_bid').then(orderid => {
    docForSellOrder.orderid = orderid;

    //事务
    return Sequelize.transaction(t => {

      return Orderlist_bid.update(docForOrder, {where: criteriaForOrder, transaction: t}).then(data => {
        if (data[0] != 1) throw new Error('委买单状态错误');
        return Orderlist_bid.create(docForSellOrder, {transaction: t});
      });
    });

  }).then(data => {
    //插入跟投队列
    if (order.moneyfrom == 'w') util_queue.insert('followInvest_sell', data);
    return Orderlist_bid.findOne({where: {id: order.id}});
  });


};

/**
 * 撤销
 *
 * @param server
 * @param order
 */
exports.cancel = (server, order) => {

  if (order.bors == 'b') return this.cancelBuyOrder(server, order);
  if (order.bors == 's') return this.cancelSellOrder(server, order);

};

/**
 * 撤销--买单
 *
 * @param server
 * @param order
 */
exports.cancelBuyOrder = (server, order) => {

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];
  const Master_register = DB.getModel('master_register');
  const FollowInvest = DB.getModel('followInvest');
  const Orderlist_bid = DB.getModel('orderlist_bid');
  const Fund_in_out = DB.getModel('fund_in_out');

  if (order.bors != 'b') throw new Error('订单类型错误');

  //钱包
  let Wallet;
  //钱包查询条件
  let criteriaWallet;
  //钱包文档
  let docForWallet = {};

  //我的钱包
  if (order.moneyfrom == 'w') {
    Wallet = Master_register;
    criteriaWallet = {
      username: order.username
    };
  }
  //跟投钱包
  if (order.moneyfrom == 'f') {
    Wallet = FollowInvest;
    criteriaWallet = {
      username: order.username,
      followInvestId: order.borrowid
    };
  }

  //解冻金额
  const unfreezeTotal = Number(Number(order.total - order.nowdealtotal).toFixed(2));

  criteriaWallet.rmb_balance_f = {$gte: unfreezeTotal};

  docForWallet.rmb_balance = Sequelize.literal(`cast(rmb_balance + ${unfreezeTotal} as decimal(18, 2))`);
  docForWallet.rmb_balance_f = Sequelize.literal(`cast(rmb_balance_f - ${unfreezeTotal} as decimal(18, 2))`);

  //事务
  return Sequelize.transaction(t => {

    //订单状态
    return Orderlist_bid.update({
      status: order.nowquantity == 0 ? 3 : 4
    }, {
      where: {id: order.id},
      transaction: t
    }).then(data => {

      //钱包
      return Wallet.update(docForWallet, {where: criteriaWallet, transaction: t});
    }).then(data => {
      if (data[0] != 1) throw new Error('冻结的资金不足');

      //获取流水号
      return util_IDGenerator.get('fund_in_out', 0);
    }).then(id => {

      //流水记录
      const docForFund = {
        transNumber: id,
        username: order.username,
        orderid: order.orderid,
        fundmoneystatus: 'frozenreturn',
        curr_type: 0,
        addorminus: 'add',
        actiondate: moment().format('YYYYMMDD'),
        paymode: order.moneyfrom,
        borrowid: order.borrowid,
        price: order.bidprice,
        quantity: 0,
        money: unfreezeTotal
      };
      return Fund_in_out.create(docForFund, {transaction: t});
    });

  }).then(() => {

    //插入跟投撤销队列
    if (order.moneyfrom == 'w') util_queue.insert('followInvest_cancel', order);
    return Orderlist_bid.findOne({where: {orderid: order.orderid}});
  });


};

/**
 * 撤销--卖单
 *
 * @param server
 * @param order
 */
exports.cancelSellOrder = (server, order) => {

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];
  const Orderlist_bid = DB.getModel('orderlist_bid');
  const Fund_in_out = DB.getModel('fund_in_out');

  if (order.bors != 's') throw new Error('订单类型错误');

  //钱包
  let Wallet;
  //钱包查询条件
  let criteriaWallet;
  //钱包文档
  let docForWallet = {};

  Wallet = Orderlist_bid;

  criteriaWallet = {
    orderid: order.buyOrderid
  };

  //货币类型
  let coinType;

  for (let key in config.coin) {
    if (config.coin[key].code == order.curr_type) coinType = config.coin[key].name;
  }

  //交易货币数量小数位数
  const decimal = config.coin[coinType].decimal;

  //解冻数量
  const unfreezeQuantity = Number(Number(order.quantity - order.nowquantity).toFixed(decimal));

  criteriaWallet.coinBalance_f = {$gte: unfreezeQuantity};

  docForWallet.coinBalance = Sequelize.literal(`cast(coinBalance + ${unfreezeQuantity} as decimal(18, ${decimal}))`);
  docForWallet.coinBalance_f = Sequelize.literal(`cast(coinBalance_f - ${unfreezeQuantity} as decimal(18, ${decimal}))`);
  docForWallet.status = 2;


  //事务
  return Sequelize.transaction(t => {

    //订单状态
    return Orderlist_bid.update({
      status: order.nowquantity == 0 ? 3 : 4
    }, {
      where: {id: order.id},
      transaction: t
    }).then(data => {

      //钱包
      return Wallet.update(docForWallet, {where: criteriaWallet, transaction: t});
    }).then(data => {
      if (data[0] != 1) throw new Error('冻结的资金不足');

      //获取流水号
      return util_IDGenerator.get('fund_in_out', 0);
    }).then(id => {

      //流水记录
      const docForFund = {
        transNumber: id,
        username: order.username,
        orderid: order.orderid,
        fundmoneystatus: 'frozenreturn',
        curr_type: 0,
        addorminus: 'add',
        actiondate: moment().format('YYYYMMDD'),
        paymode: order.moneyfrom,
        borrowid: order.borrowid,
        price: order.bidprice,
        quantity: unfreezeQuantity,
        money: 0
      };
      return Fund_in_out.create(docForFund, {transaction: t});
    });

  }).then(() => {

    //插入跟投撤销队列
    if (order.moneyfrom == 'w') util_queue.insert('followInvest_cancel', order);
    return Orderlist_bid.findOne({where: {orderid: order.orderid}});
  });

};

/**
 * 订单解冻（解冻所有未解冻的订单）
 *
 * @param server
 */
exports.unfreeze = (server) => {

  const self = this;

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];
  const Orderlist_bid = DB.getModel('orderlist_bid');

  return Orderlist_bid.findAll({
    where: {
      // isRobot: 1,
      status: 0,
      expiredAt: {$lt: new Date()}
    }
  }).then(orders => {

    logger.info('unfreeze length', orders.length);

    if (orders.length == 0) return Promise.resolve();

    let i = 0;

    let internal = {};

    internal.do = () => {
      logger.info('unfreeze order', orders[i].id);
      let start = Date.now();
      return self.unfreezeDo(server, orders[i]).then(data => {
        logger.info('unfreeze order duration', Date.now() - start);
        if (orders[++i]) return internal.do();
        return Promise.resolve();
      });
    };

    return internal.do();
  });
};

/**
 * 订单解冻（解冻指定订单）
 *
 * 订单状态
 * 钱包冻结的余额、货币数量
 * 资金出入记录
 *
 * @param server
 * @param order 解冻订单
 */
exports.unfreezeDo = (server, order) => {

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];
  const Master_register = DB.getModel('master_register');
  const Borrowlist = DB.getModel('borrowlist');
  const AutoInvest = DB.getModel('autoInvest');
  const Orderlist_bid = DB.getModel('orderlist_bid');
  const Fund_in_out = DB.getModel('fund_in_out');

  //钱包
  let Wallet;
  //钱包查询条件
  let criteriaWallet;
  let criteriaBuyOrder = {orderid: order.buyOrderid};
  //我的钱包
  if (order.moneyfrom == 'w') {
    Wallet = Master_register;
    criteriaWallet = {
      username: order.username
    };
  }
  //增金钱包
  if (order.moneyfrom == 'c') {
    Wallet = Borrowlist;
    criteriaWallet = {
      username: order.username,
      borrowid: order.borrowid
    };
  }
  //定投钱包
  if (order.moneyfrom == 't') {
    Wallet = AutoInvest;
    criteriaWallet = {
      username: order.username,
      autoInvestId: order.borrowid
    };
  }

  //货币类型
  let coinType;

  for (let key in config.coin) {
    if (config.coin[key].code == order.curr_type) coinType = config.coin[key].name;
  }
  //字段名称（货币余额）
  const fieldForCoinBalance = config.coin[coinType].field_prefix + '_balance';
  //字段名称（货币余额--冻结）
  const fieldForCoinBalanceFrozen = config.coin[coinType].field_prefix + '_balance_f';
  //交易货币数量小数位数
  const decimal = config.coin[coinType].decimal;

  //解冻数量
  const unfreezeQuantity = Number(Number(order.quantity - order.nowquantity).toFixed(decimal));
  //解冻金额
  const unfreezeTotal = Number(Number(order.total - order.nowdealtotal).toFixed(decimal));

  //文档--钱包
  const docForWallet = {};

  //买（解冻资金）
  if (order.bors == 'b') {
    const decimal = 2;
    docForWallet.rmb_balance = Sequelize.literal(`cast(rmb_balance + ${unfreezeTotal} as decimal(11, ${decimal}))`);
    docForWallet.rmb_balance_f = Sequelize.literal(`cast(rmb_balance_f - ${unfreezeTotal} as decimal(11, ${decimal}))`);
    criteriaWallet.rmb_balance_f = {$gte: unfreezeTotal};
  }

  //文档--订单
  const docForOrder = {};

  //卖（解冻货币数量）
  if (order.bors == 's') {
    docForOrder.coinBalance = Sequelize.literal(`cast(coinBalance + ${unfreezeQuantity} as decimal(11, ${decimal}))`);
    docForOrder.coinBalance_f = Sequelize.literal(`cast(coinBalance_f - ${unfreezeQuantity} as decimal(11, ${decimal}))`);
    docForOrder.status = 2;
    criteriaBuyOrder.coinBalance_f = {$gte: unfreezeQuantity};
  }

  //事务
  return Sequelize.transaction(t => {

    //订单状态
    return Orderlist_bid.update({
      status: order.nowquantity == 0 ? 3 : 4
    }, {
      where: {
        id: order.id
      },
      transaction: t
    }).then(() => {

      //钱包
      if (order.bors == 'b') return Wallet.update(docForWallet, {
        where: criteriaWallet,
        transaction: t
      });
      return Orderlist_bid.update(docForOrder, {
        where: criteriaBuyOrder,
        transaction: t
      });
    }).then(data => {
      //冻结货币数量（资金）不足
      if (data[0] != 1) {
        logger.info(criteriaWallet);
        throw new Error('冻结货币数量（资金）不足');
      }

      //获取流水号
      return util_IDGenerator.get('fund_in_out', order.curr_type);
    }).then(id => {

      //流水记录
      const docForFund = {
        transNumber: id,
        username: order.username,
        orderid: order.orderid,
        fundmoneystatus: 'frozenreturn',
        curr_type: order.bors == 'b' ? 0 : order.curr_type,
        addorminus: 'add',
        actiondate: moment().format('YYYYMMDD'),
        paymode: order.moneyfrom,
        borrowid: order.borrowid,
        price: order.bidprice,
        quantity: unfreezeQuantity,
        money: unfreezeTotal
      };
      return Fund_in_out.create(docForFund, {transaction: t});
    })

  }).then(data => {
    //事务成功

    //查询解冻的订单
    return Orderlist_bid.findOne({
      where: {id: order.id}
    });
  });
};

/**
 * 推送深度
 * @param server
 * @param coinType
 * @param size
 */
exports.pushDepth = (server, coinType, size = 5) => {


  return this.getDepth(server, coinType, size).then(data => socketUtil.emit('transTop5', data));

}

/**
 * 获取深度
 * @param server
 * @param coinType
 * @param size
 */
exports.getDepth = (server, coinType, size) => {

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];
  const Realtimeprice = DB.getModel('realtimeprice');

  const decimal = config.coin[coinType].decimal;
  const currencytype = config.coin[coinType].code;
  let lastPrice;


  //查询last
  return Realtimeprice.findOne({
    where: {currencytype}
  }).then(data => {
    lastPrice = data.lastprice;
    return Promise.all([
      //卖
      Sequelize.query(`
      select bidprice, cast(sum(quantity - nowquantity) as decimal(11, ${decimal})) as quantity from orderlist_bid
        where
          curr_type = ${currencytype}
          and bors = 's'
          and status =  0
          and isMarket =  0
          and quantity > 0
          and expiredAt >= '${moment().format('YYYY-MM-DD HH:mm:ss')}'
        group by bidprice
        having quantity > 0
        order by bidprice ASC
        limit 0, ${size}`
      ),
      //买
      Sequelize.query(`
      select bidprice, cast(sum(quantity - nowquantity) as decimal(11, ${decimal})) as quantity from orderlist_bid
        where
          curr_type =  ${currencytype}
          and bors = 'b'
          and status =  0
          and isMarket =  0
          and quantity > 0
          and expiredAt >= '${moment().format('YYYY-MM-DD HH:mm:ss')}'
        group by bidprice
        having quantity > 0
        order by bidprice DESC
        limit 0, ${size}`
      )
    ]);
  }).then(datas => {

    /**
     * 获取交易数量
     * @param end
     * @param decimal
     * @returns {number}
     */
    function getQuantity(start, end, decimal) {
      let quantity = Number(new Number(Math.random() * Math.random() * end + start).toFixed(Math.round(Math.random() * decimal)));
      if (quantity > 0) return quantity;
      return getQuantity(start, end, decimal);
    }

    //买卖数量不足size进行补足
    //卖
    if (datas[0][0].length < size) {
      let l = datas[0][0].length;
      for (let i = 0; i < size - l; i++) {
        let obj;
        if (l == 0) {
          obj = {bidprice: lastPrice + 0.01, quantity: getQuantity(1, 10, decimal)};
        } else {
          obj = JSON.parse(JSON.stringify(datas[0][0][l + i - 1]));
        }
        obj.bidprice = Number(Number(obj.bidprice + 0.01).toFixed(2));
        obj.quantity = getQuantity(obj.quantity / 2, obj.quantity, decimal);
        datas[0][0].push(obj);
      }
    }
    //买
    if (datas[1][0].length < size) {
      let l = datas[1][0].length;
      for (let i = 0; i < size - l; i++) {
        let obj;
        if (l == 0) {
          obj = {bidprice: lastPrice - 0.01, quantity: getQuantity(1, 10, decimal)};
        } else {
          obj = JSON.parse(JSON.stringify(datas[1][0][l + i - 1]));
        }
        obj.bidprice = Number(Number(obj.bidprice - 0.01).toFixed(2));
        obj.quantity = getQuantity(obj.quantity / 2, obj.quantity, decimal);
        datas[1][0].push(obj);
      }
    }


    let response = {};

    for (let key in config.coin) {
      response[key] = {
        sell: [],
        buy: []
      };
    }

    response[coinType] = {
      sell: datas[0][0],
      buy: datas[1][0]
    };

    return Promise.resolve(response);

  });

}

/**
 * 推送行情
 * @param server
 * @param coinType
 */
exports.pushTicker = (server, coinType) => {

  return this.getTicker(server, coinType).then(data => {
    data.coinType = coinType;
    return socketUtil.emit('ticker', data);
  });

}

/**
 * 获取行情
 * @param server
 * @param coinType
 * @param 截至时间
 */
exports.getTicker = (server, coinType, endTime = new Date()) => {

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];
  const Orderlist_bid_log = DB.getModel('orderlist_bid_log');
  const KLine = DB.getModel('kLine');

  const decimal = config.coin[coinType].decimal;

  const source = 'bitekuang';

  const response = {};

  return Promise.all([
    //vol,high,low
    KLine.findOne({
      raw: true,
      attributes: [
        [Sequelize.fn('SUM', Sequelize.col('vol')), 'vol'],
        [Sequelize.fn('MAX', Sequelize.col('high')), 'high'],
        [Sequelize.fn('MIN', Sequelize.col('low')), 'low']
      ],
      where: {
        coinType,
        source,
        unit: '1min',
        time: {$gte: new Date(Date.now() - 24 * 3600000).getTime(), $lte: new Date(endTime).getTime()}
      }
    }),
    //查询last
    Orderlist_bid_log.findOne({
      where: {
        coinType
      },
      order: [['id', 'DESC']]
    }),
    //深度
    this.getDepth(server, coinType, 1)
  ]).then(datas => {
    response.vol = Number(Number(datas[0].vol).toFixed(decimal));
    response.high = datas[0].high;
    response.low = datas[0].low;
    response.last = Number(datas[1].transPrice).toFixed(2);
    response.buy = datas[2][coinType].buy[0].bidprice;
    response.sell = datas[2][coinType].sell[0].bidprice;

    return Promise.resolve(response);
  });
}

/**
 * 用户--各种货交易次数
 * @param server
 * @param username
 */
exports.queryTransCount = (server, username) => {

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];
  const Orderlist_bid = DB.getModel('orderlist_bid');

  return Orderlist_bid.findAll({
    raw: true,
    attributes: [
      'curr_type',
      [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
    ],
    where: {
      username,
      moneyfrom: 'w',
      status: [2, 4]
    },
    group: 'curr_type'
  });

};

/**
 * 交易所、货币领投人数
 * @param server
 * @param order
 * @returns {*}
 */
exports.setLeaderCountForExchangeAndCoin = (server, order) => {

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];
  const Exchange = DB.getModel('exchange');
  const Coin = DB.getModel('coin');
  const Orderlist_bid = DB.getModel('orderlist_bid');


  if (order.moneyfrom != 'w') return Promise.resolve();

  return Promise.all([
    //交易所
    Orderlist_bid.count({
      where: {username: order.username, moneyfrom: 'w', tradePlatform: order.tradePlatform}
    }),
    //货币
    Orderlist_bid.count({
      where: {username: order.username, moneyfrom: 'w', curr_type: order.curr_type}
    })
  ]).then(datas => {

    const task = [];

    if (datas[0] == 1) task.push(Exchange.update({
      leaderCount: Sequelize.literal(`cast(leaderCount + 1 as decimal(11))`)
    }, {
      where: {name: order.tradePlatform}
    }));

    if (datas[1] == 1) task.push(Coin.update({
      leaderCount: Sequelize.literal(`cast(leaderCount + 1 as decimal(11))`)
    }, {
      where: {code: order.curr_type}
    }));

    return Promise.all(task);
  });

};

/**
 * 平均持仓天数
 * @param server
 * @param username
 */
exports.updateAverageForHoldDay = (server, order) => {

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];
  const Master_register = DB.getModel('master_register');
  const Orderlist_bid = DB.getModel('orderlist_bid');

  if (order.moneyfrom != 'w') return Promise.resolve();
  if (order.bors != 's') return Promise.resolve();

  let master_register;
  let buyOrder;
  let count = 0;
  let totalDay = 0;

  //钱包
  return Master_register.findOne({
    where: {username: order.username}
  }).then(data => {
    master_register = data;

    //主理订单数量
    return Orderlist_bid.count({
      where: {
        username: order.username,
        moneyfrom: 'w',
        bors: 's',
        status: 2
      }
    });
  }).then(data => {
    count = data;

    //对应买单
    return Orderlist_bid.findOne({where: {orderid: order.buyOrderid}});
  }).then(data => {
    buyOrder = data;

    if (master_register.averageForHoldDay) totalDay = master_register.averageForHoldDay * (count - 1);

    const time = new Date(order.createdAt).getTime() - new Date(buyOrder.createdAt).getTime();

    const hour = Number((time / 3600000).toFixed(1));

    const day = Number((hour / 24).toFixed(2));

    const averageForHoldDay = Number(((totalDay + day) / count).toFixed(2));

    return Master_register.update({averageForHoldDay}, {
      where: {username: order.username}
    });
  });

};

/**
 * 查询各个交易所各种货币的持有数额
 * @param server
 * @param username
 */
exports.queryHoldCount = (server, username) => {

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];
  const Orderlist_bid = DB.getModel('orderlist_bid');

  return Orderlist_bid.findAll({
    raw: true,
    attributes: [
      'tradePlatform',
      'curr_type',
      [Sequelize.literal('cast(sum(nowdealtotal) as decimal(11, 2))'), 'cost'],
      [Sequelize.literal('cast(sum(nowquantity) as decimal(18, 6))'), 'count']
    ],
    where: {username, bors: 'b', status: [2, 5]},
    group: 'tradePlatform, curr_type'
  });
};
