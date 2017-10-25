/**
 * 每日23:59:00生成明天的附言号码
 */

const schedule = require("node-schedule");
const moment = require('moment-timezone');
const util_postscriptGenerator = require('../lib/postscriptGenerator');

exports.register = (server, options, next) => {

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];

  //扣款
  const rule = new schedule.RecurrenceRule();
  rule.hour = 23;
  rule.minute = 59;
  rule.second = 0;
  schedule.scheduleJob(rule, () => {
    internal.do();
  });

  const internal = {};

  //生成附言号码
  internal.do = () => {
    util_postscriptGenerator.generate();
  };

  //项目启动时自动生成一次（以免遗漏）
  internal.do();

  next();
};

exports.register.attributes = {
  name: 'schedule postscriptGenerator',
  version: '1.0.0'
};
