const moment = require('moment-timezone');
const client = require('../lib/redis').getClient();

/**
 * 竞赛钱包实时排名计算
 * @param server
 * @param options
 * @param next
 */
exports.register = (server, options, next) => {

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];

  const Borrowlist = DB.getModel('borrowlist');

  const internal = {};

  //实时总资产计算
  internal.do = () => {
    const criteria = {
      status: 2,
      borrowtype: 2,
      username: {$notLike: 'demo%'}
    };

    const sql_total = `cast(
      sum(
        (rmb_balance + rmb_balance_f) + 
        (btc_balance + btc_balance_f) * (select lastprice from realtimeprice where currencytype = 1) + 
        (bt2_balance + bt2_balance_f) * (select lastprice from realtimeprice where currencytype = 2)
      )
      as decimal(11, 2))`;

    Borrowlist.findAll({
      raw: true,
      attributes: [
        'username',
        'borrowid',
        [Sequelize.literal(sql_total), 'total']
      ],
      where: criteria,
      group: 'id',
      order: [
        [Sequelize.literal(sql_total), 'DESC']
      ]
    }).then(data => {
      //放入缓存
      client.setAsync('borrowlistRanking', JSON.stringify(data));
    })
  }

  internal.do();
  setInterval(internal.do, 2000);

  next();
};

exports.register.attributes = {
  name: 'borrowlistRanking',
  version: '1.0.0'
};
