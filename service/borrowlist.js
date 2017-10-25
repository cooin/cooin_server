const moment = require('moment-timezone');
const service_orderlist_bid = require('./orderlist_bid');
const util_IDGenerator = require('../lib/IDGenerator');

/**
 * 赠金钱包结算
 *
 * 撤单（解冻该钱包相关的订单）
 * 如果是赠送的是RMB
 *    交易持有货币
 *        系统按照当前行情价格强行吃掉
 *    赠金饭还给平台
 *    资金盈余部分充值到用户钱包
 *    变改钱包状态
 *    插入变更记录
 *
 * @param server
 * @param doc
 * @param isUser 是否是用户
 * @returns {Promise.<T>}
 */
exports.settlement = (server, doc, isUser = 0) => {

  const self = this;

  //下单机器帐号数组
  const ORDER_ROBOT_ACCOUNTS = process.env.ORDER_ROBOT_ACCOUNTS.split(';');
  //赠金钱包最大盈利率
  const BORROWLIST_MAX_PROFIT_RATE = process.env.BORROWLIST_MAX_PROFIT_RATE;

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];


  const Master_register = DB.getModel('master_register');
  const Borrowlist = DB.getModel('borrowlist');
  const Fund_in_out = DB.getModel('fund_in_out');

  //如果是赠送的是RMB
  if (doc.borrowcurrencytype == 0) {

    logger.info('解冻--start', doc.id);
    return self.unfreeze(server, doc).then(data => {
      logger.info('解冻--end', doc.id);
      //获取新的钱包
      return Borrowlist.findOne({
        where: {id: doc.id}
      });
    }).then(data => {
      doc = data;
      logger.info('交易持有货币--start', doc.id);
      //交易持有货币
      return self.dump(server, doc);
    }).then(data => {
      logger.info('交易持有货币--end', doc.id);
      //获取新的钱包
      return Borrowlist.findOne({
        where: {id: doc.id}
      });
    }).then(data => {
      doc = data;

      //获取流水号
      return util_IDGenerator.gets('fund_in_out', 3, 0);
    }).then(data => {
      let array_transNumber = data;

      //资金盈余部分充值到用户钱包
      //赠金饭还给平台
      //变改钱包状态
      //插入变更记录
      return Sequelize.transaction(t => {
        logger.info('赠金返还给平台');

        //平台帐号
        const acount = ORDER_ROBOT_ACCOUNTS[Math.round(Math.random() * (ORDER_ROBOT_ACCOUNTS.length - 1))].split(',');

        //归还金额
        let returnTotal = 0;
        //赢利
        let profit = 0;

        //注册赠送的钱包
        if (doc.borrowtype == 1) {
          //没有赢利
          if (doc.rmb_balance <= doc.totalborrow) {
            returnTotal = doc.rmb_balance;
          } else {
            //小于最大盈利率
            if (doc.rmb_balance <= doc.totalborrow * (1 + Number(BORROWLIST_MAX_PROFIT_RATE))) {
              returnTotal = doc.totalborrow;
              profit = doc.rmb_balance - doc.totalborrow;
            } else {
              profit = doc.totalborrow * Number(BORROWLIST_MAX_PROFIT_RATE);
              returnTotal = doc.rmb_balance - profit;
            }
          }
        }
        //每周竞赛的钱包（赢利部分不加入用户钱包）
        if (doc.borrowtype == 2) {
          returnTotal = doc.rmb_balance;
        }

        // //没有赢利
        // if (doc.rmb_balance <= doc.totalborrow) {
        //   returnTotal = doc.rmb_balance;
        // } else {
        //   //小于最大盈利率
        //   if (doc.rmb_balance <= doc.totalborrow * (1 + Number(BORROWLIST_MAX_PROFIT_RATE))) {
        //     returnTotal = doc.totalborrow;
        //     profit = doc.rmb_balance - doc.totalborrow;
        //   } else {
        //     profit = doc.totalborrow * Number(BORROWLIST_MAX_PROFIT_RATE);
        //     returnTotal = doc.rmb_balance - profit;
        //   }
        // }

        returnTotal = Number(returnTotal.toFixed(2));
        profit = Number(profit.toFixed(2));

        //赠金饭还给平台
        return Master_register.update({
          rmb_balance: Sequelize.literal(`cast(rmb_balance + ${returnTotal} as decimal(11, 2))`)
        }, {
          where: {
            username: acount[0]
          },
          transaction: t
        }).then(data => {
          logger.info('资金盈余部分充值到用户钱包');
          //资金盈余部分充值到用户钱包
          if (profit == 0) return Promise.resolve();

          return Master_register.update({
            rmb_balance: Sequelize.literal(`cast(rmb_balance + ${profit} as decimal(11, 2))`)
          }, {
            where: {
              username: doc.username
            },
            transaction: t
          });
        }).then(data => {
          logger.info('变改钱包状态');
          //变改钱包状态
          return Borrowlist.update({
            totalreturn: returnTotal,
            status: isUser == 1 ? 5 : 4
          }, {
            where: {
              id: doc.id,
              status: {$notIn: [4, 5]}
            },
            transaction: t
          });
        }).then(data => {
          if (data[0] != 1) throw new Error('钱包已结算');
          logger.info('插入变更记录');
          //插入变更记录

          //赠金归还--还给平台
          let platformFundDoc = {
            transNumber: array_transNumber[0],
            username: acount[0],
            orderid: 0,
            fundmoneystatus: 'creturn',
            curr_type: 0,
            addorminus: 'add',
            actiondate: moment().format('YYYYMMDD'),
            paymode: 'c',
            borrowid: doc.borrowid,
            price: 0,
            quantity: 0,
            money: returnTotal
          };

          //赠金归还--钱包扣款
          let userFundForCDoc = {
            transNumber: array_transNumber[1],
            username: doc.username,
            orderid: 0,
            fundmoneystatus: 'creturn',
            curr_type: 0,
            addorminus: 'minus',
            actiondate: moment().format('YYYYMMDD'),
            paymode: 'c',
            borrowid: doc.borrowid,
            price: 0,
            quantity: 0,
            money: returnTotal
          };

          //赠金提现--提现到我的钱包
          let userFundForWDoc = {
            transNumber: array_transNumber[2],
            username: doc.username,
            orderid: 0,
            fundmoneystatus: 'inwallet',
            curr_type: 0,
            addorminus: 'add',
            actiondate: moment().format('YYYYMMDD'),
            paymode: 'w',
            borrowid: doc.borrowid,
            price: 0,
            quantity: 0,
            money: profit
          };

          const task = [];
          task.push(Fund_in_out.create(platformFundDoc, {transaction: t}));
          task.push(Fund_in_out.create(userFundForCDoc, {transaction: t}));
          if (profit > 0) task.push(Fund_in_out.create(userFundForWDoc, {transaction: t}));
          //资金进出
          return Promise.all(task);
        });

      }).then(() => {

        //获取新的钱包
        return Borrowlist.findOne({
          where: {id: doc.id}
        });
      }).then(data => {
        doc = data;

        return Promise.resolve(doc);
      });
    })
  }

  return Promise.resolve();
};

