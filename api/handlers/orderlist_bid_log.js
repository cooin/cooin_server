'use strict';
const Joi = require('joi');
const Boom = require('boom');
const moment = require('moment-timezone');
const config = require('../../config/config');

/**
 * 查询--最新交易记录
 */
module.exports.queryLast = {
  // auth: 'jwt',
  validate: {
    query: {
      coinType: Joi.string().required()
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const Orderlist_bid_log = DB.getModel('orderlist_bid_log');
    // const session = request.auth.credentials;
    const query = request.query;

    let criteria = {
      coinType: query.coinType
    };

    Orderlist_bid_log.findAll({
      attributes: config.attributes.orderlist_bid_log.list,
      where: criteria,
      order: [
        ['id', 'DESC']
      ],
      limit: 5
    }).then(data => {
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};
