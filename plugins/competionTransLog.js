const moment = require('moment-timezone');
const service_orderlist_bid_log = require('../service/orderlist_bid_log');

/**
 * 补全历史撮合交易记录（补全到2017-03-01）
 *
 * 根据okcoin历史行情进行数据补全
 * 只需要执行一次，请勿重复执行
 *
 * @param server
 * @param options
 * @param next
 */
exports.register = (server, options, next) => {

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];

  const Orderlist_bid_log = DB.getModel('orderlist_bid_log');
  const Realtimeprice_log = DB.getModel('realtimeprice_log');

  const internal = {};

  let endTime;
  let startTime;

  internal.do = () => {
    //查询撮合交易记录》》手动生成数据第一条创建时间
    return Orderlist_bid_log.findOne({
      attributes: ['createdAt'],
      where: {
        sellOrderId: 0,
        buyOrderId: 0
      }
    }).then(data => {
      if (!endTime) endTime = data ? new Date(data.createdAt) : new Date();

      //查询最早的行情
      return Realtimeprice_log.findOne();
    }).then(data => {
      if (new Date(data.createdAt).getTime() > new Date('2017-03-01').getTime()) {
        startTime = new Date(data.createdAt);
      } else {
        startTime = new Date('2017-03-01');
      }

      internal.handle = () => {
        //每次批量100条
        return Realtimeprice_log.findAll({
          where: {
            isManual: 0,
            createdAt: {$gt: startTime, $lte: endTime}
          },
          limit: 10000
        }).then(data => {
          console.log(data.length);
          //处理结束
          if (data.length == 0) return Promise.resolve('finish');
          startTime = new Date(data[data.length - 1].createdAt);
          //批量生成文档
          let task = [];
          data.forEach(item => {
            task.push(service_orderlist_bid_log.createDoc(server, item.currencytype == 1 ? 'btc' : 'ltc', item.lastprice, item.vol, new Date(item.createdAt), new Date(item.updatedAt)));
          });
          return Promise.all(task);
        }).then(data => {
          if (data == 'finish') return Promise.resolve('finish');
          let docs = [];
          data.forEach(item => {
            if (item) docs.push(item);
          });
          return service_orderlist_bid_log.bulkCreate(server, docs);
        }).then(data => {
          console.log('******************competionTransLog*********************');
          console.log(startTime);
          console.log(endTime);
          if (data == 'finish') return Promise.resolve();
          return internal.handle();
        });
      };

      return internal.handle();
    });
  };

  // internal.do();

  next();
};

exports.register.attributes = {
  name: 'competionTransLog',
  version: '1.0.0'
};
