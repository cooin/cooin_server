const moment = require('moment-timezone');

/**
 * 查询--附带用户
 *
 * @param server
 * @param doc
 * @returns {Promise.<T>}
 */
exports.queryAttachUser = (server, query) => {

  const self = this;

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];

  const Master_register = DB.getModel('master_register');
  const Bankaccount = DB.getModel('bankaccount');

  let data_bankaccount;
  let data_master_register;

  query.raw = true;

  return Bankaccount.findAndCountAll(query).then(data => {
    data_bankaccount = data;
    //查询用户
    let array_username = [];
    data_bankaccount.rows.forEach(item => array_username.push(item.username));
    return Master_register.findAndCountAll({
      attributes: ['username', 'realname'],
      where: {username: array_username}
    });
  }).then(data => {
    data_master_register = data;
    data_bankaccount.rows.forEach(bankaccount => {
      data_master_register.rows.forEach(master_register => {
        if (bankaccount.username == master_register.username) bankaccount.user = master_register;
      });
    });
    return Promise.resolve(data_bankaccount);
  });

};
