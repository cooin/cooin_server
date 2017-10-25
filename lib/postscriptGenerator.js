const redis = require("redis");
const bluebird = require("bluebird");
const moment = require('moment-timezone');
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);
const client = redis.createClient({
  host: process.env.REDIS_HOST
});
const util_number = require('./number');

//key前缀
const prefix = 'postscript';
//每个key的值个数
const count = 100000;

let internal = {};

internal.array = length => {
  let array = [];
  for (let j = 0; j < length; j++) {
    array.push(j);
  }
  return array;
}

let value = {
  100000: internal.array(100000)
};

/**
 * ID生成器
 *
 * 每天生成100000个ID
 * 如果key存在则不重新生成
 * key生成规则：前缀+day
 * key过期时间：48h
 *
 * @returns {Promise.<*>}
 */
exports.generate = () => {

  const key = prefix + moment().day();
  const delay = 48 * 3600;

  return client.existsAsync(key).then(data => {
    if (data == 1) return Promise.resolve();
    return client.multi().sadd(key, value[count]).expire(key, delay).execAsync();
  }).then(() => {
    return Promise.resolve();
  });

}

/**
 * 获取ID
 * @returns {Promise.<*>}
 */
exports.get = () => {
  const day = moment().day();
  //键
  const key = prefix + day;
  //随机获取
  return client.spopAsync(key).then(data => {
    //防止意外发生，自动调用生成器保证提供数据
    if (!data) return this.generate().then(this.get);
    //组合ID（周几 + 不重复随机数）
    let id = day + util_number.fill(data, 5);
    return Promise.resolve(id);
  });
}
