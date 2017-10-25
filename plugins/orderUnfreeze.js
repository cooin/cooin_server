const MsgService = require('../lib/messageservice-api');
const MQ = new MsgService(process.env.QUEUE_ORDER);

/**
 * 订单解冻定时器
 * @param server
 * @param options
 * @param next
 */
exports.register = (server, options, next) => {

  //队列--订单--订单解冻
  const QUEUE_ORDER_TYPE_ORDER_UNFREEZE = process.env.QUEUE_ORDER_TYPE_ORDER_UNFREEZE;
  //订单解冻轮询间隔时间
  const ORDER_UNFREEZE_POLLING_TIME = process.env.ORDER_UNFREEZE_POLLING_TIME;

  setInterval(() => {

    let msg = {type: QUEUE_ORDER_TYPE_ORDER_UNFREEZE};
    let delays = 0;
    let priority = 8;
    MQ.enQueue(msg, priority, delays);

  }, ORDER_UNFREEZE_POLLING_TIME);

  next();
};

exports.register.attributes = {
  name: 'order unfreeze',
  version: '1.0.0'
};
