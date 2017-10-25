/**
 * 借款手续费每日结算
 *
 * 每日凌晨零点结算当天的手续费
 */

const schedule = require("node-schedule");
const moment = require('moment-timezone');
//下单机器人每次购买数量范围btc
const ORDER_ROBOT_QUANTITY_BTC = process.env.ORDER_ROBOT_QUANTITY_BTC.split(',');
//下单机器人每次购买数量范围ltc
const ORDER_ROBOT_QUANTITY_LTC = process.env.ORDER_ROBOT_QUANTITY_LTC.split(',');

exports.register = (server, options, next) => {

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];

  const Userborrow = DB.getModel('userborrow');

  const rule = new schedule.RecurrenceRule();
  rule.hour = 0;
  rule.minute = 0;
  rule.second = 0;
  schedule.scheduleJob(rule, () => {
    internal.do();
  });

  const internal = {};

  internal.do = () => {

    //人民币
    Userborrow.update({
      lastshouxufeiupdate: moment().format('YYYYMMDD'),
      totalshouxufei: Sequelize.literal(`cast(totalshouxufei + (totalborrow - alreadyreturn) * lilv as decimal(11, 2))`)
    }, {
      where: {
        status: 0,
        curr_type: 0,
        lastshouxufeiupdate: {$ne: moment().format('YYYYMMDD')}
      }
    });

    //btc
    Userborrow.update({
      lastshouxufeiupdate: moment().format('YYYYMMDD'),
      totalshouxufei: Sequelize.literal(`cast(totalshouxufei + (totalborrow - alreadyreturn) * lilv as decimal(11, ${ORDER_ROBOT_QUANTITY_BTC[2]}))`)
    }, {
      where: {
        status: 0,
        curr_type: 1,
        lastshouxufeiupdate: {$ne: moment().format('YYYYMMDD')}
      }
    });

    //ltc
    Userborrow.update({
      lastshouxufeiupdate: moment().format('YYYYMMDD'),
      totalshouxufei: Sequelize.literal(`cast(totalshouxufei + (totalborrow - alreadyreturn) * lilv as decimal(11, ${ORDER_ROBOT_QUANTITY_LTC[2]}))`)
    }, {
      where: {
        status: 0,
        curr_type: 2,
        lastshouxufeiupdate: {$ne: moment().format('YYYYMMDD')}
      }
    });

  };

  next();
};

exports.register.attributes = {
  name: 'schedule borrow',
  version: '1.0.0'
};
