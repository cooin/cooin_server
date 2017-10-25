/**
 * 日志
 */

const bunyan = require('bunyan');

const logger = bunyan.createLogger({
  name: 'braavos',
  streams: [
    {
      level: 'info',
      stream: process.stdout
    },
    {
      level: 'info',
      type: 'rotating-file',
      period: '1d',
      count: 30,
      path: 'logs/log-info.log'
    },
    {
      level: 'error',
      type: 'rotating-file',
      period: '1d',
      count: 30,
      path: 'logs/log-error.log'
    }
  ]

});

module.exports = logger;
