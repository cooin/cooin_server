const https = require('https');
const qs = require('querystring');
const MsgService = require('../lib/messageservice-api');
const util_number = require('../lib/number');
const client = require('../lib/redis').getClient();

//平台行情与okcoin的差价范围（BTC）
const MARKET_RANGE_BTC = process.env.MARKET_RANGE_BTC.split(',');
//平台行情与okcoin的差价范围（LTC）
const MARKET_RANGE_LTC = process.env.MARKET_RANGE_LTC.split(',');

//价格波动值
let adjustBalanceForBTC = util_number.random(MARKET_RANGE_BTC[0], MARKET_RANGE_BTC[1], 2);
let adjustBalanceForLTC = util_number.random(MARKET_RANGE_LTC[0], MARKET_RANGE_LTC[1], 2);

exports.register = (server, options, next) => {

  //数据库
  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];

  let realtimeprice_logModel = DB.getModel('realtimeprice_log');

  //获取数据
  function ticker(symbol) {
    return new Promise((resolve, reject) => {

      //这是需要提交的数据
      const post_data = {};
      const content = qs.stringify(post_data);
      const options = {
        hostname: 'www.okcoin.cn',
        port: 443,
        path: '/api/v1/ticker.do?symbol=' + symbol,
        method: 'get',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': content.length
        }
      };
      const req = https.request(options, function (response) {
        response.setEncoding('utf8');
        let responseData = '';
        response.on('data', function (data) {
          responseData += data;
        });
        response.on('end', function () {
          resolve(responseData);
        });
      });
      req.on('error', function (err) {
        console.log('problem with request: ' + err.message);
        reject(err);
      });
      req.write(content);
      req.end();
    });
  }

  //获取数据
  function queryMarketFromHuobi(coin) {
    return new Promise((resolve, reject) => {

      //这是需要提交的数据
      const post_data = {};
      const content = qs.stringify(post_data);
      const options = {
        hostname: 'api.huobi.com',
        path: `/staticmarket/ticker_${coin}_json.js`,
        method: 'get',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': content.length
        }
      };
      const req = https.request(options, function (response) {
        response.setEncoding('utf8');
        //{'time':'1483957975','ticker':{'symbol':'btccny','vol':1537773.9897,'high':6380,'last':6323,'low':6029,'sell':6324.32,'buy':6323,'open':6325} }
        let responseData = '';
        response.on('data', function (data) {
          responseData += data;
        });
        response.on('end', function () {
          resolve(responseData);
        });
      });
      req.on('error', function (err) {
        console.log('problem with request: ' + err.message);
        reject(err);
      });
      req.write(content);
      req.end();
    });
  }

  //保存数据
  function save(datas) {
    let jsonBTC = JSON.parse(datas[0]);
    let jsonLTC = JSON.parse(datas[1]);

    let modelBTC = {
      currencytype: 1,
      syndate: parseInt(jsonBTC.date),
      lastprice: parseFloat(jsonBTC.ticker.last),
      buy: parseFloat(jsonBTC.ticker.buy),
      sell: parseFloat(jsonBTC.ticker.sell),
      low: parseFloat(jsonBTC.ticker.low),
      high: parseFloat(jsonBTC.ticker.high),
      vol: parseFloat(jsonBTC.ticker.vol)
    };
    let modelLTC = {
      currencytype: 2,
      syndate: parseInt(jsonLTC.date),
      lastprice: parseFloat(jsonLTC.ticker.last),
      buy: parseFloat(jsonLTC.ticker.buy),
      sell: parseFloat(jsonLTC.ticker.sell),
      low: parseFloat(jsonLTC.ticker.low),
      high: parseFloat(jsonLTC.ticker.high),
      vol: parseFloat(jsonLTC.ticker.vol)
    };

    //进行价格调整
    if (Math.random() * 5 < 1) adjustBalanceForBTC += util_number.random(util_number.random(Number(process.env.MARKET_FLOAT_BTC_NEGATIVE), 0, 2), util_number.random(Number(process.env.MARKET_FLOAT_BTC_POSITIVE), 0, 2), 2);
    if (Math.random() * 5 < 1) adjustBalanceForLTC += util_number.random(util_number.random(Number(process.env.MARKET_FLOAT_LTC_NEGATIVE), 0, 2), util_number.random(Number(process.env.MARKET_FLOAT_LTC_POSITIVE), 0, 2), 2);
    if (adjustBalanceForBTC < Number(MARKET_RANGE_BTC[0])) adjustBalanceForBTC = Number(MARKET_RANGE_BTC[0]);
    if (adjustBalanceForBTC > Number(MARKET_RANGE_BTC[1])) adjustBalanceForBTC = Number(MARKET_RANGE_BTC[1]);
    if (adjustBalanceForLTC < Number(MARKET_RANGE_LTC[0])) adjustBalanceForLTC = Number(MARKET_RANGE_LTC[0]);
    if (adjustBalanceForLTC > Number(MARKET_RANGE_LTC[1])) adjustBalanceForLTC = Number(MARKET_RANGE_LTC[1]);

    modelBTC.lastprice = Number(Number(modelBTC.lastprice + adjustBalanceForBTC).toFixed(2));
    modelBTC.adjustBalance = adjustBalanceForBTC;
    modelLTC.lastprice = Number(Number(modelLTC.lastprice + adjustBalanceForLTC).toFixed(2));
    modelLTC.adjustBalance = adjustBalanceForLTC;

    /**
     * 保存数据日志
     */
    Promise.all([
      realtimeprice_logModel.create(modelBTC),
      realtimeprice_logModel.create(modelLTC)
    ]).then(datas => {

      //插入行情消息队列
      const MQ = new MsgService(process.env.QUEUE_ORDER);
      MQ.enQueue({
        type: process.env.QUEUE_ORDER_TYPE_MARKET,
        id: datas[0].get().id
      }).then(data => {
        logger.info('插入消息', {type: process.env.QUEUE_ORDER_TYPE_MARKET, messageId: data.Message.MessageId});
      }).catch(err => {
        logger.error(err);
      });
      MQ.enQueue({
        type: process.env.QUEUE_ORDER_TYPE_MARKET,
        id: datas[1].get().id
      }).then(data => {
        logger.info('插入消息', {type: process.env.QUEUE_ORDER_TYPE_MARKET, messageId: data.Message.MessageId});
      }).catch(err => {
        logger.error(err);
      });
    }).catch(err => {
      logger.error(err);
    });

    /**
     * 更新数据
     */
    let realtimepriceModel = DB.getModel('realtimeprice');

    //BTC
    let queryBTC = {currencytype: 1};
    realtimepriceModel.findOrCreate({where: queryBTC, defaults: modelBTC}).spread((model, created) => {
      if (created) return client.hsetAsync(['lastprice', 'btc', model.lastprice]);
    }).then(data => {
      // console.log(data);
    }).catch(err => {
      console.log(err);
    });

    //LTC
    let queryLTC = {currencytype: 2};
    realtimepriceModel.findOrCreate({where: queryLTC, defaults: modelLTC}).spread((model, created) => {
      if (created) return client.hsetAsync(['lastprice', 'ltc', model.lastprice]);
    }).catch(err => {
      logger.error(err);
    });
  }

  //BTC、LTC
  function execute() {
    Promise.all([
      ticker('btc_cny'),
      ticker('ltc_cny'),
    ]).then(datas => {
      //保存数据
      save(datas);
      //循环
      setTimeout(execute, 2000);
    }).catch(err => {
      //请求数据异常
      logger.error(err);
      // //循环
      // setTimeout(execute, 2000);

      /**
       * okcoin不稳定
       * 从货币网获取数据
       */
      Promise.all([
        queryMarketFromHuobi('btc'),
        queryMarketFromHuobi('ltc'),
      ]).then(datas => {
        let btc = JSON.parse(datas[0]);
        btc.date = btc.time;
        let ltc = JSON.parse(datas[1]);
        ltc.date = ltc.time;
        //保存数据
        save([JSON.stringify(btc), JSON.stringify(ltc)]);
        //循环
        setTimeout(execute, 2000);
      }).catch(err => {
        //请求数据异常
        logger.error(err);
        //循环
        setTimeout(execute, util_number.random(1000, 2000, 0));
      });
    });
  }

  //查询价格差值
  Promise.all([
    realtimeprice_logModel.findOne({
      where: {
        currencytype: 1
      },
      order: [['id', 'DESC']]
    }),
    realtimeprice_logModel.findOne({
      where: {
        currencytype: 2
      },
      order: [['id', 'DESC']]
    })
  ]).then(datas => {
    if (datas[0] && datas[0].adjustBalance) adjustBalanceForBTC = datas[0].adjustBalance;
    if (datas[1] && datas[1].adjustBalance) adjustBalanceForLTC = datas[1].adjustBalance;
    execute();
  }).catch(err => {
    logger.error(err);
    execute();
  });

  next();
};

exports.register.attributes = {
  name: 'okcoin',
  version: '1.0.0'
};
