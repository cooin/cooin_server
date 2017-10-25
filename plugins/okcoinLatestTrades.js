const util_market = require('../lib/market');

const tradesData = {
  btc: [],
  ltc: []
};

exports.register = (server, options, next) => {

  const internal = {};

  //初始化数据
  internal.init = () => {
    return Promise.all([
      util_market.getLatestTrades('btc'),
      util_market.getLatestTrades('ltc')
    ]).then(datas => {
      tradesData.btc = datas[0].splice(datas[0].length - 5, 5).reverse();
      tradesData.ltc = datas[1].splice(datas[1].length - 5, 5).reverse();
      return Promise.resolve();
    });
  }

  //查询
  internal.query = () => {
    return Promise.all([
      util_market.getLatestTrades('btc', tradesData.btc[0].tid),
      util_market.getLatestTrades('ltc', tradesData.ltc[0].tid)
    ]).then(datas => {
      if (datas[0].length > 0) tradesData.btc = datas[0].reverse().concat(tradesData.btc).splice(0, 5);
      if (datas[1].length > 0) tradesData.ltc = datas[1].reverse().concat(tradesData.ltc).splice(0, 5);
      return Promise.resolve();
    });
  }

  // internal.init().then(() => {
  //   setInterval(() => {
  //     internal.query().then(() => {
  //       //推送成交数据
  //       socketUtil.emit('trades', tradesData);
  //     });
  //   }, parseInt(Math.random() * 1500) + 500);
  // });

  next();
};

exports.register.attributes = {
  name: 'okcoin latest trades',
  version: '1.0.0'
};
