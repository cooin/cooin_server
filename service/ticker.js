const moment = require('moment-timezone');
const _ = require('lodash');
const config = require('../config/config');
const client = require('../lib/redis').getClient();
const util_queue = require('../lib/queue');

/**
 * 推送行情
 * @param server
 * @param coinType
 */
exports.pushTicker = (server, coinType) => {

  return this.getTicker(server, coinType).then(data => {
    data.coinType = coinType;
    return socketUtil.emit('ticker', data);
  });

}

/**
 * 设置ticker
 * @param server
 * @param coinType
 * @param 截至时间
 */
exports.setTicker = (server, source, coinType, endTime = new Date()) => {

  const decimal = config.coin[coinType].decimal;

  const times = getTimes();

  const array_key_buyCount = [];
  const array_key_sellCount = [];
  const array_key_vol = [];
  const array_key_high = [];
  const array_key_low = [];
  const array_key_open = [];
  const array_key_close = [];

  times.forEach(item => {
    array_key_buyCount.push(`kline_${source}_${coinType}_${'1hour'}_${item}_buyCount`);
    array_key_sellCount.push(`kline_${source}_${coinType}_${'1hour'}_${item}_sellCount`);
    array_key_vol.push(`kline_${source}_${coinType}_${'1hour'}_${item}_vol`);
    array_key_high.push(`kline_${source}_${coinType}_${'1hour'}_${item}_high`);
    array_key_low.push(`kline_${source}_${coinType}_${'1hour'}_${item}_low`);
    array_key_open.push(`kline_${source}_${coinType}_${'1hour'}_${item}_open`);
    array_key_close.push(`kline_${source}_${coinType}_${'1hour'}_${item}_close`);
  });

  return Promise.all([
    client.mgetAsync(array_key_buyCount),
    client.mgetAsync(array_key_sellCount),
    client.mgetAsync(array_key_vol),
    client.mgetAsync(array_key_high),
    client.mgetAsync(array_key_low),
    client.mgetAsync(array_key_open),
    client.mgetAsync(array_key_close),
    //深度
    client.getAsync(`depth_${source}_${coinType}`)
  ]).then(data => {
    let [array_buyCount, array_sellCount, array_vol, array_high, array_low, array_open, array_close, depth] = data;

    if (!array_close[0]) return Promise.resolve();
    if (!depth) return Promise.resolve();

    depth = depth ? JSON.parse(depth) : depth;

    let buyCount = 0;
    let sellCount = 0;
    let vol = 0;
    let high = Number(array_high[0]);
    let low = Number(array_low[0]);
    let open = null;
    let last = Number(JSON.parse(array_close[0]).price);

    let buy = depth ? depth.bids[0][0] : null;
    let sell = depth ? depth.asks[0][0] : null;

    const KLine = [];

    times.forEach((item, index) => {
      buyCount += array_buyCount[index] ? Number(array_buyCount[index]) : 0;
      sellCount += array_sellCount[index] ? Number(array_sellCount[index]) : 0;
      vol += array_vol[index] ? Number(array_vol[index]) : 0;
      high = high > Number(array_high[index]) ? high : Number(array_high[index]);
      low = array_low[index] ? (low < Number(array_low[index]) ? low : Number(array_low[index])) : low;
      if (array_open[index]) open = Number(JSON.parse(array_open[index]).price);

      if (array_open[index]) {
        KLine.push({
          vol: array_vol[index],
          high: array_high[index],
          low: array_low[index],
          open: JSON.parse(array_open[index]).price,
          close: JSON.parse(array_close[index]).price,
          time: new Date(moment(item, 'YYYYMMDDHH')).getTime()
        });
      }
    });

    vol = Number(vol.toFixed(decimal));

    const buyRate = (1- buyCount / (buyCount + sellCount)).toFixed(2);

    const ticker = {vol, high, low, open, last, KLine, buy, sell, buyRate};

    return client.setAsync(`ticker_${source}_${coinType}`, JSON.stringify(ticker)).then(() => {

      //插入行情队列
      util_queue.insert('market', {source, coinType, buy: ticker.buy, sell: ticker.sell});

      ticker.logo = config.exchange[source].logo();
      ticker.source = config.exchange[source].name;
      ticker.source_cn = config.exchange[source].name_cn;
      ticker.coin = config.coin[coinType].name;
      ticker.coin_cn = config.coin[coinType].name_cn;
      ticker.coin_logo = config.coin[coinType].logo();
      ticker.code = config.coin[coinType].code;

      //socket推送
      socketUtil.emit('ticker', ticker);
      return Promise.resolve(ticker);
    });

  });
}

/**
 * 设置ticker状态
 * @param server
 * @param source
 * @param coinType
 * @param usable
 * @returns {Promise.<TResult>}
 */
exports.setTickerStatus = (server, source, coinType, usable = false) => {
  return client.setAsync(`status_ticker_${source}_${coinType}`, usable ? 1 : 0);
}

/**
 * 获取ticker状态
 * @param server
 * @param source
 * @param coinType
 * @returns {Promise.<TResult>}
 */
exports.getTickerStatus = (server, source, coinType) => {
  return client.getAsync(`status_ticker_${source}_${coinType}`);
}

const getTimes = () => {
  let now = Date.now();
  const times = [];
  for (let i = 0; i < 24; i++) {
    const time = moment(now).format('YYYYMMDDHH');
    now -= 3600000;
    times.push(time);
  }
  return times;
}
