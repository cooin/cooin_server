const schedule = require("node-schedule");
const moment = require('moment-timezone');
const _ = require('lodash');
const config = require('../config/config');

/**
 * 每日凌晨用户盈利率计算
 */
exports.register = (server, options, next) => {

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];

  const Master_register = DB.getModel('master_register');
  const AssetsLog = DB.getModel('assetsLog');

  const rule = new schedule.RecurrenceRule();
  // rule.hour = [1];
  // rule.minute = [59];
  schedule.scheduleJob(rule, () => {
    // internal.handel();
  });

  const internal = {};


  //计算每一个用户的盈利率
  internal.do = username => {

    //一周
    return AssetsLog.findAll({
      attributes: ['id', 'rate'],
      where: {username},
      order: [['id', 'DESC']],
      limit: 365,
    }).then(data => {

      let profitRateFor1Day = data[0].rate;
      let profitRateFor1Week = 1;
      let profitRateFor1Month = 1;
      let profitRateFor3Month = 1;
      let profitRateFor6Month = 1;
      let profitRateFor1Year = 1;

      data.slice(0, 7).forEach(item => {
        profitRateFor1Week *= (1 + item.rate);
      });
      profitRateFor1Week = Number((profitRateFor1Week - 1).toFixed(2));

      data.slice(0, 30).forEach(item => {
        profitRateFor1Month *= (1 + item.rate);
      });
      profitRateFor1Month = Number((profitRateFor1Month - 1).toFixed(2));

      data.slice(0, 90).forEach(item => {
        profitRateFor3Month *= (1 + item.rate);
      });
      profitRateFor3Month = Number((profitRateFor3Month - 1).toFixed(2));

      data.slice(0, 180).forEach(item => {
        profitRateFor6Month *= (1 + item.rate);
      });
      profitRateFor6Month = Number((profitRateFor6Month - 1).toFixed(2));

      data.forEach(item => {
        profitRateFor1Year *= (1 + item.rate);
      });
      profitRateFor1Year = Number((profitRateFor1Year - 1).toFixed(2));

      return Master_register.update({
        profitRateFor1Day,
        profitRateFor1Week,
        profitRateFor1Month,
        profitRateFor3Month,
        profitRateFor6Month,
        profitRateFor1Year
      }, {where: {username}});
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
  name: 'schedule profit rate',
  version: '1.0.0'
};
