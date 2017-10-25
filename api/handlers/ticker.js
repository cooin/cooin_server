'use strict';
const Joi = require('joi');
const Boom = require('boom');
const moment = require('moment-timezone');
const config = require('../../config/config');
const client = require('../../lib/redis').getClient();


/**
 * 查询
 */
module.exports.query = {
  // auth: 'jwt',
  validate: {
    query: {
      source: Joi.string().max(10),
      coinType: Joi.string().max(10)
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    // const session = request.auth.credentials;
    const query = request.query;
    let keys;

    const keyWildcard = `ticker_${query.source ? query.source : '*'}_${query.coinType ? query.coinType : '*'}`;
    //根据通配符查找key
    return client.keysAsync(keyWildcard).then(data => {
      keys = data;
      const task = [];
      keys.forEach(key => task.push(client.getAsync(key)));
      return Promise.all(task);
    }).then(data => {
      data = data.map(item => JSON.parse(item));
      keys.forEach((key, index) => {
        const array = key.split('_');
        data[index].logo = config.exchange[array[1]].logo();
        data[index].cover = config.exchange[array[1]].cover();
        data[index].source = config.exchange[array[1]].name;
        data[index].source_cn = config.exchange[array[1]].name_cn;
        data[index].coin = config.coin[array[2]].name;
        data[index].coin_cn = config.coin[array[2]].name_cn;
        data[index].coin_logo = config.coin[array[2]].logo();
        data[index].coin_cover = config.coin[array[2]].cover();
        data[index].code = config.coin[array[2]].code;
      });
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
module.exports.queryForRecommend = {
  // auth: 'jwt',
  validate: {
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    // const session = request.auth.credentials;
    let keys;

    const array_keys = [
      'ticker_okcoin_btc',
      'ticker_huobi_btc',
      'ticker_chbtc_eth',
    ];

    return client.mgetAsync(array_keys).then(data => {
      data = data.map(item => JSON.parse(item));
      array_keys.forEach((key, index) => {
        const array = key.split('_');
        data[index].logo = config.exchange[array[1]].logo();
        data[index].cover = config.exchange[array[1]].cover();
        data[index].banner = config.exchange[array[1]].banner();
        data[index].source = config.exchange[array[1]].name;
        data[index].source_cn = config.exchange[array[1]].name_cn;
        data[index].coin = config.coin[array[2]].name;
        data[index].coin_cn = config.coin[array[2]].name_cn;
        data[index].coin_logo = config.coin[array[2]].logo();
        data[index].coin_cover = config.coin[array[2]].cover();
        data[index].code = config.coin[array[2]].code;
      });
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};
