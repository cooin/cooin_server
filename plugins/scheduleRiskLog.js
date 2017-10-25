const schedule = require("node-schedule");
const moment = require('moment-timezone');
const _ = require('lodash');
const config = require('../config/config');

/**
 * 每日凌晨用户风险等级计算
 */
exports.register = (server, options, next) => {

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];

  const Master_register = DB.getModel('master_register');
  const Orderlist_bid = DB.getModel('orderlist_bid');
  const RiskLog = DB.getModel('riskLog');
  const RiskKLine = DB.getModel('riskKLine');

  const rule = new schedule.RecurrenceRule();
  // rule.hour = [0];
  // rule.minute = [59];
  schedule.scheduleJob(rule, () => {
    // internal.handel();
  });

  const internal = {};

  /**
   * 风险评估
   * @param profitRate 盈利率
   * @param profitCount 赢利数量比例
   */
  internal.evaluate = (profitRate, profitCountRate) => {
    profitRate *= 100;
    profitCountRate *= 100;
    let risk1;
    let risk2;
    const range = (start, end, value) => {
      return (start ? value >= start : true) && (end ? value < end : true) ? true : false;
    }
    switch(true) {
      case range(null, -20, profitRate) : risk1 = 10; break;
      case range(-20, -10, profitRate) : risk1 = 9; break;
      case range(-10, 0, profitRate) : risk1 = 8; break;
      case range(0, 10, profitRate) : risk1 = 7; break;
      case range(10, 20, profitRate) : risk1 = 6; break;
      case range(20, 30, profitRate) : risk1 = 5; break;
      case range(30, 40, profitRate) : risk1 = 4; break;
      case range(40, 50, profitRate) : risk1 = 3; break;
      case range(50, null, profitRate) : risk1 = 2; break;
    }
    switch(true) {
      case profitCountRate < 30 : risk2 = 10;
      case profitCountRate >= 30 && profitCountRate < 40 : risk2 = 9;
      case profitCountRate >= 40 && profitCountRate < 50 : risk2 = 8;
      case profitCountRate >= 50 && profitCountRate < 60 : risk2 = 7;
      case profitCountRate >= 60 && profitCountRate < 70 : risk2 = 6;
      case profitCountRate >= 70 && profitCountRate < 80 : risk2 = 5;
      case profitCountRate >= 80 && profitCountRate < 90 : risk2 = 4;
      case profitCountRate >= 90 && profitCountRate < 95 : risk2 = 3;
      case profitCountRate >= 95 : risk2 = 2;

      case range(null, 30, profitCountRate) : risk2 = 10; break;
      case range(30, 40, profitCountRate) : risk2 = 9; break;
      case range(40, 50, profitCountRate) : risk2 = 8; break;
      case range(50, 60, profitCountRate) : risk2 = 7; break;
      case range(60, 70, profitCountRate) : risk2 = 6; break;
      case range(70, 80, profitCountRate) : risk2 = 5; break;
      case range(80, 90, profitCountRate) : risk2 = 4; break;
      case range(90, 95, profitCountRate) : risk2 = 3; break;
      case range(95, null, profitCountRate) : risk2 = 2; break;
    }
    const risk = Number((risk1 * 0.7 + risk2 * 0.3).toFixed(0));

    return risk;
  }


  //计算每一个用户每日的风险值
  internal.do = username => {

    return Promise.all([
      //今日盈利率
      RiskLog.findOne({
        raw: true,
        attributes: ['rate'],
        where: {
          username,
          time: new Date(moment(moment().format('YYYY-MM-DD'))).getTime()
        }
      }),
      //今日委托赢利数量比例
      Orderlist_bid.findOne({
        raw: true,
        attributes: [
          [Sequelize.literal(`(sum(case when profitRate > 0 then 1 else 0 end) / sum(1))`), 'profitRate']
        ],
        where: {username, bors: 'b', moneyfrom: 'w', status: 6, updatedAt: {$gte: new Date(moment(moment().format('YYYY-MM-DD')))}},
        group: 'username'
      })
    ]).then(datas => {

      const risk = internal.evaluate(datas[0] ? datas[0].rate : 0, datas[1] ? datas[1] : 1);

      let model;
      const criteria = {username, time: new Date(moment(moment().format('YYYY-MM-DD'))).getTime()};
      const doc = {
        username,
        index: risk,
        time: new Date(moment(moment().format('YYYY-MM-DD'))).getTime()
      };
      return RiskLog.findOrCreate({
        where: criteria,
        defaults: doc
      }).then(data => {
        model = data[0];
        if (data[1]) return Promise.resolve();
        return model.update(doc);
      }).then(() => {
        //查询昨天的数据
        return RiskLog.findOne({
          raw: true,
          where: {
            username,
            id: {$lt: model.get().id}
          },
          order: [['id', 'DESC']]
        });
      }).then(data => {
        if (!data) return Promise.resolve();
        const rate = Number(((doc.index - data.index) / data.index).toFixed(6));
        return model.update({rate});
      }).then(data => {

        //月均风险
        const startTime = new Date(moment(moment().format('YYYY-MM')));

        const criteria = {
          username,
          time: startTime.getTime(),
          unit: '1month'
        };

        const doc = {
          username,
          time: startTime.getTime(),
          unit: '1month'
        };

        return RiskLog.findAll({where: {createdAt: {$gte: startTime}}}).then(data => {
          let total = 0;
          data.forEach(item => {
            total += item.index;
          });
          const risk = total / data.length;
          doc.index = risk;
          return RiskKLine.findOrCreate({
            where: criteria,
            defaults: doc
          });
        }).then(data => {
          if (data[1]) return Promise.resolve();
          return RiskKLine.update(doc, {where: criteria});
        });

      });
    });
  }

  internal.handel = () => {
    return Master_register.findAll({
      attributes: ['username'],
    }).then(data => {
      if (data.length == 0) return Promise.resolve();

      let counter = 0;
      const queue = () => {
        return internal.do(data[counter].username).then(() => {
          if (data[++counter]) return queue();
          return Promise.resolve();
        });
      }
      return queue();
    });
  }

  next();
};

exports.register.attributes = {
  name: 'schedule risk log',
  version: '1.0.0'
};
