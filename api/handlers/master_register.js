'use strict';
const Joi = require('joi');
const Boom = require('boom');
const JWT = require('jsonwebtoken');
const _ = require('lodash');
const config = require('../../config/config');
const service_orderlist_bid = require('../../service/orderlist_bid');
const service_followInvest = require('../../service/followInvest');

/**
 * 查询当前用户的钱包数据
 */
module.exports.queryForCurrentUser = {
  auth: 'jwt',
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const master_registerModel = DB.getModel('master_register');
    const session = request.auth.credentials;

    master_registerModel.findOne({
      attributes: config.attributes.master_register.detail,
      where: {username: session.username}
    }).then(data => {
      if (!data) throw Boom.wrap(new Error('NOT FOUND'), 404);
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      return reply(err)
    });

  }
};

/**
 * 查询当前用户的钱包数据
 */
module.exports.queryForUser = {
  // auth: 'jwt',
  validate: {
    params: {
      userId: Joi.string().required().min(5).max(10),
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const master_registerModel = DB.getModel('master_register');
    // const session = request.auth.credentials;
    const params = request.params;

    const session = request.headers.authorization ? JWT.decode(request.headers.authorization, process.env.JWT_SECRET) : null;
    const sql_isFollow = session ? `(select count(follow.id) from follow where follow.followUserId = master_register.activecode and follow.username = '${session.username}')` : `(0)`;

    master_registerModel.findOne({
      attributes: config.attributes.master_register.public.concat([
        [Sequelize.literal(sql_isFollow), 'isFollow']
      ]),
      where: {activecode: params.userId}
    }).then(data => {
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      return reply(err)
    });

  }
};

/**
 * 更新个人信息
 */
module.exports.updateProfit = {
  auth: 'jwt',
  validate: {
    payload: {
      nickname: Joi.string().max(30),
      email: Joi.string().email().max(60),
      intro: Joi.string().max(1000),
      avatar: Joi.string().max(200)
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const Master_register = DB.getModel('master_register');
    const session = request.auth.credentials;
    const payload = request.payload;

    const criteria = {};

    if (/_e$/.test(session.username)) {
      criteria.username = [session.username, session.username.replace(/_e/, '')];
    } else {
      criteria.username = [session.username, session.username + '_e'];
    }

    const doc = {};

    if (payload.nickname) doc.nickname = payload.nickname;
    if (payload.email) doc.email = payload.email;
    if (payload.intro) doc.intro = payload.intro;
    if (payload.avatar) doc.avatar = payload.avatar;

    Promise.resolve().then(() => {
      //如果修改nickname，则先查询改nickname是否被用过
      if (payload.nickname) return Master_register.findOne({where: {nickname: payload.nickname}});
      return Promise.resolve(0);
    }).then(data => {
      if (data && data.username != session.username) throw new Error('该昵称已被用过啦！');
      return Master_register.update(doc, {where: criteria});
    }).then(() => {
      return Master_register.findOne({
        attributes: config.attributes.master_register.detail,
        where: {username: session.username}
      });
    }).then(data => {
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      return reply(err)
    });

  }
};

/**
 * 查询当前用户的资产
 */
module.exports.queryAssetForCurrentUser = {
  auth: 'jwt',
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const master_registerModel = DB.getModel('master_register');
    const session = request.auth.credentials;

    Promise.all([
      master_registerModel.findOne({
        attributes: config.attributes.master_register.detail,
        where: {username: session.username}
      }),
      service_orderlist_bid.queryHoldCount(request.server, session.username),
      service_followInvest.queryInvestAmount(request.server, session.username)
    ]).then(datas => {
      reply({
        rmb_balance: datas[0].rmb_balance,
        rmb_balance_f: datas[0].rmb_balance_f,
        coins: datas[1],
        investAmount: datas[2],
      });
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      return reply(err)
    });

  }
};