/**
 * 以当前行情价格出售所有货币
 * 并生成对手单进行撮合
 *
 * @param server
 * @param doc
 * @returns {Promise.<T>}
 */
exports.dump = (server, doc) => {

  let self = this;

  return Promise.all([
    self.dumpBTC(server, doc),
    self.dumpLTC(server, doc)
  ]);

};

/**
 * 以当前行情价格出售所有BTC
 * 并生成对手单进行撮合
 *
 * @param server
 * @param doc
 * @returns {Promise.<T>}
 */
exports.dumpBTC = (server, doc) => {

  //下单机器人每次购买数量范围btc
  const ORDER_ROBOT_QUANTITY_BTC = process.env.ORDER_ROBOT_QUANTITY_BTC.split(',');
  //订单过期时长
  const ORDER_EXPIRE = process.env.ORDER_EXPIRE;

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];

  const Orderlist_bid = DB.getModel('orderlist_bid');
  const Borrowlist = DB.getModel('borrowlist');
  const Realtimeprice = DB.getModel('realtimeprice');

  //没有持有货币
  if (doc.btc_balance == 0) return Promise.resolve(doc);

  let orderid;
  //获取订单ID
  return util_IDGenerator.get('orderlist_bid').then(id => {
    orderid = id;
    //查询当前行情
    return Realtimeprice.findOne({
      where: {currencytype: 1}
    });
  }).then(data => {
    let btc = data;

    let order = {
      orderid: orderid,
      username: doc.username,
      bors: 's',
      curr_type: 1,
      moneyfrom: 'c',
      borrowid: doc.borrowid,
      quantity: doc.btc_balance,
      bidprice: btc.lastprice,
      total: Number(Number(Number(doc.btc_balance) * Number(btc.lastprice)).toFixed(2)),
      orderdate: moment().format('YYYYMMDD'),
      orderdatedetail: moment().format('YYYYMMDDHHmm'),
      isRobot: 0,
      isMatched: 1,
      expiredAt: new Date((Date.now() + Number(ORDER_EXPIRE) * 60 * 60 * 1000))
    };

    return Sequelize.transaction(t => {

      logger.info('扣除对应货币数量， 并更新冻结对应货币数量');
      //扣除对应货币数量， 并更新冻结对应货币数量
      return Borrowlist.update({
        btc_balance: Sequelize.literal(`cast(btc_balance - ${order.quantity} as decimal(11, ${ORDER_ROBOT_QUANTITY_BTC[2]}))`),
        btc_balance_f: Sequelize.literal(`cast(btc_balance_f + ${order.quantity} as decimal(11, ${ORDER_ROBOT_QUANTITY_BTC[2]}))`)
      }, {
        where: {
          id: doc.id,
          btc_balance: {$gte: order.quantity}
        },
        transaction: t
      }).then(data => {
        //coin数量不足
        if (data[0] != 1) throw new Error('货币数量不足');

        logger.info('下单');
        //下单
        return Orderlist_bid.create(order, {transaction: t});
      }).then(data => {
        order = data;

        logger.info('创建对手单');
        //创建对手单
        return service_orderlist_bid.createMatchOrder(server, order, btc.lastprice, 0, 0);

      });
    }).then(data => {

      //获取transOrder model
      return Orderlist_bid.findOne({
        where: {
          orderid: data.orderid
        }
      });
    }).then(data => {

      logger.info('撮合');
      //撮合
      return service_orderlist_bid.match(server, order, data);

    }).then(data => {

      return Promise.resolve(doc);
    });
  });
};

