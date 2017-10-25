'use strict';
const Joi = require('joi');
const Boom = require('boom');
const JWT = require('jsonwebtoken')
const moment = require('moment-timezone');
const encrypt = require('../../lib/encrypt');


/**
 * 登录
 */
module.exports.login = {
  // auth: 'jwt',
  validate: {
    payload: {
      username: Joi.string().min(2).max(20).required(),
      password: Joi.string().min(6).max(20).required()
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const Admin_user = DB.getModel('admin_user');
    // const session = request.auth.credentials;
    const payload = request.payload;

    Admin_user.findOne({
      where: {
        username: payload.username,
        password: encrypt.AHMD5(payload.password)
      }
    }).then(data => {
      if (!data) throw new Error('帐号或密码错误');

      let session = {
        type: 'admin',
        username: data.username,
        expire: Date.now() + 12 * 3600000 //12小时
      };
      let token = JWT.sign(session, process.env.JWT_SECRET);
      reply({
        user: data,
        token: token
      }).header("Authorization", token);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};

/**
 * 查询当前用户信息
 */
module.exports.queryForCurrentUser = {
  auth: 'jwt',
  validate: {
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const Admin_user = DB.getModel('admin_user');
    const session = request.auth.credentials;

    Admin_user.findOne({
      attributes: ['username'],
      where: {
        username: session.username
      }
    }).then(data => {
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};
