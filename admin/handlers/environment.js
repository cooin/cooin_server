'use strict';
const Joi = require('joi');
const Boom = require('boom');
const redis = require("redis");
const bluebird = require("bluebird");
const moment = require('moment-timezone');
const _ = require('lodash');
const config = require('../../config/config');
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);
const client = redis.createClient({
  host: process.env.REDIS_HOST
});

const CACHE_KEY_ENVIRONMENT = process.env.CACHE_KEY_ENVIRONMENT;

const updateValidate = {};
config.dynamicEnvironment.forEach(item => {
  updateValidate[item] = Joi.required();
});

/**
 * 查询
 */
module.exports.query = {
  auth: 'jwt',
  validate: {
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    // const session = request.auth.credentials;
    reply(_.pick(process.env, config.dynamicEnvironment));
  }
};

/**
 * 更新
 */
module.exports.update = {
  auth: 'jwt',
  validate: {
    payload: updateValidate,
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    // const session = request.auth.credentials;
    const payload = request.payload;
    client.hmsetAsync(CACHE_KEY_ENVIRONMENT, payload).then(data => {
      return client.hgetallAsync(CACHE_KEY_ENVIRONMENT);
    }).then(data => {
      for(let key in data) {
        process.env[key] = data[key];
      }
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};
