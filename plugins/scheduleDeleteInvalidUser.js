/**
 * 每日凌晨零点清理24小时前注册的没有登录过的用户
 */

const schedule = require("node-schedule");
const moment = require('moment-timezone');
const service_master_register = require('../service/master_register');

exports.register = (server, options, next) => {

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];

  const Master_register = DB.getModel('master_register');

  const rule = new schedule.RecurrenceRule();
  rule.hour = 0;
  rule.minute = 0;
  rule.second = 0;
  schedule.scheduleJob(rule, () => {
    internal.do();
  });

  const internal = {};

  internal.do = () => {
    //查询用户
    Master_register.findAll({
      where: {
        joindate: {$lt: moment(moment(Date.now() - 24 * 3600000).format('YYYYMMDD')).format('YYYYMMDDHHmm')},
        lastlogintime: null
      }
    }).then(data => {
      data.forEach(item => {
        service_master_register.deleteInvalid(server, item);
      });
    });
  };

  next();
};

exports.register.attributes = {
  name: 'schedule scheduleDeleteInvalidUser',
  version: '1.0.0'
};
