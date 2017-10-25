'use strict';
const Joi = require('joi');
const Boom = require('boom');
const moment = require('moment-timezone');
const pageSize = parseInt(process.env.DB_PAGE_SIZE);

/**
 * 查询
 */
module.exports.query = {
  auth: 'jwt',
  validate: {
    query: {
      page: Joi.number().integer().min(1)
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const Promotion = DB.getModel('promotion');
    // const session = request.auth.credentials;
    const query = request.query;
    const offset = (query.page ? query.page - 1 : 0 ) * pageSize;

    const criteria = {};
    Promotion.findAndCountAll({
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
 * 搜索--促销名称
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
    const Promotion = DB.getModel('promotion');
    // const session = request.auth.credentials;
    const query = request.query;
    const offset = (query.page ? query.page - 1 : 0 ) * pageSize;

    const criteria = {
      $or: [
        {title: query.search}
      ]
    };
    Promotion.findAndCountAll({
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
 * 查询（id）
 */
module.exports.queryById = {
  auth: 'jwt',
  validate: {
    params: {
      id: Joi.string().required()
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const Promotion = DB.getModel('promotion');
    // const session = request.auth.credentials;
    const params = request.params;

    const criteria = {id: params.id};

    //查询用户
    Promotion.findOne({
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
 * 修改
 */
module.exports.update = {
  auth: 'jwt',
  validate: {
    params: {
      id: Joi.string().required()
    },
    payload: {
      title: Joi.string().max(100).required(),
      doc: Joi.string().required()
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const Promotion = DB.getModel('promotion');
    // const session = request.auth.credentials;
    const params = request.params;
    const payload = request.payload;


    const criteria = {id: params.id};

    //查询用户
    Promotion.update(payload, {
      where: criteria
    }).then(data => {
      if (data[0] != 1) throw Boom.badRequest('促销不存在');
      return Promotion.findOne({
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


const doc = {
  on: {
    title: '开起促销',
    value: 0
  },
  rate: {
    title: '奖金比例',
    value: 0.002
  },
  count: {
    title: '奖金次数/人/天',
    value: 4
  },
  bonus: {
    title: '奖金金额/人/天',
    value: 200
  },
  amount: {
    title: '最低成交金额',
    value: 1000
  }
}
console.log(JSON.stringify(doc))
