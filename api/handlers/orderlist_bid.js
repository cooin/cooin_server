'use strict';
const Joi = require('joi');
const Boom = require('boom');
const moment = require('moment-timezone');
const _ = require('lodash');
const config = require('../../config/config');
const service_orderlist_bid = require('../../service/orderlist_bid');
const service_master_register = require('../../service/master_register');
const pageSize = parseInt(process.env.DB_PAGE_SIZE);

/**
 * 下单
 */
module.exports.save = {
  auth: 'jwt',
  validate: {
    payload: {
      walletType: Joi.number().integer().required().valid(1, 2),
      borrowid: Joi.string().max(30).default(0)
        .when('walletType', {is: 2, then: Joi.required()}),
      tradePlatform: Joi.string().required().valid('okcoin', 'huobi', 'chbtc', 'btcchina', 'yunbi', 'bter'),
      coinType: Joi.string().required(),
      bors: Joi.string().required().valid('b', 's'),
      quantity: Joi.number()
        .when('coinType', {
          is: 'btc',
          then: Joi.number().min(config.coin.btc.order_user_min).max(config.coin.btc.order_user_max)
        })
        .when('coinType', {
          is: 'ltc',
          then: Joi.number().min(config.coin.ltc.order_user_min).max(config.coin.ltc.order_user_max)
        })
        .when('coinType', {
          is: 'eth',
          then: Joi.number().min(config.coin.eth.order_user_min).max(config.coin.eth.order_user_max)
        }),
      dealpassword: Joi.string().min(6).max(6),
      isMarket: Joi.number().integer().valid(0, 1).default(0),//是否是市价单
      bidprice: Joi.number()
        .when('isMarket', {is: 0, then: Joi.number().greater(0).required()}),
      total: Joi.number()
        .when('isMarket', {is: 1, then: Joi.number().min(10)})
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const Master_register = DB.getModel('master_register');
    const Orderlist_bid = DB.getModel('orderlist_bid');
    const session = request.auth.credentials;
    const payload = request.payload;

    //查询用户当前支付钱包当天购买数量
    //钱包
    let moneyfrom;
    //数量限制
    let perDayCountLimit;
    //查询条件
    let query;
    switch (payload.walletType) {
      case 1:
        query = {username: session.username};
        perDayCountLimit = 100000000;
        moneyfrom = 'w';
        break;
      case 2:
        query = {username: session.username, borrowid: payload.borrowid, status: 2};
        perDayCountLimit = 5;
        moneyfrom = 'c';
        break;
    }
    query.createdAt = {$gte: new Date(moment(moment().format('YYYYMMDD')))};
    query.status = [0, 2, 4];//委托中，已成交，部分成交已撤销
    query.moneyfrom = moneyfrom;//指定钱包
    Orderlist_bid.count({
      where: query
    }).then(count => {
      if (count >= perDayCountLimit) throw new Error(`今日委托数量已达上限`);

      //我的钱包
      return Master_register.findOne({
        attributes: ['dealpassword', 'switchdealpass'],
        where: {username: session.username}
      });
    }).then(data => {
      //钱包都不存在
      if (!data) throw Boom.badRequest('钱包不存在');

      //查看密码是否正确（开启交易密码的情况下）
      if (data.switchdealpass == 1 && data.dealpassword != payload.dealpassword) throw Boom.badRequest('交易密码错误');

      const tradePlatform = payload.tradePlatform;
      const borrowid = payload.borrowid;
      const coinType = payload.coinType;
      const bors = payload.bors;
      const quantity = payload.quantity;
      const bidprice = payload.bidprice;
      const total = payload.total;
      const isMarket = payload.isMarket;
      const isMatch = 0;
      const isInQueue = 1;
      const isRobot = 0;

      //委托
      return service_orderlist_bid.save(request.server, session.username, moneyfrom, borrowid, tradePlatform, coinType, bors, quantity, bidprice, total, isMarket, isMatch, isInQueue, isRobot);
    }).then(data => {
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });

  }
};

/**
 * 解冻（撤销）
 */
module.exports.unfreeze = {
  auth: 'jwt',
  validate: {
    params: {
      orderid: Joi.string().required()
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const Orderlist_bid = DB.getModel('orderlist_bid');
    const session = request.auth.credentials;
    const params = request.params;

    //查询订单
    Orderlist_bid.findOne({
      where: {
        username: session.username,
        orderid: params.orderid,
        status: [0, 5]
      }
    }).then(data => {
      if (!data) throw Boom.badRequest('权限不足');

      if (data.status == 5) {
        return Orderlist_bid.findOne({
          where: {buyOrderid: params.orderid}
        }).then(data => {
          //解冻（撤销）
          return service_orderlist_bid.cancel(request.server, data);
        });
      }
      //解冻（撤销）
      return service_orderlist_bid.cancel(request.server, data);
    }).then(order => {
      if (order.bors == 'b') return Promise.resolve(order);
      return Orderlist_bid.findOne({
        where: {orderid: params.orderid}
      });
    }).then(order => {
      reply(_.pick(order, config.attributes.orderlist_bid.detail));
      //推送订单信息
      socketUtil.send(order.username, 'transOrder', order);
      //推送钱包金额变动消息
      service_master_register.pushAllWallet(request.server, order.borrowid, order.username);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};

/**
 * 卖出
 */
module.exports.sell = {
  auth: 'jwt',
  validate: {
    params: {
      orderid: Joi.string().required()
    },
    payload: {
      price: Joi.number().greater(0)
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const Orderlist_bid = DB.getModel('orderlist_bid');
    const session = request.auth.credentials;
    const params = request.params;
    const payload = request.payload;

    //查询订单
    Orderlist_bid.findOne({
      where: {
        username: session.username,
        orderid: params.orderid
      }
    }).then(data => {
      if (!data) throw Boom.badRequest('权限不足');
      //卖出
      return service_orderlist_bid.sell(request.server, data, payload.price ? payload.price : 0);
    }).then(data => {
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};

/**
 * 查询--当前用户
 */
module.exports.queryForCurrentUser = {
  auth: 'jwt',
  validate: {
    query: {
      page: Joi.number().integer().min(1).default(1)
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const Orderlist_bid = DB.getModel('orderlist_bid');
    const session = request.auth.credentials;
    const query = request.query;
    const offset = --query.page * pageSize;

    let criteria = {
      username: session.username,
      bors: 'b',
      moneyfrom: 'w'
    };

    Orderlist_bid.findAndCountAll({
      attributes: config.attributes.orderlist_bid.list,
      where: criteria,
      order: [
        ['id', 'DESC']
      ],
      offset: offset,
      limit: pageSize
    }).then(data => {
      //附上交易所
      data.rows = data.rows.map(item => {
        item.exchange = config.exchange[item.tradePlatform];
        return item;
      });
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};

/**
 * 查询--指定用户
 */
module.exports.queryForUser = {
  // auth: 'jwt',
  validate: {
    params: {
      userId: Joi.string().required().min(5).max(10),
    },
    query: {
      page: Joi.number().integer().min(1).default(1)
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const Master_register = DB.getModel('master_register');
    const Orderlist_bid = DB.getModel('orderlist_bid');
    // const session = request.auth.credentials;
    const params = request.params;
    const query = request.query;
    const offset = --query.page * pageSize;

    Master_register.findOne({where: {activecode: params.userId}}).then(data => {
      if (!data) throw Boom.badRequest('用户不存在');
      const criteria = {
        username: data.username,
        bors: 'b',
        moneyfrom: 'w',
        status: [2, 6]
      };

      return Orderlist_bid.findAndCountAll({
        attributes: config.attributes.orderlist_bid.list,
        where: criteria,
        order: [
          ['id', 'DESC']
        ],
        offset: offset,
        limit: pageSize
      });
    }).then(data => {
      //附上交易所
      data.rows = data.rows.map(item => {
        item.exchange = config.exchange[item.tradePlatform];
        return item;
      });
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};

/**
 * 查询--指定跟投
 */
module.exports.queryForFollowInvest = {
  // auth: 'jwt',
  validate: {
    params: {
      followInvestId: Joi.string().required().max(30)
    },
    query: {
      page: Joi.number().integer().min(1).default(1)
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const FollowInvest = DB.getModel('followInvest');
    const Orderlist_bid = DB.getModel('orderlist_bid');
    // const session = request.auth.credentials;
    const params = request.params;
    const query = request.query;
    const offset = --query.page * pageSize;

    FollowInvest.findOne({where: {followInvestId: params.followInvestId}}).then(data => {
      if (!data) throw Boom.badRequest('跟投不存在');
      const criteria = {
        borrowid: params.followInvestId,
        bors: 'b'
      };

      return Orderlist_bid.findAndCountAll({
        attributes: config.attributes.orderlist_bid.list,
        where: criteria,
        order: [
          ['id', 'DESC']
        ],
        offset: offset,
        limit: pageSize
      });
    }).then(data => {
      //附上交易所
      data.rows = data.rows.map(item => {
        item.exchange = config.exchange[item.tradePlatform];
        return item;
      });
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};

/**
 * 查询（orderid）
 */
module.exports.queryForCurrentUserByOrderid = {
  auth: 'jwt',
  validate: {
    params: {
      orderid: Joi.string().required()
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const Orderlist_bid = DB.getModel('orderlist_bid');
    const Orderlist_bid_log = DB.getModel('orderlist_bid_log');
    const session = request.auth.credentials;
    const params = request.params;

    Promise.all([
      //订单
      Orderlist_bid.findOne({
        attributes: config.attributes.orderlist_bid.detail,
        where: {
          username: session.username,
          orderid: params.orderid
        }
      }),
      //订单撮合记录
      Orderlist_bid_log.findAll({
        where: {
          $or: [
            {buyOrderId: params.orderid},
            {sellOrderId: params.orderid}
          ]
        }
      })
    ]).then(datas => {
      if (!datas[0]) throw Boom.wrap(new Error('数据不存在'), 404);
      datas[0].get().orderlist_bid_log = datas[1];
      reply(datas[0].get());
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });

  }
};

/**
 * 查询--当前用户--各种币种交易次数
 */
module.exports.queryTransCountForCurrentUser = {
  auth: 'jwt',
  validate: {
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const Orderlist_bid = DB.getModel('orderlist_bid');
    const session = request.auth.credentials;

    service_orderlist_bid.queryTransCount(request.server, session.username).then(data => {
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};

/**
 * 查询--指定用户--各种币种交易次数
 */
module.exports.queryTransCountForUser = {
  // auth: 'jwt',
  validate: {
    params: {
      userId: Joi.string().required().min(5).max(10),
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const Master_register = DB.getModel('master_register');
    // const session = request.auth.credentials;
    const params = request.params;

    Master_register.findOne({where: {activecode: params.userId}}).then(data => {
      return service_orderlist_bid.queryTransCount(request.server, data.username);
    }).then(data => {
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};
