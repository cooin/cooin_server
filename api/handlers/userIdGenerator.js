'use strict';
const Joi = require('joi');
const Boom = require('boom');
const util_userIdGenerator = require('../../lib/userIdGenerator');

/**
 * 获取cookie
 */
module.exports.get = {
  validate: {
    options: {
      allowUnknown: true
    }
  },
  handler: function (request, reply) {
    Promise.resolve().then(() => {
      //增加内网访问限制
      if (request.info.hostname != 'localhost' && request.info.hostname != '127.0.0.1') return Boom.badRequest('权限不足');
      return util_userIdGenerator.get();
    }).then(data => {
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};
