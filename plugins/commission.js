const config = require('../config/config');
const util_queue = require('../lib/queue');
const service_followInvest = require('../service/followInvest');

/**
 * 提成
 */
exports.register = (server, options, next) => {

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];

  const internal = {};

  //处理订单
  internal.deal = (msg) => {
    return service_followInvest.commission(server, msg);
  }


  //处理消息
  internal.handel = () => {
    let msg;
    //获取消息
    logger.info('获取消息-commission-start');
    return util_queue.get('commission', 10).then(data => {
      logger.info('获取消息-commission-get');
      if (!data) return Promise.resolve();
      msg = data;
      return internal.deal(JSON.parse(data));
    }).then(() => {
      logger.info('删除消息-commission');
      //删除消息
      if (msg) return util_queue.remove('commission', msg);
      return Promise.resolve();
    }).then(() => {
      return internal.handel();
    }).catch(err => {
      logger.error(err);
      return internal.handel();
    });
  }

  internal.handel();

  next();
};

exports.register.attributes = {
  name: 'commission',
  version: '1.0.0'
};


