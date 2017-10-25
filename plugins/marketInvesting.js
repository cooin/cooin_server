const util_marketInvesting = require('../lib/marketInvesting');
const util_marketSina = require('../lib/marketSina');
const client = require('../lib/redis').getClient();


exports.register = (server, options, next) => {

  setInterval(() => {

    util_marketSina.realAll().then(data => {
      //socket广播
      socketUtil.emit('marketInvesting', data);
      //放入缓存
      client.setAsync('marketInvesting', JSON.stringify(data));
    });

  }, 6000);

  next();
};

exports.register.attributes = {
  name: 'marketInvesting',
  version: '1.0.0'
};
