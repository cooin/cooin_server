'use strict';
const Joi = require('joi');
const Boom = require('boom');
const moment = require('moment-timezone');
const config = require('../../config/config');
const service_topicReport = require('../../service/topicReport');
const pageSize = parseInt(process.env.DB_PAGE_SIZE);

/**
 * 标记为已处理
 */
module.exports.handled = {
  auth: 'jwt',
  validate: {
    params: {
      id: Joi.string().required()
    },
    options: {
      allowUnknown: true
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    // const session = request.auth.credentials;
    const params = request.params;


    service_topicReport.handled(request.server, params.id).then(data => {
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};

/**
 * 查询
 */
module.exports.query = {
  auth: 'jwt',
  validate: {
    query: {
      page: Joi.number().integer().min(1).default(1),
      status: Joi.number().integer().valid(0, 1)
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    // const session = request.auth.credentials;
    const query = request.query;

    const criteria = {};

    if (query.status) criteria.status = query.status;

    service_topicReport.queryAttachTopic(request.server, criteria, query.page, pageSize, [['id', 'DESC']]).then(data => {
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};
