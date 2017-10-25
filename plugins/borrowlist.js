const moment = require('moment-timezone');
const service_borrowlist = require('../service/borrowlist');

exports.register = (server, options, next) => {

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];

  const Borrowlist = DB.getModel('borrowlist');

  //结算过期的赠金钱包（注册赠送、每周竞赛）
  function settlement() {

    logger.info('过期的赠金钱包查询');
    return Borrowlist.findAll({
      where: {
        borrowtype: [1, 2],
        returntime: {$lte: moment().format('YYYYMMDDHHmm')},
        status: 2
      }
    }).then(data => {
      let queueData = data;
      logger.info('过期的赠金钱包数量', queueData.length);

      if (queueData.length == 0) return Promise.resolve();

      let i = 0;
      function queue() {
        logger.info('结算赠金钱包--start', queueData[i].id);
        return service_borrowlist.settlement(server, queueData[i], 0).then(data => {
          logger.info('结算赠金钱包--end', queueData[i].id);
          if (queueData[++i]) return queue();
          return Promise.resolve();
        });
      }

      return queue();

      // queueData.forEach(item => {
      //   logger.info('结算赠金钱包--start', item.id);
      //   return service_borrowlist.settlement(server, item, 0).then(data => {
      //     logger.info('结算赠金钱包--end', item.id);
      //   }).catch(err => logger.error(err));
      // });

    });

  }

  //循环
  function execute() {

    settlement().then(() => {
      //循环
      setTimeout(execute, process.env.BORROWLIST_TIME);
    }).catch(err => {
      logger.info(err);
      //循环
      setTimeout(execute, process.env.BORROWLIST_TIME);
    });

  }

  execute();

  next();
};

exports.register.attributes = {
  name: 'borrowlist',
  version: '1.0.0'
};
