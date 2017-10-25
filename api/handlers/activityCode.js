'use strict';
const Joi = require('joi');
const Boom = require('boom');
const moment = require('moment-timezone');
const service_activityCode = require('../../service/activityCode');
const util_string = require('../../lib/string');
const pageSize = parseInt(process.env.DB_PAGE_SIZE);

/**
 * 查询
 */
module.exports.query = {
  // auth: 'jwt',
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
    const ActivityCode = DB.getModel('activityCode');
    // const session = request.auth.credentials;
    const query = request.query;

    const criteria = {
      status: 2
    };

    service_activityCode.query(request.server, criteria, query.page, pageSize, [['id', 'DESC']]).then(data => {
      data.rows = data.rows.map(item => {
        item.username = util_string.hidePhoneNumber(item.username);
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
 * 兑换（用户输入兑换码、返回中奖金额）
 */
module.exports.exchange = {
  // auth: 'jwt',
  validate: {
    payload: {
      openid: Joi.string().required(),
      code: Joi.string().min(4).max(4).required()
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const ActivityCode = DB.getModel('activityCode');
    // const session = request.auth.credentials;
    const payload = request.payload;

    service_activityCode.exchange(request.server, payload.code, payload.openid).then(data => {
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};

/**
 * 兑换入账（对已兑换过的记录进行入账）
 */
module.exports.exchangeAccount = {
  auth: 'jwt',
  validate: {
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const ActivityCode = DB.getModel('activityCode');
    const session = request.auth.credentials;

    service_activityCode.exchangeAccount(request.server, session.username).then(data => {
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};

/**
 * 抽奖（线上用户随机获取兑换码进行奖品兑换，兑换过则直接返回兑换数据）
 */
module.exports.lottery = {
  // auth: 'jwt',
  validate: {
    payload: {
      openid: Joi.string().required()
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const ActivityCode = DB.getModel('activityCode');
    // const session = request.auth.credentials;
    const payload = request.payload;

    service_activityCode.lottery(request.server, payload.openid).then(data => {
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};
