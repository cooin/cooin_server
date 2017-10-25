'use strict';
const Joi = require('joi');
const Boom = require('boom');
const JWT = require('jsonwebtoken');
const moment = require('moment-timezone');
const config = require('../../config/config');
const pageSize = parseInt(process.env.DB_PAGE_SIZE);


/**
 * 查询--当前用户盈利率
 */
module.exports.queryForCurrentUser = {
  auth: 'jwt',
  validate: {
    query: {
      unit: Joi.string().valid('1month').default('1month'),
      startTime: Joi.date().required(),
      endTime: Joi.date().default(new Date()),
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const ProfitRate = DB.getModel('profitRate');
    const session = request.auth.credentials;
    const query = request.query;

    const criteria = {
      username: session.username,
      unit: query.unit,
      time: {$gte: new Date(query.startTime).getTime(), $lt: new Date(query.endTime).getTime()}
    };
    ProfitRate.findAll({
      attributes: config.attributes.profitRate.list,
      where: criteria,
      order: [['time', 'ASC']]
    }).then(data => {
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};

/**
 * 查询--指定用户盈利率
 */
module.exports.queryFollowForUser = {
  // auth: 'jwt',
  validate: {
    params: {
      userId: Joi.string().required().min(5).max(10),
    },
    query: {
      unit: Joi.string().valid('1month').default('1month'),
      startTime: Joi.date().required(),
      endTime: Joi.date().default(new Date()),
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const Master_register = DB.getModel('master_register');
    const ProfitRate = DB.getModel('profitRate');
    // const session = request.auth.credentials;
    const params = request.params;
    const query = request.query;

    Master_register.findOne({where: {activecode: params.userId}}).then(data => {
      if (!data) throw Boom.badRequest('用户不存在');
      const criteria = {
        username: data.username,
        unit: query.unit,
        time: {$gte: new Date(query.startTime).getTime(), $lt: new Date(query.endTime).getTime()}
      };
      return ProfitRate.findAll({
        attributes: config.attributes.profitRate.list,
        where: criteria,
        order: [['time', 'ASC']]
      });
    }).then(data => {
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};
