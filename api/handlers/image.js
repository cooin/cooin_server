'use strict';
const Joi = require('joi');
const Boom = require('boom');
const moment = require('moment-timezone');
const fs = require('fs');
const util_image = require('../../lib/image');


/**
 * 保存图片
 */
module.exports.save = {
  auth: 'jwt',
  validate: {
    payload: {
      data: Joi.string().required()
    },
    options: {
      allowUnknown: true
    }
  },
  handler: function (request, reply) {
    const payload = request.payload;
    util_image.save(payload.data).then(data => {
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};

/**
 * 保存图片（附带一张缩率图）
 */
module.exports.saveWithMini = {
  auth: 'jwt',
  validate: {
    payload: {
      data: Joi.string().required()
    },
    options: {
      allowUnknown: true
    }
  },
  handler: function (request, reply) {
    const payload = request.payload;
    util_image.saveWithMini(payload.data).then(data => {
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};
