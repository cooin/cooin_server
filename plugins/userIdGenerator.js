/**
 * userIdGenerator
 */

const util_userIdGenerator = require('../lib/userIdGenerator');

exports.register = (server, options, next) => {

  util_userIdGenerator.generate();

  next();
};

exports.register.attributes = {
  name: 'userIdGenerator',
  version: '1.0.0'
};
