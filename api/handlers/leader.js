'use strict';
const Joi = require('joi');
const Boom = require('boom');
const JWT = require('jsonwebtoken');
const moment = require('moment-timezone');
const _ = require('lodash');
const config = require('../../config/config');
const pageSize = parseInt(process.env.DB_PAGE_SIZE);


/**
 * 搜索
 */
module.exports.search = {
  // auth: 'jwt',
  validate: {
    query: {
      page: Joi.number().integer().min(1).default(1),
      exchange: Joi.string().max(30),
      coin: Joi.string().max(30),
      bestWeek: Joi.number().integer().valid(1),
      risk: Joi.string().valid('low', 'high'),
      highProfit: Joi.number().integer().valid(1),
      highFollow: Joi.number().integer().valid(1),
      highActive: Joi.number().integer().valid(1),
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const Master_register = DB.getModel('master_register');
    const query = request.query;

    const session = request.headers.authorization ? JWT.decode(request.headers.authorization, process.env.JWT_SECRET) : null;
    const sql_isFollow = session ? `(select count(follow.id) from follow where follow.followUserId = master_register.activecode and follow.username = '${session.username}')` : `(0)`;

    let sql = `
    select 
      * ,
      ${sql_isFollow} as isFollow
    from master_register 
    where 
      1 = 1
      ${query.exchange ? `and find_in_set('${query.exchange}', tradedExchanges)` : ``} 
      ${query.coin ? `and find_in_set('${query.coin}', tradedCoins)` : ``} 
    order by
      id desc
      ${query.bestWeek ? `, profitRateFor1Week desc` : ``}
      ${query.risk ? `, riskIndex ${query.risk == 'low' ? '' : 'asc'}` : ``}
      ${query.highProfit ? `, profitRateFor3Month desc` : ``}
      ${query.highFollow ? `, fansInvestCount desc` : ``}
    limit ${--query.page * pageSize},${pageSize}
    `;

    let sql_count = `
    select count(*) as count
    from master_register 
    where 
      1 = 1
      ${query.exchange ? `and find_in_set('${query.exchange}', tradedExchanges)` : ``} 
      ${query.coin ? `and find_in_set('${query.coin}', tradedCoins)` : ``} 
    `;

    const response = {};

    Sequelize.query(sql).then(data => {
      data[0] = data[0].map(item => {
        item = _.pick(item, config.attributes.master_register.list.concat(['isFollow']));
        return item;
      });
      response.rows = data[0];
      //count
      return Sequelize.query(sql_count);
    }).then(data => {
      response.count = data[0][0].count;
      reply(response);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};

/**
 * 查询--首页推荐
 */
module.exports.queryForRecommend = {
  // auth: 'jwt',
  validate: {
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const Master_register = DB.getModel('master_register');
    const LeaderRecommend = DB.getModel('leaderRecommend');

    const session = request.headers.authorization ? JWT.decode(request.headers.authorization, process.env.JWT_SECRET) : null;
    const sql_isFollow = session ? `(select count(follow.id) from follow where follow.followUserId = master_register.activecode and follow.username = '${session.username}')` : `(0)`;

    LeaderRecommend.findAll({
      attributes: ['id', 'userId'],
      where: {type: 1},
      order: [['id', 'desc']],
      offset: 0,
      limit: 3
    }).then(data => {
      const array_userId = [];
      data.forEach(item => array_userId.push(item.userId));
      return Master_register.findAll({
        attributes: config.attributes.master_register.list.concat([
          [Sequelize.literal(sql_isFollow), 'isFollow']
        ]),
        where: {activecode: array_userId}
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
 * 查询--七日最佳
 */
module.exports.queryForBestWeek = {
  // auth: 'jwt',
  validate: {
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const Master_register = DB.getModel('master_register');
    const LeaderRecommend = DB.getModel('leaderRecommend');

    const session = request.headers.authorization ? JWT.decode(request.headers.authorization, process.env.JWT_SECRET) : null;
    const sql_isFollow = session ? `(select count(follow.id) from follow where follow.followUserId = master_register.activecode and follow.username = '${session.username}')` : `(0)`;

    LeaderRecommend.findAll({
      attributes: ['id', 'userId'],
      where: {type: 2},
      order: [['id', 'desc']],
      offset: 0,
      limit: pageSize
    }).then(data => {
      const array_userId = [];
      data.forEach(item => array_userId.push(item.userId));
      return Master_register.findAll({
        attributes: config.attributes.master_register.list.concat([
          [Sequelize.literal(sql_isFollow), 'isFollow']
        ]),
        where: {activecode: array_userId}
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
 * 查询--低风险
 */
module.exports.queryForLowRisk = {
  // auth: 'jwt',
  validate: {
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const Master_register = DB.getModel('master_register');
    const LeaderRecommend = DB.getModel('leaderRecommend');

    const session = request.headers.authorization ? JWT.decode(request.headers.authorization, process.env.JWT_SECRET) : null;
    const sql_isFollow = session ? `(select count(follow.id) from follow where follow.followUserId = master_register.activecode and follow.username = '${session.username}')` : `(0)`;

    LeaderRecommend.findAll({
      attributes: ['id', 'userId'],
      where: {type: 3},
      order: [['id', 'desc']],
      offset: 0,
      limit: pageSize
    }).then(data => {
      const array_userId = [];
      data.forEach(item => array_userId.push(item.userId));
      return Master_register.findAll({
        attributes: config.attributes.master_register.list.concat([
          [Sequelize.literal(sql_isFollow), 'isFollow']
        ]),
        where: {activecode: array_userId}
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
 * 查询--首页推荐
 */
module.exports.queryForMediumRisk = {
  // auth: 'jwt',
  validate: {
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const Master_register = DB.getModel('master_register');
    const LeaderRecommend = DB.getModel('leaderRecommend');

    const session = request.headers.authorization ? JWT.decode(request.headers.authorization, process.env.JWT_SECRET) : null;
    const sql_isFollow = session ? `(select count(follow.id) from follow where follow.followUserId = master_register.activecode and follow.username = '${session.username}')` : `(0)`;

    LeaderRecommend.findAll({
      attributes: ['id', 'userId'],
      where: {type: 4},
      order: [['id', 'desc']],
      offset: 0,
      limit: pageSize
    }).then(data => {
      const array_userId = [];
      data.forEach(item => array_userId.push(item.userId));
      return Master_register.findAll({
        attributes: config.attributes.master_register.list.concat([
          [Sequelize.literal(sql_isFollow), 'isFollow']
        ]),
        where: {activecode: array_userId}
      });
    }).then(data => {
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};
