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
  auth: 'jwt',
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
  auth: 'jwt',
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

/**
 * 解析文章（通过秀米）
 */
module.exports.parseFromXiumi = {
  auth: 'jwt',
  validate: {
    payload: {
      url: Joi.string().required()
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const Article = DB.getModel('article');
    // const session = request.auth.credentials;
    const payload= request.payload;

    util_xiumi.handel(payload.url).then(data => {
      return Article.findOrCreate({
        where: {sourceId: data.sourceId},
        defaults: data
      });
    }).then(data => {
      if (!data[1]) throw new Error('该文章已经导入过了');
      reply(data[0]);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};

/**
 * 修改
 */
module.exports.update = {
  auth: 'jwt',
  validate: {
    params: {
      id: Joi.string().required()
    },
    payload: {
      title: Joi.string().max(100).required(),
      summary: Joi.string().max(200),
      cover: Joi.string().max(200),
      content: Joi.string().required()
    },
    options: {
      allowUnknown: true
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const Article = DB.getModel('article');
    // const session = request.auth.credentials;
    const params = request.params;
    const payload = request.payload;

    const criteria = {id: params.id};

    const doc = {
      title: payload.title,
      summary: payload.summary,
      cover: payload.cover,
      content: payload.content
    };

    //查询用户
    Article.update(doc, {
      where: criteria
    }).then(data => {
      if (data[0] != 1) throw Boom.badRequest('文章不存在');
      return Article.findOne({
        where: criteria
      });
    }).then(data => {
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};
