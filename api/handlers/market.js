'use strict';
const Joi = require('joi');
const Boom = require('boom');
const config = require('../../config/config');
const util_market = require('../../lib/market');
const util_marketInvesting = require('../../lib/marketInvesting');
const client = require('../../lib/redis').getClient();
const KLINE_SOURCE_FROM_SELF = parseInt(process.env.KLINE_SOURCE_FROM_SELF);
const KLINE_SOURCE_FROM_OKCOIN = parseInt(process.env.KLINE_SOURCE_FROM_OKCOIN);
const pageSize = parseInt(process.env.DB_PAGE_SIZE);

/**
 * 查询所有
 */
module.exports.queryAll = {
  validate: {
    query: {
      coinType: Joi.string().required().valid('btc', 'ltc', 'gold', 'oil', 'share_SH', 'share_HK', 'dollar'),
      unit: Joi.string().required().valid('date', 'week', 'month')
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    if (request.query.coinType == 'btc' || request.query.coinType == 'ltc') {
      util_market[request.query.unit](request.query.coinType).then(data => {
        reply(data);
      }).catch(err => {
        if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
        reply(err);
      });
    } else {
      util_marketInvesting[request.query.unit](request.query.coinType).then(data => {
        reply(data);
      }).catch(err => {
        if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
        reply(err);
      });
    }
  }
};

/**
 * 查询kline
 */
module.exports.queryKline = {
  validate: {
    query: {
      coinType: Joi.string().required().valid('btc', 'ltc', 'eth'),
      unit: Joi.string().required().valid('1min', '3min', '5min', '15min', '30min', '1hour', '1day', '1week'),
      page: Joi.number().integer().min(1).default(1),
      size: Joi.number().integer().min(1).max(2000).default(2000)
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const KLine = DB.getModel('kLine');
    const query = request.query;
    const offset = (query.page - 1) * query.size;

    let source;
    if (KLINE_SOURCE_FROM_SELF) source = 'bitekuang';
    if (KLINE_SOURCE_FROM_OKCOIN) source = 'okcoin';

    //查询
    KLine.findAll({
      attributes: config.attributes.kLine.list,
      where: {
        source,
        coinType: query.coinType,
        unit: query.unit
      },
      order: [
        ['time', 'DESC']
      ],
      offset: offset,
      limit: query.size
    }).then(data => {
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};

/**
 * 查询所有平台的行情
 */
module.exports.queryTickerForAll = {
  validate: {
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    //读取缓存
    client.getAsync('market').then(data => {
      reply(JSON.parse(data));
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};
