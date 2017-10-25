const logger = require('../lib/logger');

/**
 * 日志
 * @param server
 * @param options
 * @param next
 */
exports.register = (server, options, next) => {

  global.logger = logger;

  next();
};

exports.register.attributes = {
  name: 'logger',
  version: '1.0.0'
};
