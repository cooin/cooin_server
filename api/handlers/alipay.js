'use strict';
const Joi = require('joi');
const Boom = require('boom');
const service_alipay = require('../../service/alipay');

/**
 * 设置cookie
 */
module.exports.setCookie = {
  validate: {
    payload: {
      cookie: Joi.string().required()
    },
    options: {
      allowUnknown: true
    }
  },
  handler: function (request, reply) {
    const query = request.payload;
    service_alipay.setCookie(request.server, query.cookie).then(data => {
      reply();
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    })
  }
};

/**
 * 获取cookie
 */
module.exports.getCookie = {
  validate: {
    query: {
    },
    options: {
      allowUnknown: true
    }
  },
  handler: function (request, reply) {
    service_alipay.getCookie(request.server).then(data => {
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    })
  }
};
