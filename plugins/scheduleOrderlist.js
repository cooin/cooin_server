/**
 * 每日凌晨零点清理48小时前充值处理失败的充值记录
 */

const schedule = require("node-schedule");
const moment = require('moment-timezone');
exports.register = (server, options, next) => {

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];

  const Orderlist = DB.getModel('orderlist');

  const rule = new schedule.RecurrenceRule();
  rule.hour = 0;
  rule.minute = 0;
  rule.second = 0;
  schedule.scheduleJob(rule, () => {
    internal.do();
  });

  const internal = {};

  internal.do = () => {
    Orderlist.update({
      fundinstatus: 'fail'
    }, {
      where: {
        fundinstatus: 'wait',
        orderdate: {$lt: moment(Date.now() - 48 * 3600000).format('YYYYMMDD')}
      }
    });
  };

  internal.do();

  next();
};

exports.register.attributes = {
  name: 'schedule orderlist',
  version: '1.0.0'
};
