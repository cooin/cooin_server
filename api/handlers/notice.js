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
  // auth: 'jwt',
  validate: {
    query: {
      page: Joi.number().integer().min(1).default(1),
      size: Joi.number().integer().min(1).max(20).default(pageSize)
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const Notice = DB.getModel('notice');
    // const session = request.auth.credentials;
    const query = request.query;
    const offset = --query.page * query.size;

    const criteria = {status: 1};

    Notice.findAndCountAll({
      attributes: config.attributes.notice.list,
      where: criteria,
      order: [
        ['id', 'DESC']
      ],
      offset: offset,
      limit: pageSize
    }).then(data => {
      data.rows.map(item => {
        item.content = item.content.substring(0, 120);
        return item;
      });
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};

/**
 * 查询--根据ID
 */
module.exports.queryById = {
  // auth: 'jwt',
  validate: {
    params: {
      id: Joi.string().required()
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const Notice = DB.getModel('notice');
    // const session = request.auth.credentials;
    const params = request.params;

    const criteria = {id: params.id, status: 1};

    Notice.findOne({
      attributes: config.attributes.notice.detail,
      where: criteria
    }).then(data => {
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};

