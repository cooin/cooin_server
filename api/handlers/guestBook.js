'use strict';
const Joi = require('joi');
const Boom = require('boom');
const moment = require('moment-timezone');
const config = require('../../config/config');
const pageSize = parseInt(process.env.DB_PAGE_SIZE);

/**
 * 保存（留言）
 */
module.exports.save = {
  auth: 'jwt',
  validate: {
    payload: {
      hostId: Joi.string().max(30).required(),
      message: Joi.string().max(500).required()
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const Master_register = DB.getModel('master_register');
    const GuestBook = DB.getModel('guestBook');
    const session = request.auth.credentials;
    const payload = request.payload;

    //查询被留言者
    Master_register.findOne({where: {id: payload.hostId}}).then(data => {
      if (!data) throw Boom.badRequest('被留言人不存在');
      //留言
      return GuestBook.create({
        username: data.username,
        guestUsername: session.username,
        message: payload.message
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
 * 回复（留言）
 */
module.exports.replayById = {
  auth: 'jwt',
  validate: {
    params: {
      id: Joi.string().max(30).required()
    },
    payload: {
      reply: Joi.string().max(500).required()
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const GuestBook = DB.getModel('guestBook');
    const session = request.auth.credentials;
    const params = request.params;
    const payload = request.payload;

    //查询留言
    GuestBook.findOne({
      where: {
        id: params.id,
        username: session.username
      }
    }).then(data => {
      if (!data) throw Boom.badRequest('权限不足');
      //回复
      return GuestBook.update({
        reply: payload.reply,
        repliedAt: new Date()
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
 * 查询--当前用户
 */
module.exports.queryForCurrentUser = {
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
    const GuestBook = DB.getModel('guestBook');
    const session = request.auth.credentials;
    const query = request.query;
    const offset = (query.page ? query.page - 1 : 0 ) * pageSize;

    const criteria = {username: session.username};
    GuestBook.findAndCountAll({
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
