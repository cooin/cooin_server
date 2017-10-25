const service_borrowlist = require('../service/borrowlist');

/**
 *
 * 修复赠金钱包结算错误的数据
 *
 * @param server
 * @param options
 * @param next
 */
exports.register = (server, options, next) => {

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];

  const Borrowlist = DB.getModel('borrowlist');

  const internal = {};

  internal.do = () => {
    Borrowlist.findAll({
      where: {
        status: [5, 4],
        rmb_balance: {$gt: 1000},
        totalreturn: {$lt: 1000}
      }
    }).then(data => {
      data.forEach(item => {
        service_borrowlist.settlement(server, item, 1);
      });
    });
  };

  // internal.do();

  next();
};

exports.register.attributes = {
  name: 'competionBorrowlistSettlement',
  version: '1.0.0'
};
