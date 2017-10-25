const moment = require('moment-timezone');
const config = require('../config/config');
const util_number = require('../lib/number');
const service_orderlist_bid = require('../service/orderlist_bid');

exports.register = (server, options, next) => {

  const phone = '182666666';


  const internal = {};

  internal.do = () => {

    //随机用户
    const username = phone + util_number.fill(util_number.random(0, 84, 0), 2);

    //交易所
    const exchanges = Object.keys(config.exchange);

    //随机交易所
    const exchange = exchanges[util_number.random(0, exchanges.length - 1, 0)];

    //货币
    const coins = config.exchange[exchange].coins;

    //随机货币
    const coin = coins[util_number.random(0, coins.length - 1, 0)];


    const tradePlatform = exchange;
    const borrowid = 0;
    const coinType = coin;
    const bors = 'b';
    const quantity = 0;
    const bidprice = 0;
    const total = parseInt(util_number.random(500, 20000, 0) / 100) * 100;
    const isMarket = 1;
    const isMatch = 0;
    const isInQueue = 0;
    const isRobot = 0;

    return service_orderlist_bid.save(server, username, 'w', borrowid, tradePlatform, coinType, bors, quantity, bidprice, total, isMarket, isMatch, isInQueue, isRobot);

  }


  setInterval(() => {
    internal.do();
  }, util_number.random(60000, 600000, 0));

  next();
};

exports.register.attributes = {
  name: 'robot',
  version: '1.0.0'
};
