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
    const Coin = DB.getModel('coin');
    Coin.findAll({
      attributes: config.attributes.coin.list
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
    const Coin = DB.getModel('coin');
    const params = request.params;
    Coin.findOne({
      attributes: config.attributes.coin.detail,
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
        curr_type = '${config.coin[params.name].code}'
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

