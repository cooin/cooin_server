const schedule = require("node-schedule");
const moment = require('moment-timezone');
const _ = require('lodash');
const config = require('../config/config');

/**
 * 每日凌晨用户盈利率计算
 */
exports.register = (server, options, next) => {

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];

  const Master_register = DB.getModel('master_register');
  const Applywithdraw = DB.getModel('applywithdraw');
  const FollowInvest = DB.getModel('followInvest');
  const Orderlist_bid = DB.getModel('orderlist_bid');
  const AssetsLog = DB.getModel('assetsLog');
  const ProfitRate = DB.getModel('profitRate');

  const rule = new schedule.RecurrenceRule();
  // rule.hour = [0];
  // rule.minute = [59];
  schedule.scheduleJob(rule, () => {
    // internal.handel();
  });

  const internal = {};


  //计算每一个用户的市值
  internal.do = username => {

    return Promise.all([
      //我的钱包
      Master_register.findOne({
        raw: true,
        attributes: [
          [Sequelize.literal('sum(rmb_balance + rmb_balance_f)'), 'total']
        ],
        where: {username},
        group: 'username'
      }),
      //提现中
      Applywithdraw.findOne({
        raw: true,
        attributes: [
          [Sequelize.literal('sum(shiji)'), 'total']
        ],
        where: {username, pay: 0},
        group: 'username'
      }),
      //跟投
      FollowInvest.findOne({
        raw: true,
        attributes: [
          [Sequelize.literal('sum(rmb_balance + rmb_balance_f)'), 'total']
        ],
        where: {username, status: 0},
        group: 'username'
      }),
      //委托
      Orderlist_bid.findAll({
        raw: true,
        attributes: [
          [Sequelize.literal('sum(nowquantity) * (select realtimeprice.`lastprice` from realtimeprice where realtimeprice.source = orderlist_bid.`tradePlatform` and realtimeprice.`currencytype` = orderlist_bid.`curr_type`)'), 'total']
        ],
        where: {username, status: [2, 5], bors: 'b'},
        group: 'username, tradePlatform, curr_type'
      })
    ]).then(datas => {
      let total = 0;
      total += datas[0] ? datas[0].total : 0;
      total += datas[1] ? datas[1].total : 0;
      total += datas[2] ? datas[2].total : 0;
      datas[3].forEach(item => {
        total += item.total;
      });
      total = Number(total.toFixed(2));
      let model;
      const criteria = {username, time: new Date(moment(moment().format('YYYY-MM-DD'))).getTime()};
      const doc = {
        username,
        total,
        time: new Date(moment(moment().format('YYYY-MM-DD'))).getTime()
      };
      return AssetsLog.findOrCreate({
        where: criteria,
        defaults: doc
      }).then(data => {
        model = data[0];
        if (data[1]) return Promise.resolve();
        return model.update(doc);
      }).then(() => {
        //查询昨天的数据
        return AssetsLog.findOne({
          raw: true,
          where: {
            username,
            id: {$lt: model.get().id}
          },
          order: [['id', 'DESC']]
        });
      }).then(data => {
        if (!data) return Promise.resolve();
        const rate = Number(((doc.total - data.total) / data.total).toFixed(6));
        return model.update({rate});
      }).then(data => {

        //月赢利
        const startTime = new Date(moment(moment().format('YYYY-MM')));

        const criteria = {
          username,
          time: startTime.getTime(),
          unit: '1month'
        };

        const doc = {
          username,
          time: startTime.getTime(),
          unit: '1month'
        };

        return AssetsLog.findAll({where: {username, createdAt: {$gte: startTime}}}).then(data => {
          let profitRate = 1;
          data.forEach(item => {
            profitRate *= (1 + item.rate);
          });
          profitRate = Number((profitRate - 1).toFixed(2));
          doc.rate = profitRate;
          return ProfitRate.findOrCreate({
            where: criteria,
            defaults: doc
          });
        }).then(data => {
          if (data[1]) return Promise.resolve();
          return ProfitRate.update(doc, {where: criteria});
        });

      });
    });
  }

  internal.handel = () => {
    return Master_register.findAll({
      attributes: ['username'],
    }).then(data => {
      if (data.length == 0) return Promise.resolve();

      let counter = 0;
      const queue = () => {
        return internal.do(data[counter].username).then(() => {
          if (data[++counter]) return queue();
          return Promise.resolve();
        });
      }
      return queue();
    });
  }

  next();
};

exports.register.attributes = {
  name: 'schedule assets log',
  version: '1.0.0'
};
