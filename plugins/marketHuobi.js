const request = require('request');
const qs = require('querystring');
const config = require('../config/config');
const client = require('../lib/redis').getClient();
const service_ticker = require('../service/ticker');
const service_kline = require('../service/kline');

exports.register = (server, options, next) => {

  //数据库
  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];
  const Trade = DB.getModel('trade');
  const Realtimeprice = DB.getModel('realtimeprice');

  const source = 'huobi';

  const internal = {};

  //查询
  internal.queryTrade = coinType => {
    return new Promise((resolve, reject) => {
      request({
        url: `http://api.huobi.com/staticmarket/detail_${coinType}_json.js`,
        method: "GET",
        json: true
      }, function (err, httpResponse, body) {
        if (err) reject(err);
        resolve(body);
      });
    });
  }

  //处理
  internal.handelTrade = coinType => {
    const docs = [];
    let sourceId;
    let data;
    //查询最新交易
    return Trade.findOne({
      where: {source, coinType},
      order: [['id', 'DESC']]
    }).then(data => {
      sourceId = data ? data.sourceId : null;
      return internal.queryTrade(coinType);
    }).then(item => {
      data = item;

      //处理trades
      data.trades.reverse().forEach(item => {
        if (!sourceId || item.id > sourceId)
          docs.push({
            source: source,
            sourceId: item.id,
            type: item.direction,
            coinType: coinType,
            amount: item.amount,
            price: item.price,
            createdAt: new Date(item.ts)
          });
      });
      service_kline.handel(server, source, coinType, docs);
      return Trade.bulkCreate(docs);
    }).then(data => {
      if (data) internal.handelLast(coinType, docs.pop());
      setTimeout(() => {
        internal.handelTrade(coinType)
      }, 8000);
      service_ticker.setTickerStatus(server, source, coinType, true);
    }).catch(err => {
      logger.error(err);
      setTimeout(() => {
        internal.handelTrade(coinType)
      }, 8000);
      service_ticker.setTickerStatus(server, source, coinType, false);
    });
  }

  //查询深度
  internal.queryDepth = (coinType) => {
    return new Promise((resolve, reject) => {
      request({
        url: `http://api.huobi.com/staticmarket/depth_${coinType}_json.js`,
        method: "GET",
        json: true
      }, function (err, httpResponse, body) {
        if (err) reject(err);
        resolve(body);
      });
    });
  }

  //处理深度
  internal.handelDepth = coinType => {
    setInterval(() => {
      return internal.queryDepth(coinType).then(data => {
        const depth = {
          asks: data.asks,
          bids: data.bids
        };
        return client.setAsync(`depth_${source}_${coinType}`, JSON.stringify(depth));
      }).then(() => {
        return service_ticker.setTicker(server, source, coinType);
      });
    }, 2000);
  }

  //处理最新成交价
  internal.handelLast = (coinType, data) => {
    const criteria = {
      source,
      currencytype: config.coin[coinType].code
    };
    if (!data) return Promise.resolve(data);
    return Realtimeprice.findOrCreate({
      where: criteria,
      defaults: {
        source,
        currencytype: config.coin[coinType].code,
        lastprice: data.price
      }
    }).spread((model, created) => {
      if (!created) return Realtimeprice.update({lastprice: data.price}, {where: criteria});
      return Promise.resolve(data);
    }).then(() => {
      return service_ticker.setTicker(server, source, coinType);
    }).catch(err => {
      logger.error(err);
    });
  }

  setTimeout(() => {
    config.exchange[source].coins.forEach(coinType => {
      internal.handelTrade(coinType);
      internal.handelDepth(coinType);
    });
  }, Math.random() * 5000);

  next();
};

exports.register.attributes = {
  name: 'market huobi',
  version: '1.0.0'
};
