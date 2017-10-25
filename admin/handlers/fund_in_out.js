'use strict';
const Joi = require('joi');
const Boom = require('boom');
const moment = require('moment-timezone');
const pageSize = parseInt(process.env.DB_PAGE_SIZE);

/**
 * 查询
 */
module.exports.query = {
  auth: 'jwt',
  validate: {
    query: {
      page: Joi.number().integer().min(1),
      createdAt: Joi.string()
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const Fund_in_out = DB.getModel('fund_in_out');
    // const session = request.auth.credentials;
    const query = request.query;
    const offset = (query.page ? query.page - 1 : 0 ) * pageSize;

    const criteria = {username: {
      $notIn: ['Tom', 'Lucy', 'Jack']
    }};
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
    Fund_in_out.findAndCountAll({
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
    const Fund_in_out = DB.getModel('fund_in_out');
    // const session = request.auth.credentials;
    const params = request.params;
    const query = request.query;
    const offset = (query.page ? query.page - 1 : 0 ) * pageSize;

    const criteria = {
      username: params.username
    };
    Fund_in_out.findAndCountAll({
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
 * 聚合--用户--交易送奖金
 */
module.exports.aggregationByUsernameForBonus = {
  // auth: 'jwt',
  validate: {
    params: {
      username: Joi.string().required()
    },
    options: {
      allowUnknown: true
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const Fund_in_out = DB.getModel('fund_in_out');
    // const session = request.auth.credentials;
    const params = request.params;

    const criteria = {
      username: params.username,
      fundmoneystatus: 'feebonus'
    };
    Fund_in_out.findAll({
      attributes: [
        [Sequelize.literal('cast(sum(money) as decimal(11, 2))'), 'total'],
      ],
      group: 'fundmoneystatus',
      raw: true,
      where: criteria
    }).then(data => {
      reply(data[0]);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};

/**
 * 搜索--用户名，流水号
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
    const Fund_in_out = DB.getModel('fund_in_out');
    // const session = request.auth.credentials;
    const query = request.query;
    const offset = (query.page ? query.page - 1 : 0 ) * pageSize;

    const criteria = {
      $or: [
        {username: query.search},
        {transNumber: query.search}
      ]
    };
    Fund_in_out.findAndCountAll({
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
