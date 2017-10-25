const moment = require('moment-timezone');
const _ = require('lodash');
const config = require('../config/config');
const util_number = require('../lib/number');
const util_IDGenerator = require('../lib/IDGenerator');
const service_orderlist_bid = require('./orderlist_bid');

//下单机器人每次购买数量范围btc
const ORDER_ROBOT_QUANTITY_BTC = process.env.ORDER_ROBOT_QUANTITY_BTC.split(',');
//下单机器人每次购买数量范围ltc
const ORDER_ROBOT_QUANTITY_LTC = process.env.ORDER_ROBOT_QUANTITY_LTC.split(',');

const cache = {
  btc: {
    vol: null,
    transPrice: null
  },
  ltc: {
    vol: null,
    transPrice: null
  },
  eth: {
    vol: null,
    transPrice: null
  }
};

const internal = {};

//生成交易数量
internal.generateQuantity = (coinType, transPrice) => {
  let amount = cache[coinType].lastprice ? Number(Math.abs(cache[coinType].lastprice - transPrice).toFixed(2)) : 0;
  amount = amount ? amount : 0.1;
  cache[coinType].lastprice = transPrice;
  const decimal = config.coin[coinType].decimal;
  if (coinType == 'btc') return Number((amount * util_number.random(0.01, [0.01, 0.02, 0.02, 0.03, 0.3][util_number.random(0, 4, 0)], decimal)).toFixed(decimal));
  if (coinType == 'ltc') return Number((amount * util_number.random(50, [60, 60, 70, 80, 100][util_number.random(0, 4, 0)], decimal)).toFixed(decimal));
  if (coinType == 'eth') return Number((amount * util_number.random(10, [12, 12, 14, 16, 20][util_number.random(0, 4, 0)], decimal)).toFixed(decimal));
}

/**
 *
 * 创建撮合记录文档
 *
 * 改方法仅在根据行情随机生成买卖撮合记录
 *
 * @param server
 * @param coinType
 * @param transPrice
 * @param vol
 * @param createdAt 指定创建日期
 * @param updatedAt 指定创建日期
 * @returns {Promise.<TResult>}
 */
exports.createDoc = (server, coinType, transPrice, vol, createdAt = new Date(), updatedAt = new Date()) => {

  //当交易量没有变化时，小概率生成撮合交易记录
  if (cache[coinType].transPrice == transPrice && parseInt(Math.random() * 20) > 1) return Promise.resolve();

  const quantity = internal.generateQuantity(coinType, transPrice);
  const transType = ['buy', 'sell'][Math.round(Math.random())];
  const total = Number(Number(transPrice * quantity).toFixed(2));

  //获取撮合交易号
  return util_IDGenerator.get('orderlist_bid_log', config.coin[coinType].code).then(transNumber => {
    return Promise.resolve({
      transNumber,
      transType,
      coinType,
      quantity,
      transPrice,
      total,
      createdAt,
      updatedAt
    });
  });
};

/**
 *
 * 创建撮合记录
 *
 * 改方法仅在根据行情随机生成买卖撮合记录
 *
 * @param server
 * @param coinType
 * @param transPrice
 * @param vol
 * @param createdAt 指定创建日期
 * @param updatedAt 指定创建日期
 * @returns {Promise.<TResult>}
 */
exports.create = (server, coinType, transPrice, vol, createdAt = new Date(), updatedAt = new Date()) => {

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];
  const Orderlist_bid_log = DB.getModel('orderlist_bid_log');

  return this.createDoc(server, coinType, transPrice, vol, createdAt, updatedAt).then(data => {
    if (!data) return Promise.resolve();
    return Orderlist_bid_log.create(data);
  }).then(data => {
    //推送最新交易
    if (data) socketUtil.emit('trades', _.pick(data, config.attributes.orderlist_bid_log.detail));
    //推送行情
    if (data) service_orderlist_bid.pushTicker(server, coinType);

    return Promise.resolve(data);
  });
};

/**
 *
 * 创建撮合记录（批量）
 *
 * 改方法仅在根据行情随机生成买卖撮合记录
 *
 * @param server
 * @param docs
 * @returns {Promise.<TResult>}
 */
exports.bulkCreate = (server, docs) => {

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];
  const Orderlist_bid_log = DB.getModel('orderlist_bid_log');
  return Orderlist_bid_log.bulkCreate(docs);
};
