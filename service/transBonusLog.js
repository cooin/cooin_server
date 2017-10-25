const moment = require('moment-timezone');


/**
 * 累加
 *
 * 把获得交易奖金的金额按天累加
 *
 * @param server
 * @param amount
 * @returns {Promise.<*>}
 */
exports.add = (server, amount) => {

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];

  const TransBonusLog = DB.getModel('transBonusLog');

  if (isNaN(amount)) return Promise.reject('amount必须是数字');
  if (amount <= 0) return Promise.reject('amount必须大于0');

  const criteria = {
    date: moment().format('YYYYMMDD')
  };
  return TransBonusLog.findOrCreate({
    where: criteria,
    defaults: {amount}
  }).spread((data, created) => {
    if (created) return Promise.resolve(data);
    //累加
    return TransBonusLog.update({
      amount: Sequelize.literal(`cast(amount + ${amount} as decimal(11, 2))`)
    }, {
      where: criteria
    });
  }).then(() => {
    return TransBonusLog.findOne({
      where: criteria
    });
  }).then(data => {

    //推送交易奖金数据
    socketUtil.emit('transBonus', data.amount);
    return Promise.resolve(data);
  });

};
