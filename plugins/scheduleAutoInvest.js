/**
 * 每日凌晨零点定投
 *
 * 每日早晨提示明天要扣款的定投
 */

const schedule = require("node-schedule");
const moment = require('moment-timezone');
const service_autoInvest = require('../service/autoInvest');

exports.register = (server, options, next) => {

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];

  const AutoInvest = DB.getModel('autoInvest');

  //扣款
  const rule = new schedule.RecurrenceRule();
  rule.hour = 0;
  rule.minute = 0;
  rule.second = 0;
  schedule.scheduleJob(rule, () => {
    internal.do();
  });

  //预扣款消息提示
  const ruleTip = new schedule.RecurrenceRule();
  ruleTip.hour = 8;
  ruleTip.minute = 0;
  ruleTip.second = 0;
  schedule.scheduleJob(ruleTip, () => {
    internal.tip();
  });

  const internal = {};

  //扣款
  internal.do = () => {
    /**
     * 查询定投周期为每月，扣款日期为当前date
     * 查询定投周期为每周，扣款日期为当前day
     * 查询定投周期为每天
     */
    AutoInvest.findAll({
      where: {
        status: 0,
        $or: [
          {timeType: 1, withholdDate: moment().date()},
          {timeType: 2, withholdDate: moment().day()},
          {timeType: 3}
        ]
      }
    }).then(data => {
      data.forEach(item => {
        service_autoInvest.withhold(server, item);
      });
    });
  };

  //预扣款消息提示
  internal.tip = () => {
    /**
     * 查询定投周期为每月，扣款日期为当前date后一天
     * 查询定投周期为每周，扣款日期为当前day后一天
     * 查询定投周期为每天
     */
    AutoInvest.findAll({
      where: {
        status: 0,
        $or: [
          {timeType: 1, withholdDate: moment(Date.now() + 24 * 3600000).date()},
          {timeType: 2, withholdDate: moment(Date.now() + 24 * 3600000).day()},
          {timeType: 3}
        ]
      }
    }).then(data => {
      data.forEach(item => {
        service_autoInvest.sendTemplateMsgForAutoInvestTip(server, item).catch(err => logger.error(err));
      });
    });
  }

  // internal.do();
  // internal.tip();

  next();
};

exports.register.attributes = {
  name: 'schedule autoInvest',
  version: '1.0.0'
};
