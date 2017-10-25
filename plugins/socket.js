const SocketIO = require('socket.io');


exports.register = (server, options, next) => {

  global.socketUtil = new SocketUtil(server.connections[0].listener);

  next();
};

exports.register.attributes = {
  name: 'socket.io',
  version: '1.0.0'
};

class SocketUtil {

  constructor(server) {

    this.socketMap = {};

    this.IO = SocketIO.listen(server);

    //连接
    this.IO.on('connection', socket => {
      //console.log(socket.conn.id);
      //console.log(io.sockets.sockets[socket.conn.id] == socket);

      console.log('a user connected');

      //断开连接
      socket.on('disconnect', () => {
        console.log(socket.user + ' logout');

        if (socket.user) this.remove(socket.user, socket.conn.id);
      });

      //登录
      socket.on('login', user => {
        console.log(user + ' login');

        socket.user = user;
        this.set(user, socket.conn.id);
      });
    });
  }

  //设置userId和socketId之间的映射
  set(userId, socketId) {
    if (!this.socketMap[userId]) this.socketMap[userId] = [];
    this.socketMap[userId].push(socketId);
    console.log(this.socketMap);
    return Promise.resolve();
  }

  //根据userId获取对应的sockets的ID数组
  get(userId) {
    // if (!this.socketMap[userId]) return Promise.reject(new Error('not found userId: ' + userId));
    if (!this.socketMap[userId]) return Promise.resolve();
    return Promise.resolve(this.socketMap[userId]);
  }

  //根据userId、socketId删除对应的socket
  remove(userId, socketId) {
    // if (!this.socketMap[userId]) return Promise.reject(new Error('not found userId: ' + userId));
    if (!this.socketMap[userId]) return Promise.resolve();
    this.socketMap[userId].forEach((item, index) => {
      if (item == socketId) this.socketMap[userId].splice(index, 1);
    });
    return Promise.resolve();
  }

  //根据userId发送消息到指定用户
  send(userId, event, data) {
    // if (!this.socketMap[userId]) return Promise.reject(new Error('not found userId: ' + userId));
    if (!this.socketMap[userId]) return Promise.resolve();
    this.socketMap[userId].forEach(socketId => {
      if (this.IO.sockets.sockets[socketId]) this.IO.sockets.sockets[socketId].emit(event, data);
    });
    return Promise.resolve();
  }

  //全局推送
  emit(event, data) {
    this.IO.emit(event, data);
    WSSUtil.emit(event, data);
    return Promise.resolve();
  }
}
