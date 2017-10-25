const moment = require('moment-timezone');
const _ = require('lodash');
const config = require('../config/config');
const client = require('../lib/redis').getClient();
const util_queue = require('../lib/queue');

const klineConfig = {
  // oneMin: {
  //   name: '1min',
  //   format: 'YYYYMMDDHHmm'
  // },
  oneHour: {
    name: '1hour',
    format: 'YYYYMMDDHH'
  }
};

/**
 * 处理
 * @param server
 * @param source
 * @param coinType
 * @param docs
 * @returns {*}
 */
exports.handel = (server, source, coinType, docs) => {
  for (let key in klineConfig) {
    this.do(server, source, coinType, klineConfig[key].name, klineConfig[key].format, docs);
  }
}

/**
 * 处理kline
 * @param server
 * @param source
 * @param coinType
 * @param docs
 * @returns {*}
 */
exports.do = (server, source, coinType, unit, format, docs) => {
  const obj = {};
  docs.forEach(item => {
    const key = moment(item.createdAt).format(format);
    if (!obj[key]) obj[key] = {
      buyCount: 0,
      sellCount: 0,
      vol: 0,
      high: item.price,
      low: item.price,
      open: item,
      close: item,
    };
    obj[key].buyCount += item.type == 'buy' ? 1 : 0;
    obj[key].sellCount += item.type == 'sell' ? 1 : 0;
    obj[key].vol += Number(item.amount);
    obj[key].high = obj[key].high > item.price ? obj[key].high : item.price;
    obj[key].low = obj[key].low < item.price ? obj[key].low : item.price;
    obj[key].open = new Date(obj[key].open.createdAt).getTime() < new Date(item.createdAt).getTime() ? obj[key].open : _.pick(item, ['price', 'createdAt']);
    obj[key].close = new Date(obj[key].close.createdAt).getTime() > new Date(item.createdAt).getTime() ? obj[key].close : _.pick(item, ['price', 'createdAt']);
    obj[key].vol = Number(Number(obj[key].vol).toFixed(6));
  });

  for (let key in obj) {
    const key_buyCount = `kline_${source}_${coinType}_${unit}_${key}_buyCount`;
    const key_sellCount = `kline_${source}_${coinType}_${unit}_${key}_sellCount`;
    const key_vol = `kline_${source}_${coinType}_${unit}_${key}_vol`;
    const key_high = `kline_${source}_${coinType}_${unit}_${key}_high`;
    const key_low = `kline_${source}_${coinType}_${unit}_${key}_low`;
    const key_open = `kline_${source}_${coinType}_${unit}_${key}_open`;
    const key_close = `kline_${source}_${coinType}_${unit}_${key}_close`;

    client.mgetAsync([key_buyCount, key_sellCount, key_vol, key_high, key_low, key_open, key_close]).then(datas => {

      const [buyCount, sellCount, vol, high, low , open, close] = datas;

      const multi = client.multi();

      if (buyCount) {
        multi.incrby(key_buyCount, obj[key].buyCount);
      } else {
        multi.set(key_buyCount, obj[key].buyCount).expire(key_buyCount, 24 * 3600);
      }

      if (sellCount) {
        multi.incrby(key_sellCount, obj[key].sellCount);
      } else {
        multi.set(key_sellCount, obj[key].sellCount).expire(key_sellCount, 24 * 3600);
      }

      if (vol) {
        multi.incrbyfloat(key_vol, obj[key].vol);
      } else {
        multi.set(key_vol, obj[key].vol).expire(key_vol, 24 * 3600);
      }

      if (!high || Number(high) < obj[key].high) multi.set(key_high, obj[key].high).expire(key_high, 24 * 3600);

      if (!low || Number(low) > obj[key].low) multi.set(key_low, obj[key].low).expire(key_low, 24 * 3600);

      if (!open || new Date(JSON.parse(open).createdAt).getTime() > new Date(obj[key].open.createdAt).getTime()) multi.set(key_open, JSON.stringify(obj[key].open)).expire(key_open, 24 * 3600);

      if (!close || new Date(JSON.parse(close).createdAt).getTime() < new Date(obj[key].close.createdAt).getTime()) multi.set(key_close, JSON.stringify(obj[key].close)).expire(key_close, 24 * 3600);

      return multi.execAsync();
    }).then(() => {
      return client.mgetAsync([key_buyCount, key_sellCount, key_vol, key_high, key_low, key_open, key_close]);
    }).then(datas => {
      // console.log(datas);
    });

  }

}
