const moment = require('moment-timezone');
const config = require('../config/config');
const util_IDGenerator = require('../lib/IDGenerator');
const util_codeGenerator = require('../lib/codeGenerator');
const util_number = require('../lib/number');


/**
 * 兑换（用户输入兑换码、返回中奖金额）
 *
 * 与用户登录状态无关
 * 兑换码和用户openid绑定来区别用户
 *
 * @param server
 * @param code
 * @param openid
 */
exports.exchange = (server, code, openid) => {

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];
  const ActivityCode = DB.getModel('activityCode');

  //查询用户是否兑换过
  return ActivityCode.count({
    where: {openid}
  }).then(count => {
    if (count) throw new Error('已经兑换过了');

    //查询code码是否正确
    return ActivityCode.findOne({
      where: {code}
    });
  }).then(data => {
    if (!data) throw new Error('非法兑换码');
    if (data.status != 0) throw new Error('兑换码已被使用');

    //兑换
    return ActivityCode.update({openid, status: 1}, {
      where: {code, status: 0}
    });
  }).then(data => {
    if (data[0] != 1) throw new Error('兑换失败');

    //查询
    return ActivityCode.findOne({where: {code}});
  });
}

/**
 * 兑换入账（对已兑换过的记录进行入账）
 *
 * @param server
 * @param username
 */
exports.exchangeAccount = (server, username) => {

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];
  const Master_register = DB.getModel('master_register');
  const ActivityCode = DB.getModel('activityCode');
  const Fund_in_out = DB.getModel('fund_in_out');

  let activityCode;
  let openid;
  let code;

  //查询用户openid
  return Master_register.findOne({where: {username}}).then(data => {
    if (!data) throw new Error('用户不存在');
    if (!data.openid) throw new Error('未绑定openid');
    openid = data.openid;

    //查询code码
    return ActivityCode.findOne({where: {openid}});
  }).then(data => {
    if (!data) throw new Error('用户未参与活动');
    if (data.status == 2) throw new Error('已入账成功');
    activityCode = data;
    code = data.code;

    //获取流水号
    return util_IDGenerator.get('fund_in_out', 0);
  }).then(transNumber => {

    const criteriaForCode = {code, status: 1};
    const criteriaForWallet = {username};

    const docForCode = {
      username,
      status: 2,
      receivedAt: new Date()
    };
    const docForWallet = {
      rmb_balance: Sequelize.literal(`cast(rmb_balance + ${activityCode.awardAmount} as decimal(12, 2))`)
    };

    const docForFund = {
      transNumber: transNumber,
      username: username,
      orderid: activityCode.id,
      fundmoneystatus: 'activity',
      curr_type: 0,
      addorminus: 'add',
      actiondate: moment().format('YYYYMMDD'),
      paymode: 'w',
      borrowid: 0,
      price: 0,
      quantity: 0,
      money: activityCode.awardAmount
    }

    //事务
    return Sequelize.transaction(t => {

      //兑换码
      return ActivityCode.update(docForCode, {
        where: criteriaForCode,
        transaction: t
      }).then(data => {
        if (data[0] != 1) throw new Error('入账失败');

        //钱包
        return Master_register.update(docForWallet, {
          where: criteriaForWallet,
          transaction: t
        });
      }).then(() => {

        //流水
        return Fund_in_out.create(docForFund, {transaction: t});
      });

    });

  }).then(() => {
    return ActivityCode.findOne({where: {openid}});
  });
}

/**
 * 抽奖（线上用户随机获取兑换码进行奖品兑换，兑换过则直接返回兑换数据）
 *
 * @param server
 * @param username
 */
exports.lottery = (server, openid) => {

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];
  const ActivityCode = DB.getModel('activityCode');

  let code;
  let awardAmount;

  //查询用户是否兑换过
  return ActivityCode.findOne({
    where: {openid}
  }).then(data => {
    //兑换过则直接返回兑换数据
    if (data) return data;

    //随机获取兑换码
    return util_codeGenerator.gets(1).then(data => {
      code = data[0];
      awardAmount = util_number.random(0.6, 3.6, 1);

      const doc = {code, awardAmount, type: 2};
      //保存
      return ActivityCode.create(doc);
    }).then(() => {

      //兑换
      return this.exchange(server, code, openid);
    });
  })
}

/**
 * 查询中奖记录
 *
 * @param server
 * @param username
 */
exports.query = (server, criteria, page, pageSize, order) => {

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];
  const ActivityCode = DB.getModel('activityCode');

  return ActivityCode.findAndCountAll({
    raw: true,
    attributes: ['username', 'awardAmount', 'createdAt'],
    where: criteria,
    order: order,
    offset: --page * pageSize,
    limit: pageSize
  });
}

