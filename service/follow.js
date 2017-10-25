const moment = require('moment-timezone');
const config = require('../config/config');

/**
 * 关注
 * @param server
 * @param username
 * @param followUserId
 */
exports.save = (server, username, followUserId) => {

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];
  const Master_register = DB.getModel('master_register');
  const Follow = DB.getModel('follow');


  let modelForFollow;

  //文档
  let doc;
  //关注着文档
  let docForUser;
  //被关注者文档
  let docForFollow;

  //查询被关注者
  return Master_register.findOne({where: {activecode: followUserId}}).then(data => {
    if (!data) throw new Error('您关注的人不存在');
    if (data.username == username) throw new Error('不能关注自己');

    modelForFollow = data;

    //查询是否关注过
    return Follow.count({where: {username, followUserId}});
  }).then(data => {
    if (data > 0) throw new Error('已经关注过啦');

    doc = {username, followUserId};

    docForUser = {
      followCount: Sequelize.literal(`cast(followCount + 1 as decimal(11))`)
    };

    docForFollow = {
      fansCount: Sequelize.literal(`cast(fansCount + 1 as decimal(11))`)
    };

    return Sequelize.transaction(t => {

      return Follow.create(doc, {transaction: t}).then(data => {
        doc = data;
        return Master_register.update(docForUser, {
          where: {username},
          transaction: t
        });
      }).then(data => {
        return Master_register.update(docForFollow, {
          where: {activecode: followUserId},
          transaction: t
        });
      });
    });

  }).then(() => {
    return Promise.resolve(doc);
  });
};

/**
 * 取消关注
 * @param server
 * @param username
 * @param followUserId
 */
exports.cancel = (server, username, followUserId) => {

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];
  const Master_register = DB.getModel('master_register');
  const Follow = DB.getModel('follow');


  let modelForFollow;

  //文档
  let doc;
  //关注着文档
  let docForUser;
  //被关注者文档
  let docForFollow;

  //查询被关注者
  return Master_register.findOne({where: {activecode: followUserId}}).then(data => {
    if (!data) throw new Error('您取消关注的人不存在');

    modelForFollow = data;

    //查询是否关注过
    return Follow.count({where: {username, followUserId}});
  }).then(data => {
    if (data == 0) throw new Error('您还没有关注过哟');

    doc = {username, followUserId};

    docForUser = {
      followCount: Sequelize.literal(`cast(followCount - 1 as decimal(11))`)
    };

    docForFollow = {
      fansCount: Sequelize.literal(`cast(fansCount - 1 as decimal(11))`)
    };

    return Sequelize.transaction(t => {

      return Follow.destroy({
        where: {username, followUserId},
        transaction: t
      }).then(data => {
        return Master_register.update(docForUser, {
          where: {username},
          transaction: t
        });
      }).then(data => {
        return Master_register.update(docForFollow, {
          where: {activecode: followUserId},
          transaction: t
        });
      });
    });

  }).then(() => {
    return Promise.resolve();
  });
};

/**
 * 是否关注
 * @param server
 * @param username
 * @param followUserId
 */
exports.isFollow = (server, username, followUserId) => {

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];
  const Follow = DB.getModel('follow');

  //查询是否关注过
  return Follow.count({where: {username, followUserId}}).then(data => {
    return Promise.resolve(data ? true : false);
  });
};

/**
 * 查询--附带被关注者
 *
 * @param server
 * @param doc
 * @returns {Promise.<T>}
 */
