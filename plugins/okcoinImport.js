const _ = require('lodash');
const config = require('../config/config');
const util_market = require('../lib/market');
const KLINE_SOURCE_FROM_OKCOIN = parseInt(process.env.KLINE_SOURCE_FROM_OKCOIN);

let symbol = {btc: 'btc_cny', ltc: 'ltc_cny'};
let unitData = {
  '1min': '1min',
  '3min': '3min',
  '5min': '5min',
  '15min': '15min',
  '30min': '30min',
  '1hour': '1hour',
  '1day': '1day',
  '1week': '1week'
};

exports.register = (server, options, next) => {

  //数据库
  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];

  const KLine = DB.getModel('kLine');

  const source = 'okcoin';

  //如果没有任何数据则导入okcoin历史数据
  KLine.count({
    where: {source}
  }).then(count => {
    if (count > 0) return Promise.resolve();
    for (let coinType in symbol) {
      for (let unit in unitData) {
        util_market.getMarketKline(coinType, unit).then(data => {
          // console.log(coinType, unit);
          let array_doc = [];
          data.forEach(item => {
            array_doc.push({
              source,
              coinType,
              unit,
              time: item[0],
              open: item[1],
              high: item[2],
              low: item[3],
              close: item[4],
              vol: item[5]
            });
          });
          KLine.bulkCreate(array_doc).then(data => {
          });
        });
      }
    }
    return Promise.resolve();
  });


  let queue = [];
  for (let coinType in symbol) {
    for (let unit in unitData) {
      queue.push([coinType, unit]);
    }
  }

  const internal = {};

  //处理
  internal.handle = (coinType, unit) => {
    return util_market.getMarketKline(coinType, unit, 1).then(data => {
      // console.log(coinType, unit);
      // data.forEach(item => {
      const item = data[0];
      let criteria = {
        source,
        coinType,
        unit,
        time: item[0]
      };
      let doc = {
        source,
        coinType,
        unit,
        time: item[0],
        open: item[1],
        high: item[2],
        low: item[3],
        close: item[4],
        vol: item[5]
      };
      //查询或者创建
      return KLine.findOrCreate({
        where: criteria,
        defaults: doc
      }).spread((data, created) => {
        //已有
        if (created) return Promise.resolve();
        //更新
        return KLine.update(doc, {where: criteria});
      }).then(() => {
        //查询
        return KLine.findOne({where: criteria});
      }).then(data => {
        //推送kLine数据
        if (KLINE_SOURCE_FROM_OKCOIN) socketUtil.emit('kLine', _.pick(data, config.attributes.kLine.list));
        return Promise.resolve();
      });
      // });
    });
  };

  let i = 0;
  internal.do = () => {
    const task = queue[i];
    return internal.handle(task[0], task[1]).then(() => {
      if (queue[++i]) return internal.do();
      return Promise.resolve();
    })
  }

  //每6s查询一次
  setInterval(() => {
    i = 0;
    internal.do().catch(err => console.log(err));
  }, 6000);

  next();
};

exports.register.attributes = {
  name: 'okcoin import',
  version: '1.0.0'
};
