'use strict';
const Joi = require('joi');
const Boom = require('boom');
const moment = require('moment-timezone');
const fs = require('fs');
const util_file = require('../../lib/file');

/**
 * 保存文件
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
    util_file.save(payload.data).then(data => {
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};
