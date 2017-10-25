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
    const TopicTag = DB.getModel('topicTag');
    // const session = request.auth.credentials;
    const query = request.query;
    const offset = --query.page * query.size;

    const criteria = {status: 1};

    TopicTag.findAndCountAll({
      attributes: config.attributes.topicTag.publicList,
      where: criteria,
      order: [
        ['heat', 'DESC'],
        ['id', 'DESC']
      ],
      offset: offset,
      limit: query.size
    }).then(data => {
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};

/**
 * 查询全部
 */
module.exports.queryAll = {
  // auth: 'jwt',
  validate: {
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const TopicTag = DB.getModel('topicTag');
    // const session = request.auth.credentials;

    const criteria = {status: 1};

    TopicTag.findAll({
      attributes: config.attributes.topicTag.publicList,
      where: criteria,
      order: [
        ['heat', 'DESC'],
        ['id', 'DESC']
      ],
    }).then(data => {
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};

/**
 * 查询--根据tag
 */
module.exports.queryByTag = {
  // auth: 'jwt',
  validate: {
    params: {
      tag: Joi.string().required()
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const TopicTag = DB.getModel('topicTag');
    // const session = request.auth.credentials;
    const params = request.params;

    const criteria = {tag: params.tag, status: 1};

    TopicTag.findOne({
      attributes: config.attributes.topicTag.detail,
      where: criteria
    }).then(data => {
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};

