const schedule = require("node-schedule");
const moment = require('moment-timezone');
//下单机器人每次购买数量范围btc
const ORDER_ROBOT_QUANTITY_BTC = process.env.ORDER_ROBOT_QUANTITY_BTC.split(',');
//下单机器人每次购买数量范围ltc
const ORDER_ROBOT_QUANTITY_LTC = process.env.ORDER_ROBOT_QUANTITY_LTC.split(',');

/**
 * 补全kLine（补全到2017-03-01）
 *
 */
exports.register = (server, options, next) => {

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];

  const Orderlist_bid_log = DB.getModel('orderlist_bid_log');
  const KLine = DB.getModel('kLine');

  const source = 'bitekuang';

  const interval_1min = 60000;
  const interval_3min = 3 * 60000;
  const interval_5min = 5 * 60000;
  const interval_15min = 15 * 60000;
  const interval_30min = 30 * 60000;
  const interval_1day = 24 * 60 * 60000;
  const interval_1week = 7 * 24 * 60 * 60000;

  const internal = {};

  //handle
  internal.handle = (startTime, endTime, unit, interval, coinType) => {
    return Promise.all([
      //vol,high,low
      Orderlist_bid_log.findAll({
        raw: true,
        attributes: [
          'coinType',
          [Sequelize.fn('SUM', Sequelize.col('quantity')), 'vol'],
          [Sequelize.fn('MAX', Sequelize.col('transPrice')), 'high'],
          [Sequelize.fn('MIN', Sequelize.col('transPrice')), 'low']
        ],
        where: {
          coinType,
          createdAt: {$gte: startTime, $lt: endTime}
        },
        group: 'coinType'
      }),
      //open
      Orderlist_bid_log.findOne({
        raw: true,
        attributes: ['transPrice'],
        where: {
          coinType,
          createdAt: {$gte: startTime, $lt: endTime}
        }
      }),
      //close
      Orderlist_bid_log.findOne({
        raw: true,
        attributes: ['transPrice'],
        where: {
          coinType,
          createdAt: {$gte: startTime, $lt: endTime}
        },
        order: [['id', 'DESC']]
      })
    ]).then(datas => {
      console.log('*******competionKLine*******');
      console.log(datas);
      console.log({
        coinType,
        createdAt: {$gte: startTime, $lt: endTime}
      });

      let decimal;
      if (coinType == 'btc') decimal = ORDER_ROBOT_QUANTITY_BTC[2];
      if (coinType == 'ltc') decimal = ORDER_ROBOT_QUANTITY_LTC[2];
      //没有数据
      if (!datas[0][0]) {
        //查询上一分钟的数据
        return KLine.findOne({
          where: {
            unit,
            source,
            coinType,
            time: new Date(endTime.getTime() - interval).getTime()
          }
        }).then(data => {
          if (!data) return Promise.resolve();
          const doc = JSON.parse(JSON.stringify(data));
          delete doc.id;
          doc.time = endTime.getTime();
          doc.high = doc.close;
          doc.low = doc.close;
          doc.open = doc.close;
          doc.close = doc.close;
          doc.vol = 0;
          doc.createdAt = endTime;
          return KLine.findOrCreate({
            where: {unit, source, coinType, time: endTime.getTime()},
            defaults: doc
          });
        });
      }
      return KLine.findOrCreate({
        where: {unit, source, coinType, time: endTime.getTime()},
        defaults: {
          source: 'bitekuang',
          coinType: datas[0][0].coinType,
          unit: unit,
          time: endTime.getTime(),
          high: datas[0][0].high,
          low: datas[0][0].low,
          vol: Number(Number(datas[0][0].vol).toFixed(decimal)),
          open: datas[1].transPrice,
          close: datas[2].transPrice,
          createdAt: endTime
        }
      });
    });
  };


  internal.common = (startTime, endTime, unit, subUnit, coinType) => {
    return Promise.all([
      //vol,high,low
      KLine.findAll({
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
          createdAt: {$gt: startTime, $lte: endTime}
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
          createdAt: {$gt: startTime, $lte: endTime}
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
          createdAt: {$gt: startTime, $lte: endTime}
        },
        order: [['id', 'DESC']]
      })
    ]).then(datas => {
      console.log(`*******competionKLine ${unit}*******`);
      console.log(datas);
      console.log({
        source,
        coinType,
        unit: subUnit,
        createdAt: {$gt: startTime, $lte: endTime}
      });

      let decimal;
      if (coinType == 'btc') decimal = ORDER_ROBOT_QUANTITY_BTC[2];
      if (coinType == 'ltc') decimal = ORDER_ROBOT_QUANTITY_LTC[2];

      return KLine.findOrCreate({
        where: {unit, source, coinType, time: endTime.getTime()},
        defaults: {
          source: 'bitekuang',
          coinType: datas[0][0].coinType,
          unit: unit,
          time: endTime.getTime(),
          high: datas[0][0].high,
          low: datas[0][0].low,
          vol: Number(Number(datas[0][0].vol).toFixed(decimal)),
          open: datas[1].open,
          close: datas[2].close,
          createdAt: endTime
        }
      });

    });
  };


  internal.past = coinType => {

    let finishTime;
    let startTime;

    //查询撮合交易起始时间
    return Orderlist_bid_log.findOne({
      attributes: ['createdAt'],
      where: {coinType},
      order: [['createdAt', 'ASC']]
    }).then(data => {
      if (new Date(data.createdAt).getTime() > new Date('2017-03-01').getTime()) {
        startTime = new Date(moment(moment(data.createdAt).format('YYYY-MM-DD HH:mm')));
      } else {
        startTime = new Date('2017-03-01');
      }


      //查询kLine起始时间（作为补全的结束时间）
      return KLine.findOne({
        attributes: ['createdAt'],
        where: {source, coinType}
      });
    }).then(data => {
      if (data) {
        finishTime = new Date(data.createdAt);
      } else {
        finishTime = new Date();
      }

      internal.do = coinType => {
        let endTime = new Date(startTime.getTime() + interval_1min);
        console.log('**********start************');
        console.log(endTime);
        if (endTime.getTime() > finishTime.getTime()) return Promise.resolve();
        return internal.handle(startTime, endTime, '1min', interval_1min, coinType).then(() => {
          //3min、5min
          if (moment(endTime).minute() % 3 != 0 && moment(endTime).minute() % 5 != 0) return Promise.resolve();
          if (moment(endTime).minute() % 3 == 0 && moment(endTime).minute() % 5 != 0) {
            return internal.common(new Date(endTime.getTime() - interval_3min), endTime, '3min', '1min', coinType);
          }
          if (moment(endTime).minute() % 3 != 0 && moment(endTime).minute() % 5 == 0) {
            return internal.common(new Date(endTime.getTime() - interval_5min), endTime, '5min', '1min', coinType);
          }
          if (moment(endTime).minute() % 3 == 0 && moment(endTime).minute() % 5 == 0) {
            return Promise.all([
              internal.common(new Date(endTime.getTime() - interval_3min), endTime, '3min', '1min', coinType),
              internal.common(new Date(endTime.getTime() - interval_5min), endTime, '5min', '1min', coinType)
            ]);
          }
        }).then(() => {
          //15min
          if (moment(endTime).minute() % 15 != 0) return Promise.resolve();
          return internal.common(new Date(endTime.getTime() - interval_15min), endTime, '15min', '5min', coinType);
        }).then(() => {
          //30min
          if (moment(endTime).minute() % 30 != 0) return Promise.resolve();
          return internal.common(new Date(endTime.getTime() - interval_30min), endTime, '30min', '15min', coinType);
        }).then(() => {
          //1day
          if (moment(endTime).hour() != 0 || moment(endTime).minute() != 0) return Promise.resolve();
          return internal.common(new Date(endTime.getTime() - interval_1day), endTime, '1day', '30min', coinType);
        }).then(() => {
          //1week
          if (moment(endTime).day() != 1 || moment(endTime).hour() != 0 || moment(endTime).minute() != 0) return Promise.resolve();
          return internal.common(new Date(endTime.getTime() - interval_1week), endTime, '1week', '1day', coinType);
        }).then(() => {
          startTime = new Date(startTime.getTime() + interval_1min);
          console.log('**********finish************');
          return internal.do(coinType);
        });
      };

      return internal.do(coinType);

    })

  };

  // internal.past('btc').then(() => internal.past('ltc'));
  // internal.past('btc');
  // internal.past('ltc');

  next();
};

exports.register.attributes = {
  name: 'competionKLine kLine',
  version: '1.0.0'
};
