'use strict';
const Joi = require('joi');
const Boom = require('boom');
const moment = require('moment-timezone');
const service_borrowlist = require('../../service/borrowlist');
const pageSize = parseInt(process.env.DB_PAGE_SIZE);

/**
 * 查询
 */
module.exports.query = {
  auth: 'jwt',
  validate: {
    query: {
      page: Joi.number().integer().min(1),
      order: Joi.string().valid('id', 'rmb_balance').default('id'),
      status: Joi.number().integer().valid(2, 4, 5, 6)
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const Borrowlist = DB.getModel('borrowlist');
    // const session = request.auth.credentials;
    const query = request.query;
    const order = query.order;
    const offset = (query.page ? query.page - 1 : 0 ) * pageSize;

    const criteria = {
      username: {$notLike: 'demo%'}
    };
    if (query.status != null) criteria.status = query.status;

    const sql_total = `cast(
      sum(
        (rmb_balance + rmb_balance_f) + 
        (btc_balance + btc_balance_f) * (select lastprice from realtimeprice where currencytype = 1) + 
        (bt2_balance + bt2_balance_f) * (select lastprice from realtimeprice where currencytype = 2)
      )
      as decimal(11, 2))`;

    Borrowlist.findAndCountAll({
      raw: true,
      attributes: [
        '*',
        [Sequelize.literal(sql_total), 'total']
      ],
      where: criteria,
      group: 'id',
      order: [
        [order == 'rmb_balance' ? Sequelize.literal(sql_total) : order, 'DESC']
      ],
      offset: offset,
      limit: pageSize
    }).then(data => {
      data.count = data.count.length;
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
    const Borrowlist = DB.getModel('borrowlist');
    // const session = request.auth.credentials;
    const params = request.params;
    const query = request.query;
    const offset = (query.page ? query.page - 1 : 0 ) * pageSize;

    const criteria = {
      username: params.username
    };
    Borrowlist.findAndCountAll({
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
    const Borrowlist = DB.getModel('borrowlist');
    // const session = request.auth.credentials;
    const query = request.query;
    const offset = (query.page ? query.page - 1 : 0 ) * pageSize;

    const criteria = {
      $or: [
        {username: query.search},
        {borrowid: query.search}
      ]
    };
    Borrowlist.findAndCountAll({
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
 * 结算
 */
module.exports.settlement = {
  auth: 'jwt',
  validate: {
    params: {
      borrowid: Joi.string().max(30).required()
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const Borrowlist = DB.getModel('borrowlist');
    // const session = request.auth.credentials;
    const params = request.params;

    Borrowlist.findOne({
      where: {
        borrowid: params.borrowid,
        status: 2
      }
    }).then(data => {
      if (!data) throw Boom.wrap(new Error('赠金钱包不存在'), 404);
      return service_borrowlist.settlement(request.server, data, 1);
    }).then(data => {
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};

/**
 * 赠金被取消
 */
module.exports.takeBackProfit = {
  auth: 'jwt',
  validate: {
    params: {
      borrowid: Joi.string().max(30).required()
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const Borrowlist = DB.getModel('borrowlist');
    // const session = request.auth.credentials;
    const params = request.params;

    Borrowlist.findOne({
      where: {
        borrowid: params.borrowid
      }
    }).then(data => {
      if (!data) throw Boom.wrap(new Error('赠金钱包不存在'), 404);
      return service_borrowlist.takeBachProfit(request.server, data);
    }).then(data => {
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};
