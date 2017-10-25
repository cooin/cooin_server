const WebSocketClient = require('websocket').client;
const _ = require('lodash');
const client = require('../lib/redis').getClient();

const attributes = ['cName', 'coinName', 'coinSign', 'ticker.last', 'ticker.dollar', 'ticker.vol'];

exports.register = (server, options, next) => {

  const socket = new WebSocketClient();

  const internal = {};

  internal.connect = () => {
    socket.connect('wss://api.btc123.com/websocket');
  };

  internal.connect();

  socket.on('connectFailed', function(error) {
    console.log('Connect Error: ' + error.toString());
  });

  socket.on('connect', function(connection) {
    console.log('WebSocket Client Connected');

    //订阅
    connection.send('index_ticker');

    connection.on('error', function(error) {
      console.log("Connection Error: " + error.toString());
      setTimeout(() => internal.connect(), 2000);
    });

    connection.on('close', function() {
      console.log('echo-protocol Connection Closed');
      setTimeout(() => internal.connect(), 2000);
    });

    connection.on('message', function(message) {
      if (message.type === 'utf8') {
        let array = [];
        let data = JSON.parse(message.utf8Data);
        if (Object.prototype.toString.call(data) != '[object Array]') return;
        data.forEach(item => {
          if (item.coinName == '比特币' || item.coinName == '莱特币' || item.coinName == '以太币') array.push(_.pick(item, attributes));
        });
        socketUtil.emit('market', array);
        //放入缓存
        client.setAsync('market', JSON.stringify(array));
      }
    });
  });

  next();
};

exports.register.attributes = {
  name: 'marketBTC123',
  version: '1.0.0'
};
