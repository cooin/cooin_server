'use strict';
const Joi = require('joi');
const Boom = require('boom');
const moment = require('moment-timezone');
const fs = require('fs');
const util_encrypt = require('../../lib/encrypt');

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
    const fileName = `${process.env.DIR_STATIC_IMAGES}${util_encrypt.AHMD5(payload.data.split(",")[1])}.jpg`;
    fs.writeFile(fileName, Buffer.from(payload.data.split(",")[1], 'base64'), function (err) {//以二进制格式保存
      if (err) {
        if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
        return reply(err);
      }
      reply(`${process.env.PROTOCOL}://${process.env.DOMAIN}/${fileName}`);
    });
  }
};
