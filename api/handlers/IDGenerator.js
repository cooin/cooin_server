'use strict';
const Joi = require('joi');
const Boom = require('boom');
const util_IDGenerator = require('../../lib/IDGenerator');

/**
 * 获取cookie
 */
module.exports.get = {
  validate: {
    query: {
      type: Joi.string().required().valid('userborrow', 'orderlist_bid', 'autoInvest', 'fund_in_out', 'orderlist', 'applywithdraw', 'borrowlist', 'question'),
      code: Joi.number().integer().required().valid(0, 1, 2)
    },
    options: {
      allowUnknown: true
    }
  },
  handler: function (request, reply) {
    const query = request.query;
    Promise.resolve().then(() => {
      //增加内网访问限制
      if (request.info.hostname != 'localhost' && request.info.hostname != '127.0.0.1') return Boom.badRequest('权限不足');
      return util_IDGenerator.get(query.type, query.code)
    }).then(data => {
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};
