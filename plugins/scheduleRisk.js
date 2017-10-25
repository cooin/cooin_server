const schedule = require("node-schedule");
const moment = require('moment-timezone');
const _ = require('lodash');
const config = require('../config/config');

/**
 * 用户风险评级
 */
exports.register = (server, options, next) => {

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];

  const Master_register = DB.getModel('master_register');
  const RiskLog = DB.getModel('riskLog');

  const rule = new schedule.RecurrenceRule();
  // rule.hour = [1];
  // rule.minute = [59];
  schedule.scheduleJob(rule, () => {
    // internal.handel();
  });

  const internal = {};


  //计算每一个用户的风险评级
  internal.do = username => {

    return RiskLog.findAll({
      attributes: ['id', 'index'],
      where: {username},
      order: [['id', 'DESC']],
      limit: 365
    }).then(data => {

      let riskFor1Week = 0;
      let riskFor1Month = 0;
      let riskFor1Year = 0;

      data.slice(0, 7).forEach(item => {
        riskFor1Week += item.index;
      });
      riskFor1Week = Number((riskFor1Week / (data.length >= 7 ? 7 : data.length)).toFixed(0));

      data.slice(0, 30).forEach(item => {
        riskFor1Month += item.index;
      });
      riskFor1Month = Number((riskFor1Month / (data.length >= 30 ? 30 : data.length)).toFixed(0));

      data.forEach(item => {
        riskFor1Year += item.index;
      });
      riskFor1Year = Number((riskFor1Year / (data.length >= 365 ? 365 : data.length)).toFixed(0));

      return Master_register.update({
        riskIndex: riskFor1Week,
        riskFor1Week,
        riskFor1Month,
        riskFor1Year
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
  name: 'schedule risk',
  version: '1.0.0'
};
