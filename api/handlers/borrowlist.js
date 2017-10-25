'use strict';
const Joi = require('joi');
const Boom = require('boom');
const moment = require('moment-timezone');
const config = require('../../config/config');
const service_borrowlist = require('../../service/borrowlist');
const util_string = require('../../lib/string');
const client = require('../../lib/redis').getClient();
const pageSize = parseInt(process.env.DB_PAGE_SIZE);

/**
 * 查询--当前用户
 */
module.exports.queryForCurrentUser = {
  auth: 'jwt',
  validate: {
    query: {
      page: Joi.number().integer().min(1),
      status: Joi.number().integer().min(0).max(7)
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const Borrowlist = DB.getModel('borrowlist');
    const session = request.auth.credentials;
    const query = request.query;
    const offset = (query.page ? query.page - 1 : 0 ) * pageSize;

    const criteria = {username: session.username};
    if (query.status) criteria.status = query.status;
    Borrowlist.findAll({
      where: criteria,
      order: [
        ['status', 'ASC'],
        ['id', 'DESC']
      ],
      offset: offset,
      limit: pageSize
    }).then(data => {
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};

/**
 * 结算
 */
module.exports.settlement = {
  auth: 'jwt',
  validate: {
    payload: {
      borrowid: Joi.string().max(30).required()
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const Borrowlist = DB.getModel('borrowlist');
    const session = request.auth.credentials;
    const params = request.payload;

    Borrowlist.findOne({
      where: {
        username: session.username,
        borrowid: params.borrowid,
        status: 2
      }
    }).then(data => {
      if (!data) throw Boom.wrap(new Error('赠金钱包不存在'), 404);
      // //竞赛钱包结算时间不早于过期时间前24小时
      // if (data.borrowtype == 2 && new Date(moment(data.returntime, 'YYYYMMDDHHmm')).getTime() - Date.now() > 24 * 3600000) throw Boom.badRequest('比赛结束前24小时才能手动结算');
      //竞赛钱包不能手动结算
      if (data.borrowtype == 2) throw Boom.badRequest('该钱包不能手动结算');
      return service_borrowlist.settlement(request.server, data, 1);
    }).then(data => {
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};

/**
 * 查询订单记录--当前用户
 */
module.exports.queryOrderForCurrentUser = {
  auth: 'jwt',
  validate: {
    params: {
      borrowid: Joi.string().max(30).required()
    },
    query: {
      page: Joi.number().integer().min(1)
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const Borrowlist = DB.getModel('borrowlist');
    const Orderlist_bid = DB.getModel('orderlist_bid');
    const session = request.auth.credentials;
    const params = request.params;
    const query = request.query;
    const offset = (query.page ? query.page - 1 : 0 ) * pageSize;

    //查询赠金钱包
    Borrowlist.findOne({
      where: {
        username: session.username,
        borrowid: params.borrowid
      }
    }).then(data => {
      if (!data) throw Boom.badRequest('权限不足');

      //查询订单记录
      return Orderlist_bid.findAll({
        attributes: config.attributes.orderlist_bid.list,
        where: {
          borrowid: params.borrowid,
          moneyfrom: 'c'
        },
        order: [
          ['id', 'DESC']
        ],
        offset: offset,
        limit: pageSize
      });
    }).then(data => {
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};

/**
 * 查询全部订单记录--当前用户
 */
module.exports.queryAllOrderForCurrentUser = {
  auth: 'jwt',
  validate: {
    params: {
      borrowid: Joi.string().max(30).required()
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const Borrowlist = DB.getModel('borrowlist');
    const Orderlist_bid = DB.getModel('orderlist_bid');
    const session = request.auth.credentials;
    const params = request.params;

    //查询赠金钱包
    Borrowlist.findOne({
      where: {
        username: session.username,
        borrowid: params.borrowid
      }
    }).then(data => {
      if (!data) throw Boom.badRequest('权限不足');

      //查询订单记录
      return Orderlist_bid.findAll({
        attributes: config.attributes.orderlist_bid.list,
        where: {
          borrowid: params.borrowid,
          moneyfrom: 'c'
        },
        order: [
          ['id', 'DESC']
        ]
      });
    }).then(data => {
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};

/**
 * 获取奖励
 *
 * 用户使用竞赛钱包交易成功满六次后可获得5元奖金（每人只限获得一次）
 *
 * 钱包判别
 *  borrowtype: 2
 *  sysinput: 5
 *
 * 用户领取后钱包sysinput改为2
 *
 * 流程
 *  改变竞赛钱包状态
 *  我的钱包充值
 *  插入流水记录
 *
 */
module.exports.getBonus = {
  auth: 'jwt',
  validate: {
    params: {
      borrowid: Joi.string().max(30).required()
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const Borrowlist = DB.getModel('borrowlist');
    const session = request.auth.credentials;
    const params = request.params;

    //查询赠金钱包
    Borrowlist.findOne({
      where: {
        borrowtype: 2,
        sysinput: 5,
        username: session.username,
        borrowid: params.borrowid
      }
    }).then(data => {
      if (!data) throw Boom.badRequest('权限不足');

      if (data.tradeCount < 6) throw Boom.badRequest('该钱包交易未满6次，不能领取');

      return service_borrowlist.getBonus(request.server, data);
    }).then(data => {
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};

/*****************************公共接口***********************************/

/**
 * 查询--竞赛钱包实时市值top（进行中）
 */
module.exports.queryTop = {
  // auth: 'jwt',
  validate: {
    query: {
      size: Joi.number().integer().max(20).default(10),
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const Borrowlist = DB.getModel('borrowlist');
    // const session = request.auth.credentials;
    const query = request.query;
    const pageSize = query.size;

    client.getAsync('borrowlistRanking').then(data => {
      if (!data) return reply([]);
      data = JSON.parse(data);
      data = data.map(item => {
        item.username = util_string.hidePhoneNumber(item.username);
        return item;
      });
      reply(data.slice(0, pageSize));
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};

/**
 * 查询--根据期数查询竞赛钱包市值top（钱包已结算）
 */
module.exports.queryTopByPeriod = {
  // auth: 'jwt',
  validate: {
    query: {
      size: Joi.number().integer().max(20).default(10),
      period: Joi.number().min(1).required()
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const Borrowlist = DB.getModel('borrowlist');
    // const session = request.auth.credentials;
    const query = request.query;
    const pageSize = query.size;

    const criteria = {
      // status: [4, 5],
      borrowtype: 2,
      period: query.period,
      username: {$notLike: 'demo%'}
    };

    const sql_total = `cast(
      sum(
        (rmb_balance + rmb_balance_f) + 
        (btc_balance + btc_balance_f) * (select lastprice from realtimeprice where currencytype = 1) + 
        (bt2_balance + bt2_balance_f) * (select lastprice from realtimeprice where currencytype = 2)
      )
      as decimal(11, 2))`;

    Borrowlist.findAll({
      raw: true,
      attributes: [
        'username',
        'borrowid',
        [Sequelize.literal(sql_total), 'total']
      ],
      where: criteria,
      group: 'id',
      order: [
        [Sequelize.literal(sql_total), 'DESC']
      ],
      limit: pageSize
    }).then(data => {
      data = data.map(item => {
        item.username = util_string.hidePhoneNumber(item.username);
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
 * 查询--最新竞赛钱包
 */
module.exports.queryLast = {
  // auth: 'jwt',
  validate: {
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const Borrowlist = DB.getModel('borrowlist');
    // const session = request.auth.credentials;

    const criteria = {
      borrowtype: 2,
      username: {$notLike: 'demo%'}
    };

    Borrowlist.findOne({
      raw: true,
      attributes: ['username', 'borrowid'],
      where: criteria,
      order: [
        ['id', 'DESC']
      ],
    }).then(data => {
      if (data) data.username = util_string.hidePhoneNumber(data.username);
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};

/**
 * 查询--竞赛钱包最新交易
 */
module.exports.queryLastTrade = {
  // auth: 'jwt',
  validate: {
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const Orderlist_bid = DB.getModel('orderlist_bid');
    // const session = request.auth.credentials;

    const criteria = {
      status: 2,
      moneyfrom: 'c',
      username: {$notLike: 'demo%'}
    };

    Orderlist_bid.findOne({
      raw: true,
      attributes: config.attributes.orderlist_bid.list,
      where: criteria,
      order: [
        ['id', 'DESC']
      ],
    }).then(data => {
      if (data) data.username = util_string.hidePhoneNumber(data.username);
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};

/**
 * 查询--某个赠金钱包的所有委托记录
 */
module.exports.queryAllOrderByBorrowid = {
  // auth: 'jwt',
  validate: {
    params: {
      borrowid: Joi.string().max(30).required()
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const Borrowlist = DB.getModel('borrowlist');
    const Orderlist_bid = DB.getModel('orderlist_bid');
    // const session = request.auth.credentials;
    const params = request.params;

    //查询赠金钱包
    Borrowlist.findOne({
      where: {
        // borrowtype: 2,
        borrowid: params.borrowid,
        username: {$notLike: 'demo%'}
      }
    }).then(data => {
      if (!data) throw Boom.badRequest('权限不足');

      //查询订单记录
      return Orderlist_bid.findAll({
        attributes: config.attributes.orderlist_bid.list,
        where: {
          borrowid: params.borrowid,
          moneyfrom: 'c',
          status: [0, 2]
        },
        order: [
          ['id', 'DESC']
        ]
      });
    }).then(data => {
      data = data.map(item => {
        item.username = util_string.hidePhoneNumber(item.username);
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
 * 查询--根据ID
 */
module.exports.queryByBorrowid = {
  // auth: 'jwt',
  validate: {
    params: {
      borrowid: Joi.string().max(30).required()
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const Borrowlist = DB.getModel('borrowlist');
    // const session = request.auth.credentials;
    const params = request.params;

    //查询赠金钱包
    Borrowlist.findOne({
      attributes: ['borrowid', 'username', 'rmb_balance', 'btc_balance', 'bt2_balance', 'rmb_balance_f', 'btc_balance_f', 'bt2_balance_f'],
      where: {
        // borrowtype: 2,
        borrowid: params.borrowid,
        username: {$notLike: 'demo%'}
      }
    }).then(data => {
      if (data) data.username = util_string.hidePhoneNumber(data.username);
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};

/**
 * 查询--用户竞赛钱包排名
 * 在排名缓存里查询用户排名，如果没有则返回-1
 */
module.exports.queryRanking = {
  auth: 'jwt',
  validate: {
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const Borrowlist = DB.getModel('borrowlist');
    const session = request.auth.credentials;

    client.getAsync('borrowlistRanking').then(data => {
      if (!data) return reply(-1);
      data = JSON.parse(data);
      let ranking = 0;
      data.forEach((item, index) => {
        if (item.username == session.username) ranking = ++index;
      });
      reply(ranking > 100 ? '100+' : ranking);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};
