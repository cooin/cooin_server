'use strict';
const Joi = require('joi');
const Boom = require('boom');
const moment = require('moment-timezone');
const pageSize = parseInt(process.env.DB_PAGE_SIZE);

/**
 * 查询--根据促销代号
 */
module.exports.queryByCode = {
  // auth: 'jwt',
  validate: {
    params: {
      code: Joi.string().required().max(50)
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const Promotion = DB.getModel('promotion');
    // const session = request.auth.credentials;
    const params = request.params;

    const criteria = {code: params.code};
    Promotion.findOne({
      where: criteria
    }).then(data => {
      reply(JSON.parse(data.doc));
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};
