'use strict';
const Joi = require('joi');
const Boom = require('boom');
const moment = require('moment-timezone');
const util_xiumi = require('../../lib/xiumi');
const pageSize = parseInt(process.env.DB_PAGE_SIZE);

/**
 * 查询
 */
module.exports.query = {
  // auth: 'jwt',
  validate: {
    query: {
      page: Joi.number().integer().min(1)
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const Article = DB.getModel('article');
    // const session = request.auth.credentials;
    const query = request.query;
    const offset = (query.page ? query.page - 1 : 0 ) * pageSize;

    const criteria = {};

    Article.findAndCountAll({
      attributes: ['id', 'sourceId', 'title', 'summary', 'cover', 'publishedAt'],
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
    const Article = DB.getModel('article');
    // const session = request.auth.credentials;
    const params = request.params;

    const criteria = {id: params.id};

    Article.findOne({
      // attributes: ['id', 'sourceId', 'title', 'summary', 'cover', 'publishedAt'],
      where: criteria,
    }).then(data => {
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};
