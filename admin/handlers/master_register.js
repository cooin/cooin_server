'use strict';
const Joi = require('joi');
const Boom = require('boom');
const moment = require('moment-timezone');
const service_master_register = require('../../service/master_register');
const pageSize = parseInt(process.env.DB_PAGE_SIZE);

/**
 * 查询
 */
module.exports.query = {
  auth: 'jwt',
  validate: {
    query: {
      page: Joi.number().integer().min(1),
      order: Joi.string().valid('id', 'rmb_balance', 'btc_balance', 'bt2_balance', 'bt3_balance', 'total').default('id'),
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
    const query = request.query;
    const order = query.order;
    const offset = (query.page ? query.page - 1 : 0 ) * pageSize;

    let data_master_register, data_orderlist_bid;

    const sql_total = `cast(
      sum(
        (rmb_balance + rmb_balance_f) + 
        (btc_balance + btc_balance_f) * (select lastprice from realtimeprice where currencytype = 1 limit 1) + 
        (bt2_balance + bt2_balance_f) * (select lastprice from realtimeprice where currencytype = 2 limit 1) + 
        (bt3_balance + bt3_balance_f) * (select lastprice from realtimeprice where currencytype = 3 limit 1)
      )
      as decimal(11, 2))`;

    const criteria = {
      realname: {$ne: '体验用户'}
    };
    // if (query.status != null) criteria.status = query.status;
    // if (query.tradeTime != null) {
    //   //结束时间（指定日期第二天零点）
    //   let endTime = new Date(moment(new Date(moment(query.tradeTime)).getTime() + 24 * 3600000).format('YYYY-MM-DD'));
    //   //开始时间（指定日期零点）
    //   let startTime = new Date(moment(query.tradeTime).format('YYYY-MM-DD'));
    //   criteria.tradeTime = {
    //     $gte: startTime,
    //     $lt: endTime
    //   };
    // }
    //查询用户
    Master_register.findAndCountAll({
      raw: true,
      attributes: [
        '*',
        [Sequelize.literal(sql_total), 'total']
      ],
      where: criteria,
      group: 'id',
      order: [
        [order == 'total' ? Sequelize.literal(sql_total) : order, 'DESC']
      ],
      offset: offset,
      limit: pageSize
    }).then(data => {
      data_master_register = data;
      data_master_register.count = data_master_register.count.length;

      //统计用户各个钱包委托数量
      let array_username = [];
      data_master_register.rows.forEach(master_register => {
        array_username.push(master_register.username);
      });
      return Orderlist_bid.findAll({
        attributes: [
          'username',
          'moneyfrom',
          [Sequelize.fn('SUM', 1), 'count']
        ],
        group: ['username', 'moneyfrom'],
        raw: true,
        where: {
          username: array_username
        }
      });
    }).then(data => {
      data_orderlist_bid = data;

      data_master_register.rows.forEach((master_register, index) => {
        data_orderlist_bid.forEach(orderlist_bid => {
          if (master_register.username != orderlist_bid.username) return;
          if (orderlist_bid.moneyfrom == 'w') data_master_register.rows[index].orderCountForW = orderlist_bid.count;
          if (orderlist_bid.moneyfrom == 'c') data_master_register.rows[index].orderCountForC = orderlist_bid.count;
        });
      });
      reply(data_master_register);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};

/**
 * 搜索
 */
module.exports.search = {
  auth: 'jwt',
  validate: {
    query: {
      page: Joi.number().integer().min(1),
      search: Joi.string().required().max(50)
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
    const query = request.query;
    const offset = (query.page ? query.page - 1 : 0 ) * pageSize;

    let data_master_register, data_orderlist_bid;

    const criteria = {
      $or: [
        {username: query.search},
        {realname: query.search}
      ]
    };
    //查询用户
    Master_register.findAndCountAll({
      where: criteria,
      order: [
        ['id', 'DESC']
      ],
      offset: offset,
      limit: pageSize
    }).then(data => {
      data_master_register = JSON.parse(JSON.stringify(data));

      //统计用户各个钱包委托数量
      let array_username = [];
      data_master_register.rows.forEach(master_register => {
        array_username.push(master_register.username);
      });
      return Orderlist_bid.findAll({
        attributes: [
          'username',
          'moneyfrom',
          [Sequelize.fn('SUM', 1), 'count']
        ],
        group: ['username', 'moneyfrom'],
        raw: true,
        where: {
          username: array_username
        }
      });
    }).then(data => {
      data_orderlist_bid = data;

      data_master_register.rows.forEach((master_register, index) => {
        data_orderlist_bid.forEach(orderlist_bid => {
          if (master_register.username != orderlist_bid.username) return;
          if (orderlist_bid.moneyfrom == 'w') data_master_register.rows[index].orderCountForW = orderlist_bid.count;
          if (orderlist_bid.moneyfrom == 'c') data_master_register.rows[index].orderCountForC = orderlist_bid.count;
        });
      });
      reply(data_master_register);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};

/**
 * 聚合--某个时间段的数据
 */
module.exports.aggregation = {
  auth: 'jwt',
  validate: {
    query: {
      startTime: Joi.string().required(),
      endTime: Joi.string().required(),
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    // const session = request.auth.credentials;
    const query = request.query;

    Sequelize.query(`
    select 
      str_to_date(joindate, '%Y%m%d') as joindate, 
      count(id) as count, 
      sum(case realname when '' then 0 else 1 end) as realNameCount 
      from master_register 
      where
        realname != '体验用户'
        and lastlogintime != ''
        and joindate >= '${moment(query.startTime).format('YYYYMMDDHHmm')}'
        and joindate < '${moment(moment(new Date(moment(query.endTime)).getTime() + 24 * 3600000).format('YYYY-MM-DD')).format('YYYYMMDDHHmm')}'
      group by str_to_date(joindate, '%Y%m%d')
      order by str_to_date(joindate, '%Y%m%d') desc`
    ).then(data => {
      reply(data[0]);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};

/**
 * 聚合--所有数据
 */
module.exports.aggregationAll = {
  // auth: 'jwt',
  validate: {
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    // const session = request.auth.credentials;
    // const query = request.query;

    Sequelize.query(`
    select
      count(id) as count,
      sum(case realname when '' then 0 else 1 end) as realNameCount,
      sum(subscribe) as subscribeCount
      from master_register 
      where
        realname != '体验用户'
        and lastlogintime != ''`
    ).then(data => {
      reply(data[0][0]);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};

/**
 * 查询（username）
 */
module.exports.queryByUsername = {
  auth: 'jwt',
  validate: {
    params: {
      username: Joi.string().required()
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

    const criteria = {username: params.username};

    //查询用户
    Master_register.findOne({
      where: criteria
    }).then(data => {
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};

/**
 * 聚合用户相同IP数量，身份证，注册IP
 */
module.exports.aggregationIP = {
  auth: 'jwt',
  validate: {
    query: {
      username: Joi.string().required()
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const Master_register = DB.getModel('master_register');
    // const session = request.auth.credentials;
    const query = request.query;

    const criteria = {
      username: query.username.split(',')
    };
    //查询用户
    Master_register.findAll({
      raw: true,
      attributes: [
        'username',
        'regip',
        'idcard',
        [Sequelize.fn('COUNT', Sequelize.col('regip')), 'IPCount']
      ],
      where: criteria,
      group: 'username'
    }).then(data => {
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};

/**
 * 查询相同IP数量
 */
module.exports.queryIPCountByUsername = {
  auth: 'jwt',
  validate: {
    params: {
      username: Joi.string().required()
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

    let master_register;

    const criteria = {
      username: params.username
    };
    //查询用户
    Master_register.findOne({
      raw: true,
      attributes: ['username', 'regip', 'idcard'],
      where: criteria
    }).then(data => {
      master_register = data ? data : {};
      if (!data) return Promise.resolve(0);
      return Master_register.count({
        where: {
          regip: data.regip,
          username: {$notLike: 'demo%'}
        }
      });
    }).then(data => {
      master_register.IPCount = data;
      reply(master_register);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};

/**
 * 修改
 *
 * 目前该接口仅供内部使用
 * 不做任何参数校验
 */
module.exports.update = {
  auth: 'jwt',
  validate: {
    params: {
      username: Joi.string().required()
    },
    payload: {},
    options: {
      allowUnknown: true
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const Master_register = DB.getModel('master_register');
    // const session = request.auth.credentials;
    const params = request.params;
    const payload = request.payload;

    //lastdealdate不更新
    delete payload.lastdealdate;
    delete payload.howmanydeal;

    const criteria = {username: params.username};

    //查询用户
    Master_register.update(payload, {
      where: criteria
    }).then(data => {
      if (data[0] != 1) throw Boom.badRequest('用户不存在');
      return Master_register.findOne({
        where: criteria
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
 * 禁言
 */
module.exports.silent = {
  auth: 'jwt',
  validate: {
    params: {
      username: Joi.string().required()
    },
    payload: {
      silentAt: Joi.date().required()
    },
    options: {
      allowUnknown: true
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const Master_register = DB.getModel('master_register');
    // const session = request.auth.credentials;
    const params = request.params;
    const payload = request.payload;

    service_master_register.setSilentAt(params.username, payload.silentAt).then(() => {
      reply();
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};