/**
 * 以当前行情价格出售所有LTC
 * 并生成对手单进行撮合
 *
 * @param server
 * @param doc
 * @returns {Promise.<T>}
 */
exports.dumpLTC = (server, doc) => {

  //下单机器人每次购买数量范围ltc
  const ORDER_ROBOT_QUANTITY_LTC = process.env.ORDER_ROBOT_QUANTITY_LTC.split(',');
  //订单过期时长
  const ORDER_EXPIRE = process.env.ORDER_EXPIRE;

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];

  const Orderlist_bid = DB.getModel('orderlist_bid');
  const Borrowlist = DB.getModel('borrowlist');
  const Realtimeprice = DB.getModel('realtimeprice');

  //没有持有货币
  if (doc.bt2_balance == 0) return Promise.resolve(doc);

  let orderid;
  //获取订单ID
  return util_IDGenerator.get('orderlist_bid').then(id => {
    orderid = id;
    //查询当前行情
    return Realtimeprice.findOne({
      where: {currencytype: 2}
    })
  }).then(data => {
    let ltc = data;

    let order = {
      orderid: orderid,
      username: doc.username,
      bors: 's',
      curr_type: 2,
      moneyfrom: 'c',
      borrowid: doc.borrowid,
      quantity: doc.bt2_balance,
      bidprice: ltc.lastprice,
      total: Number(Number(Number(doc.bt2_balance) * Number(ltc.lastprice)).toFixed(2)),
      orderdate: moment().format('YYYYMMDD'),
      orderdatedetail: moment().format('YYYYMMDDHHmm'),
      isRobot: 0,
      isMatched: 1,
      expiredAt: new Date((Date.now() + Number(ORDER_EXPIRE) * 60 * 60 * 1000))
    };

    return Sequelize.transaction(t => {

      logger.info('扣除对应货币数量， 并更新冻结对应货币数量');
      //扣除对应货币数量， 并更新冻结对应货币数量
      return Borrowlist.update({
        bt2_balance: Sequelize.literal(`cast(bt2_balance - ${order.quantity} as decimal(11, ${ORDER_ROBOT_QUANTITY_LTC[2]}))`),
        bt2_balance_f: Sequelize.literal(`cast(bt2_balance_f + ${order.quantity} as decimal(11, ${ORDER_ROBOT_QUANTITY_LTC[2]}))`)
      }, {
        where: {
          id: doc.id,
          bt2_balance: {$gte: order.quantity}
        },
        transaction: t
      }).then(data => {
        //coin数量不足
        if (data[0] != 1) throw new Error('货币数量不足');

        //下单
        return Orderlist_bid.create(order, {transaction: t});
      }).then(data => {
        order = data;

        logger.info('创建对手单');
        //创建对手单
        return service_orderlist_bid.createMatchOrder(server, order, ltc.lastprice, 0, 0);

      });
    }).then(data => {

      //获取transOrder model
      return Orderlist_bid.findOne({
        where: {
          orderid: data.orderid
        }
      });
    }).then(data => {

      logger.info('撮合');
      //撮合
      return service_orderlist_bid.match(server, order, data);

    }).then(data => {

      return Promise.resolve(doc);
    });
  });
};

