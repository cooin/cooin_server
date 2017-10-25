const config = require('../config/config');
const util_queue = require('../lib/queue');
const service_orderlist_bid = require('../service/orderlist_bid');

/**
 * 撮合
 */
exports.register = (server, options, next) => {

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];
  const Orderlist_bid = DB.getModel('orderlist_bid');

  const internal = {};

  //匹配满足条件的订单{ source: 'bter', coinType: 'ltc', buy: 193.01, sell: 194 }
  internal.match = (msg) => {

    //查询满足条件的订单
    const criteria = {
      tradePlatform: msg.source,
      curr_type: config.coin[msg.coinType].code,
      status: 0,
      $or: [
        {isMarket: 0, bors: 'b', bidprice: {$gte: msg.sell}},
        {isMarket: 0, bors: 's', bidprice: {$lte: msg.buy}},
        {isMarket: 1}
      ]
    };

    return Orderlist_bid.findAll({where: criteria}).then(data => {
      if (data.length == 0) return Promise.resolve();
      let counter = 0;
      const internal = {};
      internal.do = () => {
        return service_orderlist_bid.deal(server, data[counter], data[counter].bors == 'b' ? msg.sell: msg.buy).then(data => {
          if (data[++counter]) return internal.do();
          return Promise.resolve();
        });
      }
      return internal.do();
    });
  }


  //处理消息
  internal.handel = () => {
    let msg;
    //获取消息
    logger.info('获取消息-market-start');
    return util_queue.get('market', 10).then(data => {
      logger.info('获取消息-market-get');
      if (!data) return Promise.resolve();
      msg = data;
      return internal.match(JSON.parse(data));
    }).then(() => {
      logger.info('删除消息-market');
      //删除消息
      if (msg) return util_queue.remove('market', msg);
      return Promise.resolve();
    }).then(() => {
      return internal.handel();
    }).catch(err => {
      logger.error(err);
      return internal.handel();
    });
  }

  internal.handel();

  next();
};

exports.register.attributes = {
  name: 'match trans',
  version: '1.0.0'
};


