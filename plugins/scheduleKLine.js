const schedule = require("node-schedule");
const moment = require('moment-timezone');
const _ = require('lodash');
const config = require('../config/config');
// const KLINE_SOURCE_FROM_SELF = parseInt(process.env.KLINE_SOURCE_FROM_SELF);
const KLINE_SOURCE_FROM_SELF = false;

/**
 * kLine定时计算
 *
 * 1min
 * 》》每分钟计算1次，每次聚合当前时间前一分钟内所有的数据，进行插入或者更新操作
 * 》》如果聚合数据为空则以上一分钟数据为基准进行插值
 * 》》如果前一分钟数据为空则不进行任何处理
 *
 * 3min
 * 》》在分钟数是3的倍数时候计算
 * 》》以1min kLine为基准值计算
 *
 *
 */
exports.register = (server, options, next) => {

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];

  const Trade = DB.getModel('trade');
  const KLine = DB.getModel('kLine');

  const rule = new schedule.RecurrenceRule();
  // rule.second = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
  // rule.second = [0, 10, 20, 30, 40, 50];
  schedule.scheduleJob(rule, () => {
    // internal.past();
  });

  const interval_1min = 60000;

  const internal = {};

  //handle
  internal.handle = (startTime, endTime, unit, interval, coinType, source) => {
    return Promise.all([
      //vol,high,low
      Trade.findOne({
        raw: true,
        attributes: [
          'coinType',
          [Sequelize.fn('SUM', Sequelize.col('amount')), 'vol'],
          [Sequelize.fn('MAX', Sequelize.col('price')), 'high'],
          [Sequelize.fn('MIN', Sequelize.col('price')), 'low']
        ],
        where: {
          source,
          coinType,
          createdAt: {$gte: startTime, $lt: endTime}
        },
        group: 'coinType'
      }),
      //open
      Trade.findOne({
        raw: true,
        attributes: ['price'],
        where: {
          source,
          coinType,
          createdAt: {$gte: startTime, $lt: endTime}
        }
      }),
      //close
      Trade.findOne({
        raw: true,
        attributes: ['price'],
        where: {
          source,
          coinType,
          createdAt: {$gte: startTime, $lt: endTime}
        },
        order: [['id', 'DESC']]
      })
    ]).then(datas => {
      // console.log('*******kline*******');
      // console.log(datas);

      const decimal = config.coin[coinType].decimal;
      const criteria = {unit, source, coinType, time: startTime.getTime()};
      //没有数据
      if (!datas[0]) {
        //查询上一分钟的数据
        return KLine.findOne({
          where: {
            unit,
            source,
            coinType,
            time: new Date(startTime.getTime() - interval).getTime()
          }
        }).then(data => {
          if (!data) return Promise.resolve();
          const doc = JSON.parse(JSON.stringify(data));
          delete doc.id;
          doc.time = startTime.getTime();
          doc.high = doc.close;
          doc.low = doc.close;
          doc.open = doc.close;
          doc.close = doc.close;
          doc.vol = 0;
          doc.createdAt = startTime;
          return KLine.findOrCreate({
            where: criteria,
            defaults: doc
          }).then(data => {
            return Promise.resolve(data[0]);
          });
        });
      }
      //新建
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
          open: datas[1].price,
          close: datas[2].price,
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
          open: datas[1].price,
          close: datas[2].price,
        }, {
          where: criteria,
        }).then(() => {
          return KLine.findOne({where: criteria});
        });
      });
    });
  };


  internal.common = (startTime, endTime, unit, subUnit, coinType, source) => {
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
  };

  internal.past = () => {
    for(let source in config.exchange) {
      config.exchange[source].coins.forEach(coinType => {
        //1min
        let startTime = new Date(moment(moment().format('YYYY-MM-DD HH:mm')));
        let endTime = new Date();
        //如果统计时间为一分钟的开始一秒内，则统计上一分钟的数据
        if (endTime.getTime() - startTime.getTime() < 1000) {
          endTime = startTime;
          startTime = new Date(startTime.getTime() - interval_1min);
        }
        return internal.handle(startTime, endTime, '1min', interval_1min, coinType, source).then(data => {
          //推送kLine数据
          if (KLINE_SOURCE_FROM_SELF && data) socketUtil.emit('kLine', _.pick(data, config.attributes.kLine.detail));
          //3min
          const minute = moment(startTime).minute() - moment(startTime).minute() % 3;
          startTime = new Date(moment(startTime).minute(minute));
          return internal.common(startTime, endTime, '3min', '1min', coinType, source);
        }).then(data => {
          //推送kLine数据
          if (KLINE_SOURCE_FROM_SELF && data) socketUtil.emit('kLine', _.pick(data, config.attributes.kLine.detail));
          //5min
          const minute = moment(startTime).minute() - moment(startTime).minute() % 5;
          startTime = new Date(moment(startTime).minute(minute));
          return internal.common(startTime, endTime, '5min', '1min', coinType, source);
        }).then(data => {
          //推送kLine数据
          if (KLINE_SOURCE_FROM_SELF && data) socketUtil.emit('kLine', _.pick(data, config.attributes.kLine.detail));
          //15min
          const minute = moment(startTime).minute() - moment(startTime).minute() % 15;
          startTime = new Date(moment(startTime).minute(minute));
          return internal.common(startTime, endTime, '15min', '5min', coinType, source);
        }).then(data => {
          //推送kLine数据
          if (KLINE_SOURCE_FROM_SELF && data) socketUtil.emit('kLine', _.pick(data, config.attributes.kLine.detail));
          //30min
          const minute = moment(startTime).minute() - moment(startTime).minute() % 30;
          startTime = new Date(moment(startTime).minute(minute));
          return internal.common(startTime, endTime, '30min', '15min', coinType, source);
        }).then(data => {
          //推送kLine数据
          if (KLINE_SOURCE_FROM_SELF && data) socketUtil.emit('kLine', _.pick(data, config.attributes.kLine.detail));
          //1hour
          startTime = new Date(moment(moment(startTime).format('YYYY-MM-DD HH')));
          return internal.common(startTime, endTime, '1hour', '30min', coinType, source);
        }).then(data => {
          //推送kLine数据
          if (KLINE_SOURCE_FROM_SELF && data) socketUtil.emit('kLine', _.pick(data, config.attributes.kLine.detail));
          //4hour
          const hour = moment(startTime).hour() - moment(startTime).hour() % 4;
          startTime = new Date(moment(startTime).hour(hour).minute(0));
          return internal.common(startTime, endTime, '4hour', '1hour', coinType, source);
        }).then(data => {
          //推送kLine数据
          if (KLINE_SOURCE_FROM_SELF && data) socketUtil.emit('kLine', _.pick(data, config.attributes.kLine.detail));
          //1day
          startTime = new Date(moment(moment(startTime).format('YYYY-MM-DD')));
          return internal.common(startTime, endTime, '1day', '4hour', coinType, source);
        }).then(data => {
          //推送kLine数据
          if (KLINE_SOURCE_FROM_SELF && data) socketUtil.emit('kLine', _.pick(data, config.attributes.kLine.detail));
          //1week
          startTime = new Date(moment(moment(startTime).day(1).format('YYYY-MM-DD')));
          return internal.common(startTime, endTime, '1week', '1day', coinType, source);
        }).catch(err => logger.error(err));
      })
    }
  };

  next();
};

exports.register.attributes = {
  name: 'schedule kLine',
  version: '1.0.0'
};
