const config = require('../config/config');
const util_number = require('../lib/number');
const service_orderlist_bid = require('../service/orderlist_bid');
const service_transBonusLog = require('../service/transBonusLog');

exports.register = (server, options, next) => {

  //下单机器帐号数组
  const ORDER_ROBOT_ACCOUNTS = process.env.ORDER_ROBOT_ACCOUNTS.split(';');
  //下单机器下单类型
  const ORDER_ROBOT_TRANSTYPE = process.env.ORDER_ROBOT_TRANSTYPE.split(',');
  //下单机器交易货币
  const ORDER_ROBOT_COINTYPE = process.env.ORDER_ROBOT_COINTYPE.split(',');
  //下单机器价格波动幅度
  const ORDER_ROBOT_PRICE_ADJUST_RATE = Number(process.env.ORDER_ROBOT_PRICE_ADJUST_RATE);

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];
  const Realtimeprice = DB.getModel('realtimeprice');
  const Promotion = DB.getModel('promotion');

  //下单
  function order() {
    let walletType = 'w', bors, coinType, quantity, bidprice, dealpassword;

    /**
     * 初始化
     */
      //帐号
    const acount = ORDER_ROBOT_ACCOUNTS[Math.round(Math.random() * (ORDER_ROBOT_ACCOUNTS.length - 1))].split(',');
    //买或卖
    bors = ORDER_ROBOT_TRANSTYPE[Math.round(Math.random())];
    //交易货币类型
    coinType = ORDER_ROBOT_COINTYPE[util_number.random(0, ORDER_ROBOT_COINTYPE.length - 1, 0)];

    return Realtimeprice.findOne({
      where: {currencytype: config.coin[coinType].code}
    }).then(data => {
      const realtimeprice = data;
      if (!realtimeprice) return Promise.resolve();

      //浮动价格
      let floatPrice;
      //产生大单子的基数
      let quantity_max_base = 6;

      //浮动价格
      floatPrice = util_number.random(-0.001 * realtimeprice.lastprice, realtimeprice.lastprice * ORDER_ROBOT_PRICE_ADJUST_RATE, util_number.random(1, 2, 0));

      const floatPriceRate = Math.abs(floatPrice) / realtimeprice.lastprice;
      if (floatPriceRate < ORDER_ROBOT_PRICE_ADJUST_RATE / 2) quantity_max_base = 5;
      if (floatPriceRate < ORDER_ROBOT_PRICE_ADJUST_RATE / 4) quantity_max_base = 4;
      if (floatPriceRate < ORDER_ROBOT_PRICE_ADJUST_RATE / 8) quantity_max_base = 3;
      //super_max的概率为1/quantity_max_base;
      const quantity_max = util_number.random(1, quantity_max_base, 0) > 1 ? config.coin[coinType].order_robot_max : config.coin[coinType].order_robot_super_max;
      //委托数量
      quantity = util_number.random(config.coin[coinType].order_robot_min, quantity_max, config.coin[coinType].decimal);
      //委托价格小数位数是2的概率未1/5
      const bidprice_decimal = util_number.random(1, 5, 0) > 1 ? 1 : 2;
      //委托价格
      bidprice = Number((bors == 'b' ? realtimeprice.lastprice - floatPrice : realtimeprice.lastprice + floatPrice).toFixed(bidprice_decimal));
      const isMarket = 0;
      const isMatch = 0;
      const isInQueue = 1;
      const isRobot = 1;
      //委托
      return service_orderlist_bid.save(server, acount[0], walletType, 0, coinType, bors, quantity, bidprice, null, isMarket, isMatch, isInQueue, isRobot);
    });
  }

  //交易奖金随机累加
  function transBonusLog(order) {
    let promotion;
    //获取交易促销信息（TRANS_BONUS）
    return Promotion.findOne({
      where: {code: 'TRANS_BONUS'}
    }).then(data => {
      promotion = JSON.parse(data.doc);
      if (order.total < promotion.amount.value) return Promise.resolve();
      //机会随机
      if (parseInt(Math.random() * 20) != 1) return Promise.resolve();
      return service_transBonusLog.add(server, Number(Number(order.total * promotion.rate.value).toFixed(2)));
    });
  }

  //循环
  function execute() {

    order().then(order => {
      //循环
      // setTimeout(execute, process.env.ORDER_ROBOT_TIMER);

      //交易奖金累加
      if (order) transBonusLog(order).catch(err => logger.error(err));
    }).catch(err => logger.error(err));

  }

  execute();
  setInterval(execute, process.env.ORDER_ROBOT_TIMER);

  next();
};

exports.register.attributes = {
  name: 'order robot',
  version: '1.0.0'
};
