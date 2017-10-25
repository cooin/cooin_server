const moment = require('moment-timezone');
const client = require('../lib/redis').getClient();


/**
 * 删除无效用户
 *
 * 赠金钱包
 * 资金流水变动
 * 用户
 *
 * @param server
 * @param username
 * @returns {Promise.<T>}
 */
exports.deleteInvalid = (server, username) => {

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];

  const Master_register = DB.getModel('master_register');
  const Borrowlist = DB.getModel('borrowlist');
  const Fund_in_out = DB.getModel('fund_in_out');

  //查询用户（没有登录过）（防止误删）
  return Master_register.findOne({
    where: {
      username,
      lastlogintime: null
    }
  }).then(data => {
    if (!data) throw new Error('用户不存在或该用户合法');

    //事务
    return Sequelize.transaction(t => {

      //删除赠金钱包
      return Borrowlist.destroy({
        where: {username},
        transaction: t
      }).then(() => {

        //删除资金流水变动
        return Fund_in_out.destroy({
          where: {username},
          transaction: t
        });
      }).then(() => {

        //删除用户
        return Master_register.destroy({
          where: {username},
          transaction: t
        });
      });
    }).then(data => {

      //删除成功
      return Promise.resolve();
    });
  });
};

/**
 * 推送用户所有钱包的数据
 *
 * 我的钱包
 * 赠金钱包
 * 定投钱包
 *
 * @param server
 * @param username
 * @returns {Promise.<T>}
 */
exports.pushAllWallet = (server, borrowid, username) => {

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];

  const Master_register = DB.getModel('master_register');
  const Borrowlist = DB.getModel('borrowlist');
  const AutoInvest = DB.getModel('autoInvest');


  //查询我的钱包、赠金额钱包、定投钱包
  return Promise.all([
    //我的钱包
    Master_register.findOne({
      attributes: ['rmb_balance', 'btc_balance', 'bt2_balance', 'bt3_balance', 'rmb_balance_f', 'btc_balance_f', 'bt2_balance_f', 'bt3_balance_f'],
      where: {username: username}
    }),
    //赠金钱包
    Borrowlist.findOne({
      // attributes: ['rmb_balance', 'btc_balance', 'bt2_balance', 'rmb_balance_f', 'btc_balance_f', 'bt2_balance_f', 'borrowid', 'id'],
      where: {username: username, borrowid: borrowid, status: 2}
    }),
    //定投钱包
    AutoInvest.findOne({
      attributes: [
        'username',
        [Sequelize.fn('SUM', Sequelize.col('rmb_balance')), 'rmb_balance'],
        [Sequelize.fn('SUM', Sequelize.col('btc_balance')), 'btc_balance'],
        [Sequelize.fn('SUM', Sequelize.col('bt2_balance')), 'bt2_balance'],
        [Sequelize.fn('SUM', Sequelize.col('bt3_balance')), 'bt3_balance'],
        [Sequelize.fn('SUM', Sequelize.col('rmb_balance_f')), 'rmb_balance_f'],
        [Sequelize.fn('SUM', Sequelize.col('btc_balance_f')), 'btc_balance_f'],
        [Sequelize.fn('SUM', Sequelize.col('bt2_balance_f')), 'bt2_balance_f'],
        [Sequelize.fn('SUM', Sequelize.col('bt3_balance_f')), 'bt3_balance_f']
      ],
      group: 'username',
      raw: true,
      where: {
        username: username
      }
    })
  ]).then(datas => {
    return socketUtil.send(username, 'wallet', datas);
  });
};

/**
 * 设置用户交易过的交易所和货币
 * @param server
 * @param username
 * @param exchange
 * @param coin
 */
exports.setTradedExchangesAndTradedCoins = (server, username, exchange, coin) => {

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];
  const Master_register = DB.getModel('master_register');

  return Master_register.findOne({
    raw: true,
    where: {username}
  }).then(data => {
    if (!data) throw new Error('用户不存在');

    const exchanges = data.tradedExchanges ? data.tradedExchanges.split(',') : [];
    const coins = data.tradedCoins ? data.tradedCoins.split(',') : [];

    let flag_exchange = true;
    let flag_coin = true;
    exchanges.forEach(item => {
      if (item == exchange) flag_exchange = false;
    });
    coins.forEach(item => {
      if (item == coin) flag_coin = false;
    });
    if (flag_exchange) exchanges.push(exchange);
    if (flag_coin) coins.push(coin);

    return Master_register.update({
      tradedExchanges: exchanges.toString(),
      tradedCoins: coins.toString()
    }, {
      where: {username}
    });
  }).then(() => {
    return Master_register.findOne({where: {username}});
  });
}

/**
 * 设置用户禁言时间
 * @param username
 * @param silentAt 禁言结束时间（时间戳）
 */
exports.setSilentAt = (username, silentAt) => {
  const key = 'silent_' + username;

  if (isNaN(silentAt)) throw new Error('silentAt类型错误');
  const seconds = (silentAt - Date.now()) / 1000;
  return client.multi().set(key).expire(key, seconds).execAsync();
}

/**
 * 获取用户禁言时间
 * @param username
 * @returns {*}
 */
exports.getSilentAt = username => {
  const key = 'silent_' + username;
  return client.getAsync(key);
}