/**
 * 解冻所有订单
 *
 * 解冻指定钱包的所有未交易完成的订单
 *
 * @param server
 * @param doc
 * @returns {Promise.<T>}
 */
exports.unfreeze = (server, doc) => {

  const self = this;

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];
  const Orderlist_bid = DB.getModel('orderlist_bid');

  return Orderlist_bid.findAll({
    where: {
      moneyfrom: 'c',
      borrowid: doc.borrowid,
      status: 0
    }
  }).then(orders => {

    logger.info('unfreeze length', orders.length);

    if (orders.length == 0) return Promise.resolve(doc);

    let i = 0;

    let internal = {};

    internal.do = () => {
      logger.info('unfreeze order', orders[i].id);
      let start = Date.now();
      return service_orderlist_bid.unfreezeDo(server, orders[i]).then(data => {
        logger.info('unfreeze order duration', Date.now() - start);
        if (orders[++i]) return internal.do();
        return Promise.resolve(doc);
      });
    };

    return internal.do();
  });
};

/**
 * 拿回盈利
 *
 * 从用户余额中扣除赠金钱包的赢利
 * 改变钱包状态为赠金被取消（6），添加备注
 * 添加资金流水
 *
 *
 * @param server
 * @param doc
 * @returns {Promise.<T>}
 */
