'use strict';
const Joi = require('joi');
const Boom = require('boom');
const moment = require('moment-timezone');
const service_chargeAlipay = require('../../service/chargeAlipay');
const pageSize = parseInt(process.env.DB_PAGE_SIZE);

/**
 * 查询
 */
module.exports.query = {
  auth: 'jwt',
  validate: {
    query: {
      page: Joi.number().integer().min(1),
      status: Joi.number().integer().valid(0, 1, 2),
      tradeTime: Joi.string()
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const ChargeAlipay = DB.getModel('chargeAlipay');
    // const session = request.auth.credentials;
    const query = request.query;
    const offset = (query.page ? query.page - 1 : 0 ) * pageSize;

    const criteria = {};
    if (query.status != null) criteria.status = query.status;
    if (query.tradeTime != null) {
      //结束时间（指定日期第二天零点）
      let endTime = new Date(moment(new Date(moment(query.tradeTime)).getTime() + 24 * 3600000).format('YYYY-MM-DD'));
      //开始时间（指定日期零点）
      let startTime = new Date(moment(query.tradeTime).format('YYYY-MM-DD'));
      criteria.tradeTime = {
        $gte: startTime,
        $lt: endTime
      };
    }
    ChargeAlipay.findAndCountAll({
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
 * 搜索--用户名、支付宝帐号
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
    const ChargeAlipay = DB.getModel('chargeAlipay');
    // const session = request.auth.credentials;
    const query = request.query;
    const offset = (query.page ? query.page - 1 : 0 ) * pageSize;

    const criteria = {
      $or: [
        {otherAccountFullname: query.search},
        {otherAccountEmail: query.search}
      ]
    };
    ChargeAlipay.findAndCountAll({
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
 * 成功
 *
 * 把系统标记失败的充值记录修改为成功
 */
module.exports.success = {
  auth: 'jwt',
  validate: {
    params: {
      id: Joi.string().max(30).required()
    },
    payload: {
      orderid: Joi.string().max(30).required(),
      remarks: Joi.string().max(200).required()
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const ChargeAlipay = DB.getModel('chargeAlipay');
    // const session = request.auth.credentials;
    const params = request.params;
    const payload = request.payload;

    const criteria = {
      id: params.id
    };
    ChargeAlipay.findOne({
      where: criteria
    }).then(data => {
      if (!data) throw new Error('数据不存在');
      if (data.status == 1) throw new Error('已处理过了');

      return service_chargeAlipay.handleFailed(request.server, data, payload.orderid, payload.remarks);
    }).then(data => {
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};
