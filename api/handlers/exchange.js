'use strict';
const Joi = require('joi');
const Boom = require('boom');
const _ = require('lodash');
const moment = require('moment-timezone');
const config = require('../../config/config');


/**
 * 查询
 */
module.exports.query = {
  // auth: 'jwt',
  validate: {
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const Exchange = DB.getModel('exchange');

    const startTime = moment(Date.now() - 24 * 3600000).format('YYYY-MM-DD mm:HH:ss');

    const sql = `(select cast(sum(nowdealtotal) as decimal(12, 2)) from orderlist_bid where orderlist_bid.tradePlatform = exchange.name and nowdealtotal > 0 and createdAt > '${startTime}')`;

    Exchange.findAll({
      attributes: config.attributes.exchange.list.concat([
        [Sequelize.literal(sql), 'total']
      ])
    }).then(data => {
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};

/**
 * 查询
 */
module.exports.queryByName = {
  // auth: 'jwt',
  validate: {
    params: {
      name: Joi.string().required().max(30)
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const Exchange = DB.getModel('exchange');
    const params = request.params;

    const startTime = moment(Date.now() - 24 * 3600000).format('YYYY-MM-DD mm:HH:ss');

    const sql = `(select cast(sum(nowdealtotal) as decimal(12, 2)) from orderlist_bid where orderlist_bid.tradePlatform = exchange.name and nowdealtotal > 0 and createdAt > '${startTime}')`;

    Exchange.findOne({
      attributes: config.attributes.exchange.detail.concat([
        [Sequelize.literal(sql), 'total']
      ]),
      where: {name: params.name}
    }).then(data => {
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};

/**
 * 查询24小时成交额KLine
 */
module.exports.queryTradeKLine = {
  // auth: 'jwt',
  validate: {
    params: {
      name: Joi.string().required().max(30)
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const params = request.params;

    const startTime = moment(new Date(Date.now() - 23 * 3600000)).format('YYYY-MM-DD HH:00:00');

    const sql = `
    select 
      date_format(createdAt, '%Y-%m-%d %H:00') as date, 
      cast(sum(nowdealtotal) as decimal(11, 2)) as total
      from orderlist_bid
      where
        tradePlatform = '${params.name}'
        and nowdealtotal > 0
        and createdAt > '${startTime}'
      group by date_format(createdAt, '%Y-%m-%d %H:00')
      order by date_format(createdAt, '%Y-%m-%d %H:00')
    `;

    Sequelize.query(sql).then(data => {
      reply(data[0]);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};