exports.takeBachProfit = (server, doc) => {

  const self = this;

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];
  const Master_register = DB.getModel('master_register');
  const Borrowlist = DB.getModel('borrowlist');
  const Fund_in_out = DB.getModel('fund_in_out');

  if (doc.status != 4 && doc.status != 5) return Promise.reject(new Error('钱包还未结算'));

  const profit = Number((doc.rmb_balance - doc.totalreturn).toFixed(2));

  if (profit == 0) return Promise.reject(new Error('该钱包未赢利'));

  return Sequelize.transaction(t => {

    //从用户余额中扣除赠金钱包的赢利
    return Master_register.update({
      rmb_balance: Sequelize.literal(`cast(rmb_balance - ${profit} as decimal(11, 2))`)
    }, {
      where: {
        username: doc.username,
        btc_balance: {$gte: profit}
      },
      transaction: t
    }).then(data => {
      //余额不足
      if (data[0] != 1) throw new Error('余额不足');

      //改变钱包状态为：赠金被取消（6）
      return Borrowlist.update({
        status: 6,
        admintxt: '未实名充值/同一用户多次获取赠金钱包/其他违反比特矿条款行为'
      }, {
        where: {
          id: doc.id,
          status: [4, 5]
        },
        transaction: t
      });
    }).then(data => {
      if (data[0] != 1) throw new Error('赠金钱包状态错误');

      //获取流水号
      return util_IDGenerator.get('fund_in_out', 0);
    }).then(data => {

      //添加资金流水
      let userFundForWDoc = {
        transNumber: data,
        username: doc.username,
        orderid: 0,
        fundmoneystatus: 'cancelforerror',
        curr_type: 0,
        addorminus: 'minus',
        actiondate: moment().format('YYYYMMDD'),
        paymode: 'w',
        borrowid: doc.borrowid,
        price: 0,
        quantity: 0,
        money: profit
      };
      return Fund_in_out.create(userFundForWDoc);
    });
  }).then(data => {

    //查询更新过后的赠金钱包
    return Borrowlist.findOne({id: doc.id});
  });

};

/**
 * 获取奖励
 *
 * 用户使用竞赛钱包交易成功满六次后可获得5元奖金（每人只限获得一次）
 *
 * 钱包判别
 *  borrowtype: 2
 *  sysinput: 5
 *
 * 用户领取后钱包sysinput改为2
 *
 * 流程
 *  改变竞赛钱包状态
 *  我的钱包充值
 *  插入流水记录
 *
 *
 * @param server
 * @param doc
 * @returns {Promise.<T>}
 */
exports.getBonus = (server, doc) => {

  const self = this;

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];
  const Master_register = DB.getModel('master_register');
  const Borrowlist = DB.getModel('borrowlist');
  const Fund_in_out = DB.getModel('fund_in_out');

  const bonus = 5;

  return Sequelize.transaction(t => {

    //改变竞赛钱包状态
    return Borrowlist.update({
      sysinput: 2
    }, {
      where: {
        id: doc.id,
        sysinput: 5
      },
      transaction: t
    }).then(data => {
      //已经领取
      if (data[0] != 1) throw new Error('已经领取过了');

      //我的钱包充值
      return Master_register.update({
        rmb_balance: Sequelize.literal(`cast(rmb_balance + ${bonus} as decimal(11, 2))`)
      }, {
        where: {
          username: doc.username
        },
        transaction: t
      });
    }).then(data => {

      //获取流水号
      return util_IDGenerator.get('fund_in_out', 0);
    }).then(data => {

      //添加资金流水
      let userFundForWDoc = {
        transNumber: data,
        username: doc.username,
        orderid: 0,
        fundmoneystatus: 'expbonus',
        curr_type: 0,
        addorminus: 'add',
        actiondate: moment().format('YYYYMMDD'),
        paymode: 'w',
        borrowid: doc.borrowid,
        price: 0,
        quantity: 0,
        money: bonus
      };
      return Fund_in_out.findOrCreate({
        where: {
          username: doc.username,
          fundmoneystatus: 'expbonus',
        },
        defaults: userFundForWDoc
      });
    }).then(data => {
      //已经领取过了
      if (!data[1]) throw new Error('已经领取过了');
    });
  }).then(data => {

    //查询更新过后的赠金钱包
    return Borrowlist.findOne({id: doc.id});
  });

};
