'use strict';
const Joi = require('joi');
const Boom = require('boom');
const moment = require('moment-timezone');
const config = require('../../config/config');
const pageSize = parseInt(process.env.DB_PAGE_SIZE);

/**
 * 保存
 */
module.exports.save = {
  auth: 'jwt',
  validate: {
    payload: {
      title: Joi.string().max(100).required(),
      content: Joi.string().max(10000).required()
    },
    options: {
      allowUnknown: true
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const Notice = DB.getModel('notice');
    // const session = request.auth.credentials;
    const payload = request.payload;

    const doc = {
      title: payload.title,
      content: payload.content,
      status: 0
    };

    //保存
    Notice.create(doc).then(data => {
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
      title: Joi.string().max(100).required(),
      content: Joi.string().max(10000).required()
    },
    options: {
      allowUnknown: true
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const Notice = DB.getModel('notice');
    // const session = request.auth.credentials;
    const params = request.params;
    const payload = request.payload;

    const criteria = {id: params.id};

    const doc = {
      title: payload.title,
      content: payload.content,
    };
    //更新
    Notice.update(doc, {
      where: criteria
    }).then(data => {
      if (data[0] != 1) throw Boom.badRequest('公告不存在');
      return Notice.findOne({
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

/**
 * 发布
 */
module.exports.publish = {
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
    const Notice = DB.getModel('notice');
    // const session = request.auth.credentials;
    const params = request.params;

    const criteria = {id: params.id, status: [0, 2]};

    const doc = {
      status: 1,
      publishedAt: new Date()
    };
    //更新
    Notice.update(doc, {
      where: criteria
    }).then(data => {
      if (data[0] != 1) throw Boom.badRequest('发布失败');
      return Notice.findOne({
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

/**
 * 下架
 */
module.exports.unPublish = {
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
    const Notice = DB.getModel('notice');
    // const session = request.auth.credentials;
    const params = request.params;

    const criteria = {id: params.id, status: 1};

    const doc = {
      status: 2
    };
    //更新
    Notice.update(doc, {
      where: criteria
    }).then(data => {
      if (data[0] != 1) throw Boom.badRequest('取消发布失败');
      return Notice.findOne({
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

/**
 * 查询
 */
module.exports.query = {
  auth: 'jwt',
  validate: {
    query: {
      page: Joi.number().integer().min(1).default(1)
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
    const offset = --query.page * pageSize;

    const criteria = {};

    Notice.findAndCountAll({
      attributes: config.attributes.notice.list,
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
    const Notice = DB.getModel('notice');
    // const session = request.auth.credentials;
    const params = request.params;

    const criteria = {id: params.id};

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

