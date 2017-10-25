const moment = require('moment-timezone');
const config = require('../config/config');
const util_weChat = require('../lib/weChat');

/**
 * 汇款状态通知
 * @param server
 * @param applypayid 提现ID
 * @returns {*}
 */
exports.sendTemplateMsgForRemit = (server, applypayid) => {

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];

  const Master_register = DB.getModel('master_register');
  const Applywithdraw = DB.getModel('applywithdraw');
  const Bankaccount = DB.getModel('bankaccount');

  let applywithdraw, bankaccount, master_register;

  //查询提现订单
  return Applywithdraw.findOne({
    where: {
      applypayid: applypayid
    }
  }).then(data => {
    applywithdraw = data;

    //查询账户
    return Master_register.findOne({
      where: {username: applywithdraw.username}
    });
  }).then(data => {
    master_register = data;

    //用户未关注
    if (master_register.subscribe == 0) return Promise.reject(new Error('用户未关注'));
    //查询银行卡
    return Bankaccount.findOne({
      where: {id: applywithdraw.payinfo}
    });
  }).then(data => {
    bankaccount = data;

    //发送消息
    return util_weChat.sendTemplateMsgForRemit(
      config.weChat.bitekuang.name,
      master_register.openid,
      master_register.username,
      applywithdraw.shiji,
      applywithdraw.shouxu,
      applywithdraw.updatedAt,
      bankaccount.accountnumber
    );
  });
};
