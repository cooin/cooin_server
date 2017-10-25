/**
 * IDGenerator
 */

const util_IDGenerator = require('../lib/IDGenerator');

exports.register = (server, options, next) => {

  util_IDGenerator.generate('userborrow');
  util_IDGenerator.generate('followInvest');
  util_IDGenerator.generate('orderlist_bid');
  util_IDGenerator.generate('fund_in_out');
  util_IDGenerator.generate('orderlist');
  util_IDGenerator.generate('applywithdraw');
  util_IDGenerator.generate('orderlist_bid_log');
  util_IDGenerator.generate('borrowlist');
  util_IDGenerator.generate('question');
  setInterval(() => {
    util_IDGenerator.generate('userborrow');
    util_IDGenerator.generate('followInvest');
    util_IDGenerator.generate('orderlist_bid');
    util_IDGenerator.generate('fund_in_out');
    util_IDGenerator.generate('orderlist');
    util_IDGenerator.generate('applywithdraw');
    util_IDGenerator.generate('orderlist_bid_log');
    util_IDGenerator.generate('borrowlist');
    util_IDGenerator.generate('question');
  }, 2000);

  next();
};

exports.register.attributes = {
  name: 'schedule IDGenerator',
  version: '1.0.0'
};
