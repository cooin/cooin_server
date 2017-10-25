const redis = require("redis");
const bluebird = require("bluebird");
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

exports.getClient = () => redis.createClient({
  host: process.env.REDIS_HOST,
  port: 6379
});;
