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
      page: Joi.number().integer().min(1)
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const Activity = DB.getModel('activity');
    // const session = request.auth.credentials;
    const query = request.query;
    const offset = (query.page ? query.page - 1 : 0 ) * pageSize;

    const criteria = {};

    Activity.findAndCountAll({
      attributes: ['id', 'url', 'title', 'cover'],
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
    const Activity = DB.getModel('activity');
    // const session = request.auth.credentials;
    const params = request.params;

    const criteria = {id: params.id};

    Activity.findOne({
      attributes: ['id', 'url', 'title', 'cover'],
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
 * 保存
 */
module.exports.save = {
  auth: 'jwt',
  validate: {
    payload: {
      url: Joi.string().max(100).required(),
      title: Joi.string().max(100).required(),
      cover: Joi.string().max(200).required()
    },
    options: {
      allowUnknown: true
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const Activity = DB.getModel('activity');
    // const session = request.auth.credentials;
    const payload = request.payload;

    const criteria = {url: payload.url};

    const doc = {
      url: payload.url,
      title: payload.title,
      cover: payload.cover
    };

    //保存
    Activity.findOrCreate({
      where: criteria,
      defaults: doc,
    }).then(data => {
      if (!data[1]) throw Boom.badRequest('已有相同链接的活动了');
      reply(data);
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
      url: Joi.string().max(100).required(),
      title: Joi.string().max(100).required(),
      cover: Joi.string().max(200).required()
    },
    options: {
      allowUnknown: true
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const Activity = DB.getModel('activity');
    // const session = request.auth.credentials;
    const params = request.params;
    const payload = request.payload;

    const criteria = {id: params.id};

    const doc = {
      url: payload.url,
      title: payload.title,
      cover: payload.cover
    };

    //查询用户
    Activity.update(doc, {
      where: criteria
    }).then(data => {
      if (data[0] != 1) throw Boom.badRequest('活动不存在');
      return Activity.findOne({
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
