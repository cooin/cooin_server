const WebSocketClient = require('websocket').client;
const client = require('../lib/redis').getClient();
const util_number = require('../lib/number');
const MsgService = require('../lib/messageservice-api');

//平台行情与bitfinex的差价范围（ETH）
const MARKET_RANGE_ETH = process.env.MARKET_RANGE_ETH.split(',');

//价格波动值
let adjustBalanceForETH = util_number.random(MARKET_RANGE_ETH[0], MARKET_RANGE_ETH[1], 2);

exports.register = (server, options, next) => {

  //数据库
  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];

  const Realtimeprice = DB.getModel('realtimeprice');
  const Realtimeprice_log = DB.getModel('realtimeprice_log');

  const internal = {};

  internal.handle = () => {

    const socket = new WebSocketClient();

    const internal = {};

    internal.connect = () => {
      socket.connect('wss://api.bitfinex.com/ws/2');
    };

    internal.connect();

    socket.on('connectFailed', function (error) {
      console.log('Connect Error: ' + error.toString());
      setTimeout(() => internal.connect(), 2000);
    });

    socket.on('connect', function (connection) {
      console.log('WebSocket Client Connected');

      //订阅ETHUSD
      connection.send('{"event":"subscribe","pair":"ETHUSD","channel":"ticker"}');

      connection.on('error', function (error) {
        console.log("Connection Error: " + error.toString());
        setTimeout(() => internal.connect(), 2000);
      });

      connection.on('close', function () {
        console.log('echo-protocol Connection Closed');
        setTimeout(() => internal.connect(), 2000);
      });

      let chanId;
      connection.on('message', function (message) {
        if (message.type === 'utf8') {
          const data = JSON.parse(message.utf8Data);
          const type = Object.prototype.toString.call(data);
          if (type == '[object Object]' && data.event == 'subscribed') chanId = data.chanId;
          if (type == '[object Array]' && data[0] == chanId && Object.prototype.toString.call(data[1]) == '[object Array]') {
            //读取CNY-USD汇率
            client.getAsync('marketInvesting').then(marketInvesting => {
              marketInvesting = marketInvesting ? JSON.parse(marketInvesting) : null;
              //还没有汇率信息
              if (!marketInvesting) return;
              //汇率
              const rate = marketInvesting.dollar.now;
              //进行价格调整
              if (Math.random() * 5 < 1) adjustBalanceForETH += util_number.random(util_number.random(Number(process.env.MARKET_FLOAT_ETH_NEGATIVE), 0, 2), util_number.random(Number(process.env.MARKET_FLOAT_ETH_POSITIVE), 0, 2), 2);
              if (adjustBalanceForETH < Number(MARKET_RANGE_ETH[0])) adjustBalanceForETH = Number(MARKET_RANGE_ETH[0]);
              if (adjustBalanceForETH > Number(MARKET_RANGE_ETH[1])) adjustBalanceForETH = Number(MARKET_RANGE_ETH[1]);
              const doc = {
                currencytype: 3,
                syndate: parseInt(Date.now() / 1000),
                lastprice: Number((rate * data[1][6]).toFixed(2)),
                buy: Number((rate * data[1][0]).toFixed(2)),
                sell: Number((rate * data[1][2]).toFixed(2)),
                low: Number((rate * data[1][9]).toFixed(2)),
                high: Number((rate * data[1][8]).toFixed(2)),
                vol: data[1][7]
              };
              doc.lastprice = Number(Number(doc.lastprice + adjustBalanceForETH).toFixed(2));
              doc.adjustBalance = adjustBalanceForETH;

              //存档
              Realtimeprice_log.create(doc);

              //更新实时行情
              Realtimeprice.findOrCreate({
                where: {currencytype: 3},
                defaults: doc
              }).spread((model, created) => {
                if (created) return client.hsetAsync(['lastprice', 'eth', model.lastprice]);
              }).catch(err => logger.error(err));
            });
          }
        }
      });
    });
  };

  //查询价格差值
  Realtimeprice.findOne({
    where: {
      currencytype: 3
    },
    order: [['id', 'DESC']]
  }).then(data => {
    if (data && data.adjustBalance) adjustBalanceForETH = datas.adjustBalance;
    internal.handle();
  }).catch(err => {
    logger.error(err);
    internal.handle();
  });

  //定时查询最新行情记录插入队列（避免socket瞬时推送大量行情数据导致队列阻塞）
  setInterval(() => {
    Realtimeprice_log.findOne({
      where: {currencytype: 3},
      order: [
        ['id', 'DESC']
      ]
    }).then(data => {
      if (!data) return;
      //插入行情消息队列
      const MQ = new MsgService(process.env.QUEUE_ORDER);
      MQ.enQueue({
        type: process.env.QUEUE_ORDER_TYPE_MARKET,
        id: data.id
      }).then(data => {
        logger.info('插入消息', {type: process.env.QUEUE_ORDER_TYPE_MARKET, messageId: data.Message.MessageId});
      }).catch(err => {
        logger.error(err);
      });
    });
  }, 2000);

  next();
};

exports.register.attributes = {
  name: 'marketBitfinex',
  version: '1.0.0'
};
