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

  const source = 'chbtc';

  const internal = {};

  //查询
  internal.queryTrade = (coinType, sourceId) => {
    return new Promise((resolve, reject) => {
      //查询参数
      const query = {currency: `${coinType}_cny`};
      if (sourceId) query.since = sourceId;
      request({
        url: `http://api.chbtc.com/data/v1/trades?${qs.stringify(query)}`,
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
    //查询最新交易
    return Trade.findOne({
      where: {source, coinType},
      order: [['id', 'DESC']]
    }).then(data => {
      const sourceId = data ? data.sourceId : null;
      return internal.queryTrade(coinType, sourceId);
    }).then(data => {
      //chbtc指定sourceId时返回数据包含sourceId这一条
      if (data.length < 2) return Promise.resolve();
      data.shift();
      data.forEach(item => {
        docs.push({
          source: source,
          sourceId: item.tid,
          type: item.type,
          coinType: coinType,
          amount: item.amount,
          price: item.price,
          createdAt: new Date(parseInt(item.date) * 1000)
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
        url: `http://api.chbtc.com/data/v1/depth?currency=${coinType}_cny`,
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
          asks: data.asks.reverse(),
          bids: data.bids
        };
        return client.setAsync(`depth_${source}_${coinType}`, JSON.stringify(depth));
      }).then(() => {
        return service_ticker.setTicker(server, source, coinType);
      });
    }, 8000);
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
  name: 'market chbtc',
  version: '1.0.0'
};
