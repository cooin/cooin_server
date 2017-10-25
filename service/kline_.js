const moment = require('moment-timezone');
const _ = require('lodash');
const config = require('../config/config');
const client = require('../lib/redis').getClient();
const util_queue = require('../lib/queue');


/**
 * 处理kline
 * @param server
 * @param source
 * @param coinType
 * @param datas
 * @returns {*}
 */
exports.handel = (server, source, coinType, datas) => {
  const obj = {};
  datas.forEach(item => {
    const key = moment(item.createdAt).format('YYYYMMDDHHmm');
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
    const key_buyCount = `kline_${source}_${coinType}_${key}_buyCount`;
    const key_sellCount = `kline_${source}_${coinType}_${key}_sellCount`;
    const key_vol = `kline_${source}_${coinType}_${key}_vol`;
    const key_high = `kline_${source}_${coinType}_${key}_high`;
    const key_low = `kline_${source}_${coinType}_${key}_low`;
    const key_open = `kline_${source}_${coinType}_${key}_open`;
    const key_close = `kline_${source}_${coinType}_${key}_close`;

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
        multi.set(key_vol, obj[key].vol).expire(key_vol, 300);
      }

      if (!high || Number(high) < obj[key].high) multi.set(key_high, obj[key].high).expire(key_high, 300);

      if (!low || Number(low) > obj[key].low) multi.set(key_low, obj[key].low).expire(key_low, 300);

      if (!open || new Date(JSON.parse(open).createdAt).getTime() > new Date(obj[key].open.createdAt).getTime()) multi.set(key_open, JSON.stringify(obj[key].open)).expire(key_open, 300);

      if (!close || new Date(JSON.parse(close).createdAt).getTime() < new Date(obj[key].close.createdAt).getTime()) multi.set(key_close, JSON.stringify(obj[key].close)).expire(key_close, 300);

      return multi.execAsync();
    }).then(data => {

      return client.mgetAsync([key_buyCount, key_sellCount, key_vol, key_high, key_low, key_open, key_close]);
    }).then(datas => {
      const [buyCount, sellCount, vol, high, low , open, close] = datas;
      const time = new Date(moment(key, 'YYYYMMDDHHmm')).getTime();
      return this.do(server, source, coinType, time, JSON.parse(open).price, JSON.parse(close).price, high, low, vol);
    });

  }

}

/**
 * 保存或者更新
 * @param server
 * @param source
 * @param coinType
 * @param time
 * @param open
 * @param close
 * @param high
 * @param low
 * @param vol
 */
exports.do = (server, source, coinType, time, open, close, high, low, vol) => {

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];
  const KLine = DB.getModel('kLine');

  const unit = '1min';

  const doc = {source, coinType, unit, time, open, close, high, low, vol, createdAt: new Date(time)};
  const criteria = {unit, source, coinType, time};

  let docFor1min;

  //新建
  return KLine.findOrCreate({
    where: criteria,
    defaults: doc
  }).then(data => {
    if (data[1]) return Promise.resolve(data[0]);
    return KLine.update(doc, {where: criteria}).then(() => {
      return KLine.findOne({where: criteria});
    });
  }).then(data => {
    docFor1min = data;

    //3min
    const minute = moment(time).minute() - moment(time).minute() % 3;
    const startTime = new Date(moment(time).minute(minute));
    const endTime = new Date(moment(startTime).minute(minute + 3));
    return this.common(server, startTime, endTime, '3min', '1min', coinType, source, docFor1min);
  }).then(data => {

    //5min
    const minute = moment(time).minute() - moment(time).minute() % 5;
    const startTime = new Date(moment(time).minute(minute));
    const endTime = new Date(moment(startTime).minute(minute + 5));
    return this.common(server, startTime, endTime, '5min', '1min', coinType, source, docFor1min);
  }).then(data => {

    //15min
    const minute = moment(time).minute() - moment(time).minute() % 15;
    const startTime = new Date(moment(time).minute(minute));
    const endTime = new Date(moment(startTime).minute(minute + 15));
    return this.common(server, startTime, endTime, '15min', '5min', coinType, source, docFor1min);
  }).then(data => {

    //30min
    const minute = moment(time).minute() - moment(time).minute() % 30;
    const startTime = new Date(moment(time).minute(minute));
    const endTime = new Date(moment(startTime).minute(minute + 30));
    return this.common(server, startTime, endTime, '30min', '15min', coinType, source, docFor1min);
  }).then(data => {

    //1hour
    const hour = moment(time).hour();
    const startTime = new Date(moment(moment(time).format('YYYY-MM-DD HH')));
    const endTime = new Date(moment(startTime).hour(hour + 1));
    return this.common(server, startTime, endTime, '1hour', '30min', coinType, source, docFor1min);
  }).then(data => {

    //4hour
    const hour = moment(time).hour() - moment(time).hour() % 4;
    const startTime = new Date(moment(time).hour(hour).minute(0));
    const endTime = new Date(moment(startTime).hour(hour + 4));
    return this.common(server, startTime, endTime, '4hour', '1hour', coinType, source, docFor1min);
  }).then(data => {

    //1day
    const date = moment(time).date();
    const startTime = new Date(moment(moment(time).format('YYYY-MM-DD')));
    const endTime = new Date(moment(startTime).date(date + 1));
    return this.common(server, startTime, endTime, '1day', '4hour', coinType, source, docFor1min);
  }).then(data => {

    //1week
    const date = moment(time).date();
    const startTime = new Date(moment(moment(time).day(1).format('YYYY-MM-DD')));
    const endTime = new Date(moment(startTime).date(date + 7));
    return this.common(server, startTime, endTime, '1week', '1day', coinType, source, docFor1min);
  });
}

