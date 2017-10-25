'use strict';
const Joi = require('joi');
const Boom = require('boom');
const moment = require('moment-timezone');
const config = require('../../config/config');
const client = require('../../lib/redis').getClient();
const service_orderlist_bid = require('../../service/orderlist_bid');


/**
 * 查询--行情
 */
module.exports.queryTicker = {
  // auth: 'jwt',
  validate: {
    query: {
      coinType: Joi.string().valid('btc', 'ltc', 'eth')
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    // const session = request.auth.credentials;
    const query = request.query;

    //指定货币
    if (query.coinType) {
      return service_orderlist_bid.getTicker(request.server, query.coinType).then(data => {
        reply(data);
      }).catch(err => {
        if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
        reply(err);
      });
    }

    //所有货币
    const task = [];
    for (let key in config.coin) {
      task.push(service_orderlist_bid.getTicker(request.server, key));
    }
    return Promise.all(task).then(data => {
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};

/**
 * 查询--交易
 */
module.exports.queryTrades = {
  // auth: 'jwt',
  validate: {
    query: {
      size: Joi.number().integer().min(1).max(200).default(5),
      coinType: Joi.string().required().valid('btc', 'ltc', 'eth')
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
      raw: true,
      attributes: [['transNumber', 'tid'], ['transType', 'type'], ['quantity', 'amount'], ['transPrice', 'price'], ['createdAt', 'date']],
      where: criteria,
      order: [
        ['id', 'DESC']
      ],
      limit: query.size
    }).then(data => {
      data.forEach(item => {
        item.date = parseInt(new Date(item.date).getTime() / 1000);
      });
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};

/**
 * 查询--深度
 */
module.exports.queryDepth = {
  // auth: 'jwt',
  validate: {
    query: {
      size: Joi.number().integer().min(1).max(20).default(5),
      coinType: Joi.string().required().valid('btc', 'ltc', 'eth')
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    // const session = request.auth.credentials;
    const query = request.query;

    service_orderlist_bid.getDepth(request.server, query.coinType, query.size).then(data => {
      let response = data[query.coinType];

      let responseData = {
        asks: [],
        bids: []
      };
      response.sell.forEach(item => {
        responseData.asks.push([item.bidprice, item.quantity]);
      });
      response.buy.forEach(item => {
        responseData.bids.push([item.bidprice, item.quantity]);
      });

      reply(responseData);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });

  }
};

/**
 * 查询--最新成交价
 */
module.exports.queryLast = {
  // auth: 'jwt',
  validate: {
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {

    //从缓存中读取数据
    client.hgetallAsync('lastprice').then(data => {
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};
