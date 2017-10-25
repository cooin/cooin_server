'use strict';
const Joi = require('joi');
const Boom = require('boom');
const moment = require('moment-timezone');
const service_orderlist = require('../../service/orderlist');
const ORDER_ROBOT_QUANTITY_BTC = process.env.ORDER_ROBOT_QUANTITY_BTC.split(',');
const ORDER_ROBOT_QUANTITY_LTC = process.env.ORDER_ROBOT_QUANTITY_LTC.split(',');
const pageSize = parseInt(process.env.DB_PAGE_SIZE);

/**
 * 查询
 */
module.exports.query = {
  auth: 'jwt',
  validate: {
    query: {
      page: Joi.number().integer().min(1),
      fundinstatus: Joi.string().valid('wait', 'fail', 'succ'),
      paymode: Joi.string().valid('alipay', 'bank'),
      currencytype: Joi.number().integer().valid(0, 1, 2),
      orderdate: Joi.string()
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const Orderlist = DB.getModel('orderlist');
    // const session = request.auth.credentials;
    const query = request.query;
    const offset = (query.page ? query.page - 1 : 0 ) * pageSize;

    const criteria = {};
    if (query.fundinstatus != null) criteria.fundinstatus = query.fundinstatus;
    if (query.paymode != null) criteria.paymode = query.paymode;
    if (query.currencytype != null) criteria.currencytype = query.currencytype;
    if (query.orderdate != null) criteria.orderdate = moment(query.orderdate).format('YYYYMMDD');
    service_orderlist.queryAttachBank(request.server, {
      where: criteria,
      order: [
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
 * 查询--用户名
 */
module.exports.queryByUsername = {
  auth: 'jwt',
  validate: {
    params: {
      username: Joi.string().required()
    },
    query: {
      page: Joi.number().integer().min(1),
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const Orderlist = DB.getModel('orderlist');
    // const session = request.auth.credentials;
    const params = request.params;
    const query = request.query;
    const offset = (query.page ? query.page - 1 : 0 ) * pageSize;

    const criteria = {
      username: params.username
    };
    service_orderlist.queryAttachBank(request.server, {
      where: criteria,
      order: [
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
    const Orderlist = DB.getModel('orderlist');
    // const session = request.auth.credentials;
    const query = request.query;

    const criteria = {
      fundinstatus: 'succ',
      orderdatedetail: {
        $gte: moment(query.startTime).format('YYYYMMDDHHmm'),
        $lte: moment(query.endTime).format('YYYYMMDDHHmm')
      },
      $or: [
        {
          currencytype: 1,
          username: {$ne: '13651855519'}
        },
        {
          currencytype: {$ne: 1}
        }
      ]
    };
    Orderlist.findAll({
      attributes: [
        'currencytype',
        [Sequelize.fn('SUM', Sequelize.col('total')), 'total']
      ],
      group: 'currencytype',
      raw: true,
      where: criteria
    }).then(data => {
      data.forEach(item => {
        if (item.currencytype == 0) item.total = Number(item.total).toFixed(2);
        if (item.currencytype == 1) item.total = Number(item.total).toFixed(ORDER_ROBOT_QUANTITY_BTC[2]);
        if (item.currencytype == 2) item.total = Number(item.total).toFixed(ORDER_ROBOT_QUANTITY_LTC[2]);
      });
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};

/**
 * 聚合--某个用户的数据
 */
module.exports.aggregationByUsername = {
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
    const Orderlist = DB.getModel('orderlist');
    // const session = request.auth.credentials;
    const params = request.params;

    const criteria = {
      fundinstatus: 'succ',
      username: params.username
    };
    Orderlist.findAll({
      attributes: [
        'currencytype',
        [Sequelize.fn('SUM', Sequelize.col('total')), 'total']
      ],
      group: 'currencytype',
      raw: true,
      where: criteria
    }).then(data => {
      data.forEach(item => {
        if (item.currencytype == 0) item.total = Number(item.total).toFixed(2);
        if (item.currencytype == 1) item.total = Number(item.total).toFixed(ORDER_ROBOT_QUANTITY_BTC[2]);
        if (item.currencytype == 2) item.total = Number(item.total).toFixed(ORDER_ROBOT_QUANTITY_LTC[2]);
      });
      reply(data);
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
    const Orderlist = DB.getModel('orderlist');
    const Bankaccount = DB.getModel('bankaccount');
    // const session = request.auth.credentials;
    const query = request.query;
    const offset = (query.page ? query.page - 1 : 0 ) * pageSize;

    const criteria = {
      $or: [
        {orderid: query.search},
        {username: query.search},
        {depositsource: query.search},
        {alipayrealname: query.search},
        {total: query.search},
        {codea: query.search}
      ]
    };
    //查询银行卡（搜索的内容可能是银行卡号）
    Bankaccount.findOne({
      where: {
        accountnumber: query.search
      }
    }).then(data => {
      if (data) criteria.$or.push({depositsource: data.id});
      return service_orderlist.queryAttachBank(request.server, {
        where: criteria,
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
 * 成功
 *
 * 仅在系统自动处理充值失败（自动查询出错）时，给管理人员手动调用
 */
module.exports.success = {
  auth: 'jwt',
  validate: {
    params: {
      orderid: Joi.string().max(30).required()
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const Orderlist = DB.getModel('orderlist');
    // const session = request.auth.credentials;
    const params = request.params;

    const criteria = {
      orderid: params.orderid
    };
    Orderlist.findOne({
      where: criteria
    }).then(data => {
      if (!data) throw new Error('数据不存在');
      if (data.fundinstatus != 'wait') throw new Error('已处理过了');

      return service_orderlist.handle(request.server, data);
    }).then(data => {
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};
