/**
 * 每分钟清理过期时间前一小时的机器订单（每分钟的机器订单数量大致在120，清理的订单包含未撮合、撮合完成、部分撮合、撤销）
 * 每次删除1000条（历史数据量过大），不再递归删除历史数据（历史数据过大情况下会对现有交易业务产生巨大影响）
 *
 * 删除订单
 * 删除订单对应资金变动明细
 */

const schedule = require("node-schedule");
const moment = require('moment-timezone');

//订单过期时长（机器订单）
const ORDER_ROBOT_EXPIRE = Number(process.env.ORDER_ROBOT_EXPIRE);

exports.register = (server, options, next) => {

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];

  const Orderlist_bid = DB.getModel('orderlist_bid');
  const Fund_in_out = DB.getModel('fund_in_out');

  const rule = new schedule.RecurrenceRule();
  // rule.hour = 0;
  // rule.minute = 0;
  rule.second = 0;
  schedule.scheduleJob(rule, () => {
    internal.do();
  });

  const internal = {};

  internal.do = () => {
    /**
     * 查询订单（上限1000条）
     *
     * 机器订单 isRobot: 1
     * 过期时间 1时前
     */
    let criteria = {
      isRobot: 1,
      expiredAt: {$lt: new Date(Date.now() -  1 * 3600000)}
    };
    return Orderlist_bid.findAll({
      attributes: ['orderid'],
      where: criteria,
      limit: 1000
    }).then(data => {
      //没有数据
      if (data.length == 0) return Promise.resolve();

      //事务
      return Sequelize.transaction(t => {

        /**
         * 删除资金变动明细
         */
        let array_orderid = [];
        data.forEach(item => array_orderid.push(item.orderid));
        return Fund_in_out.destroy({
          where: {
            orderid: array_orderid
          },
          transaction: t
        }).then(() => {

          /**
           * 删除订单
           */
          return Orderlist_bid.destroy({
            where: criteria,
            limit: 1000,
            transaction: t
          });
        });
      }).then(() => {
        //事务结束
        return Promise.resolve();
      });

    });
  };

  next();
};

exports.register.attributes = {
  name: 'schedule scheduleDeleteRobotOrder',
  version: '1.0.0'
};
