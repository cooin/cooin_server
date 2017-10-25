'use strict';
const Joi = require('joi');
const Boom = require('boom');
const moment = require('moment-timezone');
const config = require('../../config/config');
const pageSize = parseInt(process.env.DB_PAGE_SIZE);

/**
 * 查询
 */
module.exports.query = {
  auth: 'jwt',
  validate: {
    query: {
      page: Joi.number().integer().min(1),
      status: Joi.number().integer().valid(0, 2, 3, 4, 5),
      createdAt: Joi.string()
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const Orderlist_bid = DB.getModel('orderlist_bid');
    // const session = request.auth.credentials;
    const query = request.query;
    const offset = (query.page ? query.page - 1 : 0 ) * pageSize;

    const criteria = {isRobot: 0};
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
    Orderlist_bid.findAndCountAll({
      attributes: config.attributes.orderlist_bid.list,
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
    const Orderlist_bid = DB.getModel('orderlist_bid');
    // const session = request.auth.credentials;
    const params = request.params;
    const query = request.query;
    const offset = (query.page ? query.page - 1 : 0 ) * pageSize;

    const criteria = {
      username: params.username,
      moneyfrom: {$ne: 't'}
    };
    Orderlist_bid.findAndCountAll({
      attributes: config.attributes.orderlist_bid.list,
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
 * 搜索--用户名、订单号
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
    const Orderlist_bid = DB.getModel('orderlist_bid');
    // const session = request.auth.credentials;
    const query = request.query;
    const offset = (query.page ? query.page - 1 : 0 ) * pageSize;

    const criteria = {
      $or: [
        {username: query.search},
        {orderid: query.search}
      ]
    };
    Orderlist_bid.findAndCountAll({
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
