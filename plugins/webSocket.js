const WebSocket = require('ws');

exports.register = (server, options, next) => {

  global.WSSUtil = new WSSUtil(server.connections[0].listener);

  next();
};

exports.register.attributes = {
  name: 'webSocket',
  version: '1.0.0'
};


class WSSUtil {

  constructor(server) {

    this.wss = new WebSocket.Server({
      server: server,
      path: '/ws'
    });

    this.wss.on('connection', ws => {
      console.log('*******************connection************************');
      console.log(this.wss.clients.length);
      ws.on('message', function incoming(message) {
        console.log('received: %s', message);
      });

      ws.send(JSON.stringify({hello: 'world'}));
    });

  }

  //全局推送
  emit(event, data) {

    this.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) client.send(JSON.stringify({
        channel: event,
        data: data
      }));
    });

    return Promise.resolve();
  }
}
