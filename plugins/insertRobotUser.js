const schedule = require("node-schedule");
const moment = require('moment-timezone');
const _ = require('lodash');
const config = require('../config/config');
const util_userIdGenerator = require('../lib/userIdGenerator');
const util_number = require('../lib/number');

/**
 * 用户风险评级
 */
exports.register = (server, options, next) => {

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];

  const Master_register = DB.getModel('master_register');

  const users = require('../config/users.json');

  // const phone = '182666666';
  const phone = '182888888';

  // users.forEach((user, index) => {
  //   if (index >= 20) return;
  //   util_userIdGenerator.get().then(userId => {
  //     user.username = phone + util_number.fill(index, 2);
  //     user.activecode = userId+'CC';
  //     user.password = 'aaakkk';
  //     user.rmb_balance = 100000;
  //     user.avatar = `${process.env.PROTOCOL}://${process.env.DOMAIN}/${process.env.DIR_STATIC_IMG}/${user.avatar}`;
  //
  //     user.shibiepass = 0;
  //     user.lastdealdate = 0;
  //     user.howmanydeal = 0;
  //     user.frozedata = '';
  //
  //     Master_register.findOrCreate({
  //       where: {username: user.username},
  //       defaults: user
  //     }).catch(err => {
  //       console.log(err);
  //     });
  //   });
  // });

  next();
};

exports.register.attributes = {
  name: 'schedule insertRobotUser',
  version: '1.0.0'
};
