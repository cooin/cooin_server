const config = require('../config/config');
const util_queue = require('../lib/queue');
const service_followInvest = require('../service/followInvest');

/**
 * 跟投
 */
exports.register = (server, options, next) => {

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];

  const internal = {};

  //处理订单
  internal.deal = (msg) => {
    return service_followInvest.follow(server, msg);
  }

  //处理订单--sell
  internal.dealSell = (msg) => {
    return service_followInvest.sell(server, msg);
  }

  //处理订单--cancel
  internal.dealCancel = (msg) => {
    return service_followInvest.cancel(server, msg);
  }


  //处理消息
  internal.handel = () => {
    let msg;
    //获取消息
    logger.info('获取消息-followInvest-start');
    return util_queue.get('followInvest', 10).then(data => {
      logger.info('获取消息-followInvest-get');
      if (!data) return Promise.resolve();
      msg = data;
      return internal.deal(JSON.parse(data));
    }).then(() => {
      logger.info('删除消息-followInvest');
      //删除消息
      if (msg) return util_queue.remove('followInvest', msg);
      return Promise.resolve();
    }).then(() => {
      return internal.handel();
    }).catch(err => {
      logger.error(err);
      return internal.handel();
    });
  }


  //处理消息--委卖
  internal.handelSell = () => {
    let msg;
    //获取消息
    logger.info('获取消息-followInvest_sell-start');
    return util_queue.get('followInvest_sell', 10).then(data => {
      logger.info('获取消息-followInvest_sell-get');
      if (!data) return Promise.resolve();
      msg = data;
      return internal.dealSell(JSON.parse(data));
    }).then(() => {
      logger.info('删除消息-followInvest_sell');
      //删除消息
      if (msg) return util_queue.remove('followInvest_sell', msg);
      return Promise.resolve();
    }).then(() => {
      return internal.handelSell();
    }).catch(err => {
      logger.error(err);
      return internal.handelSell();
    });
  }


  //处理消息--撤销
  internal.handelCancel = () => {
    let msg;
    //获取消息
    logger.info('获取消息-followInvest_cancel-start');
    return util_queue.get('followInvest_cancel', 10).then(data => {
      logger.info('获取消息-followInvest_cancel-get');
      if (!data) return Promise.resolve();
      msg = data;
      return internal.dealCancel(JSON.parse(data));
    }).then(() => {
      logger.info('删除消息-followInvest_cancel');
      //删除消息
      if (msg) return util_queue.remove('followInvest_cancel', msg);
      return Promise.resolve();
    }).then(() => {
      return internal.handelCancel();
    }).catch(err => {
      logger.error(err);
      return internal.handelCancel();
    });
  }

  internal.handel();
  internal.handelSell();
  internal.handelCancel();

  next();
};

exports.register.attributes = {
  name: 'followInvest',
  version: '1.0.0'
};