exports.queryAttachFollow = (server, criteria, page, pageSize, order) => {

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];
  const Follow = DB.getModel('follow');

  const sql_nickname = `(select master_register.nickname from master_register where master_register.activecode = follow.followUserId)`;
  const sql_avatar = `(select master_register.avatar from master_register where master_register.activecode = follow.followUserId)`;
  const sql_fansInvestCount = `(select master_register.fansInvestCount from master_register where master_register.activecode = follow.followUserId)`;
  const sql_riskIndex = `(select master_register.riskIndex from master_register where master_register.activecode = follow.followUserId)`;
  const sql_role = `(select master_register.role from master_register where master_register.activecode = follow.followUserId)`;
  const sql_profitRateFor1Week = `(select master_register.profitRateFor1Week from master_register where master_register.activecode = follow.followUserId)`;
  const sql_profitRateFor1Month = `(select master_register.profitRateFor1Month from master_register where master_register.activecode = follow.followUserId)`;
  const sql_profitRateFor3Month = `(select master_register.profitRateFor3Month from master_register where master_register.activecode = follow.followUserId)`;
  const sql_profitRateFor6Month = `(select master_register.profitRateFor6Month from master_register where master_register.activecode = follow.followUserId)`;
  const sql_profitRateFor1Year = `(select master_register.profitRateFor1Year from master_register where master_register.activecode = follow.followUserId)`;

  return Follow.findAndCountAll({
    raw: true,
    attributes: config.attributes.follow.list.concat([
      [Sequelize.literal(sql_nickname), 'nickname'],
      [Sequelize.literal(sql_avatar), 'avatar'],
      [Sequelize.literal(sql_fansInvestCount), 'fansInvestCount'],
      [Sequelize.literal(sql_riskIndex), 'riskIndex'],
      [Sequelize.literal(sql_role), 'role'],
      [Sequelize.literal(sql_profitRateFor1Week), 'profitRateFor1Week'],
      [Sequelize.literal(sql_profitRateFor1Month), 'profitRateFor1Month'],
      [Sequelize.literal(sql_profitRateFor3Month), 'profitRateFor3Month'],
      [Sequelize.literal(sql_profitRateFor6Month), 'profitRateFor6Month'],
      [Sequelize.literal(sql_profitRateFor1Year), 'profitRateFor1Year']
    ]),
    where: criteria,
    order: order,
    offset: --page * pageSize,
    limit: pageSize
  });
};

/**
 * 查询--附带粉丝
 *
 * @param server
 * @param doc
 * @returns {Promise.<T>}
 */
exports.queryAttachFans = (server, criteria, page, pageSize, order) => {

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];
  const Follow = DB.getModel('follow');

  const sql_fansUserId = `(select master_register.activecode from master_register where master_register.username = follow.username)`;
  const sql_nickname = `(select master_register.nickname from master_register where master_register.username = follow.username)`;
  const sql_avatar = `(select master_register.avatar from master_register where master_register.username = follow.username)`;
  const sql_fansInvestCount = `(select master_register.fansInvestCount from master_register where master_register.username = follow.username)`;
  const sql_riskIndex = `(select master_register.riskIndex from master_register where master_register.username = follow.username)`;
  const sql_role = `(select master_register.role from master_register where master_register.username = follow.username)`;
  const sql_profitRateFor1Week = `(select master_register.profitRateFor1Week from master_register where master_register.username = follow.username)`;
  const sql_profitRateFor1Month = `(select master_register.profitRateFor1Month from master_register where master_register.username = follow.username)`;
  const sql_profitRateFor3Month = `(select master_register.profitRateFor3Month from master_register where master_register.username = follow.username)`;
  const sql_profitRateFor6Month = `(select master_register.profitRateFor6Month from master_register where master_register.username = follow.username)`;
  const sql_profitRateFor1Year = `(select master_register.profitRateFor1Year from master_register where master_register.username = follow.username)`;

  return Follow.findAndCountAll({
    raw: true,
    attributes: config.attributes.follow.list.concat([
      [Sequelize.literal(sql_fansUserId), 'fansUserId'],
      [Sequelize.literal(sql_nickname), 'nickname'],
      [Sequelize.literal(sql_avatar), 'avatar'],
      [Sequelize.literal(sql_fansInvestCount), 'fansInvestCount'],
      [Sequelize.literal(sql_riskIndex), 'riskIndex'],
      [Sequelize.literal(sql_role), 'role'],
      [Sequelize.literal(sql_profitRateFor1Week), 'profitRateFor1Week'],
      [Sequelize.literal(sql_profitRateFor1Month), 'profitRateFor1Month'],
      [Sequelize.literal(sql_profitRateFor3Month), 'profitRateFor3Month'],
      [Sequelize.literal(sql_profitRateFor6Month), 'profitRateFor6Month'],
      [Sequelize.literal(sql_profitRateFor1Year), 'profitRateFor1Year']
    ]),
    where: criteria,
    order: order,
    offset: --page * pageSize,
    limit: pageSize
  });
};