/**
 * 通用处理
 * @param startTime
 * @param endTime
 * @param unit
 * @param subUnit
 * @param coinType
 * @param source
 * @returns {Promise.<TResult>}
 */
exports.common = (server, startTime, endTime, unit, subUnit, coinType, source) => {

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];
  const KLine = DB.getModel('kLine');

  return Promise.all([
    //vol,high,low
    KLine.findOne({
      raw: true,
      attributes: [
        'coinType',
        [Sequelize.fn('SUM', Sequelize.col('vol')), 'vol'],
        [Sequelize.fn('MAX', Sequelize.col('high')), 'high'],
        [Sequelize.fn('MIN', Sequelize.col('low')), 'low']
      ],
      where: {
        source,
        coinType,
        unit: subUnit,
        createdAt: {$gte: startTime, $lt: endTime}
      },
      group: 'coinType'
    }),
    //open
    KLine.findOne({
      raw: true,
      attributes: ['open'],
      where: {
        source,
        coinType,
        unit: subUnit,
        createdAt: {$gte: startTime, $lt: endTime}
      }
    }),
    //close
    KLine.findOne({
      raw: true,
      attributes: ['close'],
      where: {
        source,
        coinType,
        unit: subUnit,
        createdAt: {$gte: startTime, $lt: endTime}
      },
      order: [['id', 'DESC']]
    })
  ]).then(datas => {
    // console.log(`*******kline ${unit} ${source} ${coinType}*******`);
    // console.log(datas);
    if (!datas[0]) return Promise.resolve();

    const decimal = config.coin[coinType].decimal;
    const criteria = {unit, source, coinType, time: startTime.getTime()};

    return KLine.findOrCreate({
      where: criteria,
      defaults: {
        source: source,
        coinType: coinType,
        unit: unit,
        time: startTime.getTime(),
        high: datas[0].high,
        low: datas[0].low,
        vol: Number(Number(datas[0].vol).toFixed(decimal)),
        open: datas[1].open,
        close: datas[2].close,
        createdAt: startTime
      }
    }).then(data => {
      //新建
      if (data[1]) return Promise.resolve(data[0]);
      //更新
      return KLine.update({
        high: datas[0].high,
        low: datas[0].low,
        vol: Number(Number(datas[0].vol).toFixed(decimal)),
        open: datas[1].open,
        close: datas[2].close,
      }, {
        where: criteria,
      }).then(() => {
        return KLine.findOne({where: criteria});
      });
    });

  });
}

/**
 * 通用处理
 * @param startTime
 * @param endTime
 * @param unit
 * @param subUnit
 * @param coinType
 * @param source
 * @returns {Promise.<TResult>}
 */
exports.common_ = (server, startTime, endTime, unit, subUnit, coinType, source, docFor1min) => {

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];
  const KLine = DB.getModel('kLine');

  const decimal = config.coin[coinType].decimal;

  const criteria = {unit, source, coinType, time: startTime.getTime()};

  return KLine.findOne({where: criteria}).then(data => {
    //不存在
    if (!data) {
      const doc = {
        source,
        coinType,
        unit,
        time: startTime.getTime(),
        high: docFor1min.high,
        low: docFor1min.low,
        vol: docFor1min.vol,
        open: docFor1min.open,
        close: docFor1min.close,
        createdAt: startTime
      };
      return KLine.create(doc);
    }

    //更新
    const doc = {};
    if (docFor1min.high > data.high) doc.high = docFor1min.high;
    if (docFor1min.low < data.low) doc.low = docFor1min.low;
    if (docFor1min.time == data.time) doc.open = docFor1min.open;
    doc.close = docFor1min.close;
    doc.vol = Sequelize.literal(`cast(vol + ${docFor1min.vol} as decimal(18, ${decimal}))`);

    //vol
    return KLine.findOne({
      raw: true,
      attributes: [
        [Sequelize.fn('SUM', Sequelize.col('vol')), 'vol']
      ],
      where: {
        source,
        coinType,
        unit: subUnit,
        createdAt: {$gte: startTime, $lt: endTime}
      },
      group: 'coinType'
    }).then(data => {
      doc.vol = data.vol;
      return KLine.update(doc, {where: criteria});
    });
  }).then(data => {
    return KLine.findOne({where: criteria});
  });
}
