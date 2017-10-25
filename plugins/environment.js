const redis = require("redis");
const bluebird = require("bluebird");
const moment = require('moment-timezone');
const _ = require('lodash');
const config = require('../config/config');
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);
const client = redis.createClient({
  host: process.env.REDIS_HOST
});
const CACHE_KEY_ENVIRONMENT = process.env.CACHE_KEY_ENVIRONMENT;

/**
 * 环境变量
 *
 * 如果redis中有环境变量，则以redis中的环境变量为准
 * 如果redis中没有环境变量，则把配置文件中允许动态修改的环境变量放入缓存
 *
 * @param server
 * @param options
 * @param next
 */
exports.register = (server, options, next) => {

  const internal = {};

  internal.do = () => {
    return client.existsAsync(CACHE_KEY_ENVIRONMENT).then(data => {
      //设置环境变量
      if (data == 1) return internal.setEnvironment();
      //设置缓存
      return internal.setCache();
    });
  }

  //设置缓存
  internal.setCache = () => {
    const envObj = _.pick(process.env, config.dynamicEnvironment);
    return client.hmsetAsync(CACHE_KEY_ENVIRONMENT, envObj).then(data => {
      return Promise.resolve();
    });
  }

  //设置环境变量
  internal.setEnvironment = () => {
    return client.hgetallAsync(CACHE_KEY_ENVIRONMENT).then(data => {
      for(let key in data) {
        process.env[key] = data[key];
      }
      return Promise.resolve();
    });
  }

  internal.do().then(() => {
    next();
  }).catch(err => {
    logger.error(err);
    next();
  });

  // next();
};

exports.register.attributes = {
  name: 'environment',
  version: '1.0.0'
};
