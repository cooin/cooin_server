const request = require('request');
const qs = require('querystring');
const moment = require('moment-timezone');
//下单机器人每次购买数量范围btc
const ORDER_ROBOT_QUANTITY_BTC = process.env.ORDER_ROBOT_QUANTITY_BTC.split(',');
//下单机器人每次购买数量范围ltc
const ORDER_ROBOT_QUANTITY_LTC = process.env.ORDER_ROBOT_QUANTITY_LTC.split(',');

let symbol = {btc: 'btc_cny', ltc: 'ltc_cny'};
let unitData = {
  '1min': '1min',
  '3min': '3min',
  '5min': '5min',
  '15min': '15min',
  '30min': '30min',
  '1hour': '1hour',
  '1day': '1day',
  '1week': '1week'
};
let decimal = {btc: ORDER_ROBOT_QUANTITY_BTC[2], ltc: ORDER_ROBOT_QUANTITY_LTC[2]};
let month = {};
let week = {};
let date = {};
let latestDateForDate = {};
let latestDateForWeek = {};
let latestDateForMonth = {};

/**
 * 月平均价格
 * @returns {number}
 */
exports.month = coinType => {

  const self = this;

  if (!symbol[coinType]) return Promise.reject(new Error('货币类型错误'));

  if (latestDateForMonth[coinType] == moment().format('YYYYMMDD')) return Promise.resolve(month[coinType]);

  month[coinType] = {};

  return self.getMarketByDay(coinType).then(data => {
    latestDateForMonth[coinType] = moment(data[data.length - 1][0]).format('YYYYMMDD');
    data.forEach(item => {
      const key = moment(item[0]).format('YYYYMM');
      if (!month[coinType][key]) month[coinType][key] = [];
      month[coinType][key].push(item[1]);
    });
    for (let key in month[coinType]) {
      let sum = 0;
      month[coinType][key].forEach(item => {
        sum += item;
      });
      month[coinType][key] = Number(Number(sum / month[coinType][key].length).toFixed(decimal[coinType]));
    }
    return Promise.resolve(month[coinType]);
  });
}

/**
 * 周平均价格
 * @returns {number}
 */
exports.week = coinType => {

  const self = this;

  if (!symbol[coinType]) return Promise.reject(new Error('货币类型错误'));

  if (latestDateForWeek[coinType] == moment().format('YYYYMMDD')) return Promise.resolve(week[coinType]);

  week[coinType] = {};

  return self.getMarketKline(coinType, '1week').then(data => {
    latestDateForWeek[coinType] = moment(data[data.length - 1][0]).format('YYYYMMDD');
    data.forEach(item => {
      const key = moment(item[0]).format('YYYYMMDD');
      week[coinType][key] = item[1];
    });
    return Promise.resolve(week[coinType]);
  });
}

/**
 * 日平均价格
 * @returns {number}
 */
exports.date = coinType => {

  const self = this;

  if (!symbol[coinType]) return Promise.reject(new Error('货币类型错误'));

  if (latestDateForDate[coinType] == moment().format('YYYYMMDD')) return Promise.resolve(date[coinType]);

  date[coinType] = {};

  return self.getMarketByDay(coinType).then(data => {
    latestDateForDate[coinType] = moment(data[data.length - 1][0]).format('YYYYMMDD');
    data.forEach(item => {
      const key = moment(item[0]).format('YYYYMMDD');
      date[coinType][key] = item[1];
    });
    return Promise.resolve(date[coinType]);
  });
}

/**
 * 从okcoin获取每天行情K线图
 * @param coinType
 */
exports.getMarketByDay = coinType => {
  return new Promise((resolve, reject) => {
    const query = {
      symbol: symbol[coinType],
      type: `1day`
    };
    request(`https://www.okcoin.cn/api/v1/kline.do?${qs.stringify(query)}`, function (err, httpResponse, body) {
      if (err) return reject(err);
      body = JSON.parse(body);
      if (body.error_code) return reject(new Error('获取行情失败'));
      resolve(body);
    });
  });
}

/**
 * 从okcoin获取K线图
 * @param coinType
 * @param unit 时间单位
 */
exports.getMarketKline = (coinType, unit, size = null) => {
  return new Promise((resolve, reject) => {
    const query = {
      symbol: symbol[coinType],
      type: unitData[unit]
    };
    if (size) query.size = size;
    request(`https://www.okcoin.cn/api/v1/kline.do?${qs.stringify(query)}`, function (err, httpResponse, body) {
      if (err) return reject(err);
      body = JSON.parse(body);
      if (body.error_code) return reject(new Error('获取行情失败'));
      resolve(body);
    });
  });
}

/**
 * 从okcoin获取交易
 * @param coinType
 * @param tid 交易ID
 */
exports.getLatestTrades = (coinType, tid = null) => {
  return new Promise((resolve, reject) => {
    const query = {
      symbol: symbol[coinType]
    };
    if (tid) query.since = tid;
    request(`https://www.okcoin.cn/api/v1/trades.do?${qs.stringify(query)}`, function (err, httpResponse, body) {
      if (err) return reject(err);
      body = JSON.parse(body);
      if (body.error_code) return reject(new Error('获取交易失败'));
      resolve(body);
    });
  });
}
