'use strict';
const Joi = require('joi');
const Boom = require('boom');
const moment = require('moment-timezone');
const service_autoInvest = require('../../service/autoInvest');
const pageSize = parseInt(process.env.DB_PAGE_SIZE);

/**
 * 查询
 */
module.exports.query = {
  auth: 'jwt',
  validate: {
    query: {
      page: Joi.number().integer().min(1),
      status: Joi.number().integer().valid(0, 1, 2),
      createdAt: Joi.string()
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const AutoInvest = DB.getModel('autoInvest');
    // const session = request.auth.credentials;
    const query = request.query;
    const offset = (query.page ? query.page - 1 : 0 ) * pageSize;

    const criteria = {};
    if (query.status != null) criteria.status = query.status;
    if (query.createdAt != null) {
      //结束时间（指定日期第二天零点）
      let endTime = new Date(moment(new Date(moment(query.createdAt)).getTime() + 24 * 3600000).format('YYYY-MM-DD'));
      //开始时间（指定日期零点）
      let startTime = new Date(moment(query.createdAt).format('YYYY-MM-DD'));
      criteria.createdAt = {
        $gte: startTime,
        $lt: endTime
      };
    }
    AutoInvest.findAndCountAll({
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
 * 查询--用户名
 */
module.exports.queryByUsername = {
  auth: 'jwt',
  validate: {
    params: {
      username: Joi.string().required()
    },
    query: {
      page: Joi.number().integer().min(1),
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const AutoInvest = DB.getModel('autoInvest');
    // const session = request.auth.credentials;
    const params = request.params;
    const query = request.query;
    const offset = (query.page ? query.page - 1 : 0 ) * pageSize;

    const criteria = {
      username: params.username
    };
    AutoInvest.findAndCountAll({
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
 * 查询--用户名--聚合所有未赎回的定投钱包
 */
module.exports.queryCombineByUsername = {
  auth: 'jwt',
  validate: {
    params: {
      username: Joi.string().required()
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const AutoInvest = DB.getModel('autoInvest');
    // const session = request.auth.credentials;
    const params = request.params;
    const criteria = {
      username: params.username
    };

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
      where: criteria
    }).then(data => {
      if (!data) data = {
        username: params.username,
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
 * 搜索--用户名、定投号
 */
module.exports.search = {
  auth: 'jwt',
  validate: {
    query: {
      page: Joi.number().integer().min(1),
      search: Joi.string().required().max(50)
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const AutoInvest = DB.getModel('autoInvest');
    // const session = request.auth.credentials;
    const query = request.query;
    const offset = (query.page ? query.page - 1 : 0 ) * pageSize;

    const criteria = {
      $or: [
        {username: query.search},
        {autoInvestId: query.search}
      ]
    };
    AutoInvest.findAndCountAll({
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
