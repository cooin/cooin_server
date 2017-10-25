const moment = require('moment-timezone');
const util_IDGenerator = require('../lib/IDGenerator');
const util_number = require('../lib/number');

/**
 * 修复历史数据
 *   交易撮合添加撮合流水号、买卖类型、货币类型
 *     撮合流水号以买单订单号为基准替换业务代码
 *     买卖类型以撮合双方委托时间早的未基准
 *     货币类型以委托类型为准
 *
 * @param server
 * @param options
 * @param next
 */
exports.register = (server, options, next) => {

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];

  const Orderlist_bid_log = DB.getModel('orderlist_bid_log');
  const Orderlist_bid = DB.getModel('orderlist_bid');

  const internal = {};

  //处理每条记录
  internal.handle = (doc) => {
    let transNumber;
    let transType;
    let coinType;

    //已处理过了
    if (doc.transNumber) return Promise.resolve();

    //查询买单货币类型
    return Orderlist_bid.findOne({
      where: {orderid: doc.buyOrderId}
    }).then(data => {
      //找不到历史数据
      if (!data) return Promise.resolve();

      //生成修复数据
      coinType = data.curr_type == 1 ? 'btc' : 'ltc';
      transType = doc.sellOrderId < doc.buyOrderId ? 'sell' : 'buy';
      transNumber = util_IDGenerator.config.orderlist_bid_log.code + util_number.fill(data.curr_type, 2) + doc.buyOrderId.toString().substring(3);
      return Orderlist_bid_log.update({
        coinType,
        transType,
        transNumber
      }, {
        where: {id: doc.id}
      });
    }).then(() => {
      return Promise.resolve();
    });
  };

  internal.do = () => {
    return Orderlist_bid_log.findOne({
      where: {transNumber: ''}
    }).then(data => {
      if (!data) return Promise.resolve('finish');
      return internal.handle(data);
    }).then(data => {
      if (data == 'finish') return Promise.resolve(data);
      return internal.do();
    });
  }

  internal.do();

  next();
};

exports.register.attributes = {
  name: 'repairHistoryDataForMatch',
  version: '1.0.0'
};
