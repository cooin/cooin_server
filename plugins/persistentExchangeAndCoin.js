const config = require('../config/config');

/**
 * 持久化交易所、货币信息
 * @param server
 * @param options
 * @param next
 */
exports.register = (server, options, next) => {

  //数据库
  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];

  const Exchange = DB.getModel('exchange');
  const Coin = DB.getModel('coin');

  //货币
  for (let key in config.coin) {
    const item = config.coin[key];
    const criteria = {
      name: item.name
    };
    const doc = {
      name: item.name,
      name_cn: item.name_cn,
      code: item.code,
      logo: item.logo(),
      cover: item.cover(),
      intro: item.intro
    };
    Coin.findOrCreate({
      where: criteria,
      defaults: doc
    }).then(data => {
      if (data[1]) return Promise.resolve();
      return Coin.update(doc, {where: criteria});
    });
  }

  //交易所
  for (let key in config.exchange) {
    const item = config.exchange[key];
    const criteria = {
      name: item.name
    };
    const doc = {
      name: item.name,
      name_cn: item.name_cn,
      logo: item.logo(),
      cover: item.cover(),
      intro: item.intro
    };
    Exchange.findOrCreate({
      where: criteria,
      defaults: doc
    }).then(data => {
      if (data[1]) return Promise.resolve();
      return Exchange.update(doc, {where: criteria});
    });
  }


  next();
};

exports.register.attributes = {
  name: 'persistentExchangeAndCoin',
  version: '1.0.0'
};
