'use strict';
const Joi = require('joi');
const Boom = require('boom');
const moment = require('moment-timezone');
const config = require('../../config/config');
const service_invest = require('../../service/autoInvest');
const service_master_register = require('../../service/master_register');
const util_IDGenerator = require('../../lib/IDGenerator');
const pageSize = parseInt(process.env.DB_PAGE_SIZE);

/**
 * 保存
 */
module.exports.save = {
  auth: 'jwt',
  validate: {
    payload: {
      coinType: Joi.string().required().valid('btc', 'ltc'),
      timeType: Joi.number().integer().valid(1, 2, 3).default(1),
      totalPeriod: Joi.number().integer().min(3).max(60).required(),
      perAmount: Joi.number().min(500).max(1000000).required()
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const Master_register = DB.getModel('master_register');
    const AutoInvest = DB.getModel('autoInvest');
    const session = request.auth.credentials;
    const payload = request.payload;

    //查询用户当天定投数量（用户每天定投数量上限为3笔）
    AutoInvest.count({
      where: {
        username: session.username,
        createdAt: {$gte: new Date(moment(moment().format('YYYYMMDD')))
      }}
    }).then(count => {
      if (count >= 3) throw new Error('今日定投数量已达到上限3笔');
      //获取ID
      return util_IDGenerator.get('autoInvest');
    }).then(id => {
      let doc = {
        autoInvestId: id,
        username: session.username,
        timeType: payload.timeType,
        coinType: payload.coinType,
        totalPeriod: payload.totalPeriod,
        perAmount: Number(Number(payload.perAmount).toFixed(2))
      };
      //每月
      if (payload.timeType == 1)  doc.withholdDate = moment().date() > 28 ? 28 : moment().date();
      //每周
      if (payload.timeType == 2)  doc.withholdDate = moment().day();
      //事务
      return Sequelize.transaction(t => {

        //冻结我的钱包第一期购买资金（确保第一期买入成功）
        return Master_register.update({
          rmb_balance: Sequelize.literal(`cast(rmb_balance - ${doc.perAmount} as decimal(11, 2))`),
          rmb_balance_f: Sequelize.literal(`cast(rmb_balance_f + ${doc.perAmount} as decimal(11, 2))`)
        }, {
          where: {
            username: doc.username,
            rmb_balance: {$gte: doc.perAmount}
          },
          transaction: t
        }).then(data => {
          //余额不足
          if (data[0] != 1) throw new Error('余额不足');

          //保存文档
          return AutoInvest.create(doc, {transaction: t})
        }).then(data => {
          doc = data;

          //修正withholdDate
          let withholdDate;
          //每月
          if (payload.timeType == 1)  withholdDate = moment(doc.createdAt).date() > 28 ? 28 : moment(doc.createdAt).date();
          //每周
          if (payload.timeType == 2)  withholdDate = moment(doc.createdAt).day();
          return AutoInvest.update({
            withholdDate: withholdDate
          }, {
            where: {id: doc.id},
            transaction: t
          });
        });
      }).then(data => {
        reply(doc);
        //定投
        service_invest.withhold(request.server, doc);
        //推送钱包金额变动消息
        service_master_register.pushAllWallet(request.server, null, session.username);
      });
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};

/**
 * 查询--当前用户
 */
module.exports.queryForCurrentUser = {
  auth: 'jwt',
  validate: {
    query: {
      page: Joi.number().integer().min(1),
      status: Joi.number().integer().min(0).max(3)
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const AutoInvest = DB.getModel('autoInvest');
    const session = request.auth.credentials;
    const query = request.query;
    const offset = (query.page ? query.page - 1 : 0 ) * pageSize;

    const criteria = {username: session.username};
    if (query.status) criteria.status = query.status;
    AutoInvest.findAll({
      where: criteria,
      order: [
        ['id', 'DESC']
      ],
      offset: offset,
      limit: pageSize
    }).then(data => {
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};

/**
 * 查询定投记录--当前用户
 */
module.exports.queryRecordForCurrentUser = {
  auth: 'jwt',
  validate: {
    params: {
      autoInvestId: Joi.string().max(30).required()
    },
    query: {
      page: Joi.number().integer().min(1)
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const AutoInvest = DB.getModel('autoInvest');
    const Orderlist_bid = DB.getModel('orderlist_bid');
    const session = request.auth.credentials;
    const params = request.params;
    const query = request.query;
    const offset = (query.page ? query.page - 1 : 0 ) * pageSize;

    //查询定投
    AutoInvest.findOne({
      where: {
        username: session.username,
        autoInvestId: params.autoInvestId
      }
    }).then(data => {
      if (!data) throw Boom.badRequest('权限不足');

      //查询定投记录
      return Orderlist_bid.findAll({
        attributes: config.attributes.orderlist_bid.list,
        where: {
          borrowid: params.autoInvestId,
          moneyfrom: 't'
        },
        order: [
          ['id', 'DESC']
        ],
        offset: offset,
        limit: pageSize
      });
    }).then(data => {
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};

/**
 * 查询--当前用户--聚合所有未赎回的定投钱包
 */
module.exports.queryCombineForCurrentUser = {
  auth: 'jwt',
  validate: {
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const AutoInvest = DB.getModel('autoInvest');
    const session = request.auth.credentials;

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
        username: session.username
      }
    }).then(data => {
      if (!data) data = {
        username: session.username,
        rmb_balance: 0,
        btc_balance: 0,
        bt2_balance: 0,
        bt3_balance: 0,
        rmb_balance_f: 0,
        btc_balance_f: 0,
        bt2_balance_f: 0,
        bt3_balance_f: 0,
      };
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};

/**
 * 结束（赎回）
 */
module.exports.finish = {
  auth: 'jwt',
  validate: {
    params: {
      autoInvestId: Joi.string().max(30).required()
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const AutoInvest = DB.getModel('autoInvest');
    const session = request.auth.credentials;
    const params = request.params;

    //查询定投
    AutoInvest.findOne({
      where: {
        username: session.username,
        autoInvestId: params.autoInvestId
      }
    }).then(data => {
      if (!data) throw Boom.badRequest('权限不足');

      //定投赎回24小时限制
      if (new Date(data.createdAt).getTime() + 24 * 3600000 > Date.now()) throw Boom.badRequest('定投后24小时可执行赎回');

      //结束定投
      return service_invest.finish(request.server, data);
    }).then(data => {
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};
