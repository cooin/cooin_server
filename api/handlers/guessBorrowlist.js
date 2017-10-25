'use strict';
const Joi = require('joi');
const Boom = require('boom');
const moment = require('moment-timezone');
const config = require('../../config/config');
const util_string = require('../../lib/string');
const pageSize = parseInt(process.env.DB_PAGE_SIZE);

/**
 * 保存（竞猜）
 *
 * 默认竞猜当前进行中的竞赛活动
 * 每天每人限一次机会
 */
module.exports.save = {
  auth: 'jwt',
  validate: {
    payload: {
      amount: Joi.number().required(),
      message: Joi.string().max(50)
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const GuessBorrowlist = DB.getModel('guessBorrowlist');
    const Borrowlist = DB.getModel('borrowlist');
    const session = request.auth.credentials;
    const payload = request.payload;

    if (/^demo.*/.test(session.username)) reply(Boom.badRequest('体验帐号不能竞猜'));

    const array_dirtyWord = ['妈', '娘', 'fuck', 'sb', 'ma', '草', '操', 'cao', '骗', '傻', '驴', 'bi', 'sha'];
    array_dirtyWord.forEach(item => {
      payload.message = payload.message.replace(item, '');
    });

    //查询当前进行的竞赛钱包期数
    Borrowlist.findOne({
      attributes: ['period', 'returntime'],
      where: {
        borrowtype: 2,
        status: 2
      }
    }).then(data => {
      if (!data) throw Boom.badRequest('当前没有进行中的活动');

      //活动结束前两小时不得参与竞猜
      const endTime = new Date(moment(data.returntime, 'YYYYMMDDHHmm')).getTime();
      if (Date.now() + 2 * 3600000 > endTime) throw Boom.badRequest('竞猜已结束');

      const period = data.period;

      return GuessBorrowlist.findOrCreate({
        where: {
          period: period,
          $or: [
            //今天已竞猜过
            {
              username: session.username,
              createdAt: {$gte: new Date(moment(moment().format('YYYY-MM-DD')))}
            },
            //竞猜数额不能是已经被竞猜过的
            {
              amount: payload.amount
            }
          ]
        },
        defaults: {
          username: session.username,
          period: period,
          amount: payload.amount,
          message: payload.message
        }
      });
    }).then(data => {
      if (data[1]) {
        data[0].username = util_string.hidePhoneNumber(data[0].username);
        return reply(data[0]);
      }
      if (data[0].username == session.username) throw Boom.badRequest('明天再来吧');
      throw Boom.badRequest('概数额已经被人猜过了');
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};

/**
 * 查询--根据期数
 */
module.exports.queryByPeriod = {
  // auth: 'jwt',
  validate: {
    query: {
      period: Joi.number().integer().required(),
      page: Joi.number().integer().min(1)
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const GuessBorrowlist = DB.getModel('guessBorrowlist');
    const query = request.query;
    const offset = (query.page ? query.page - 1 : 0 ) * pageSize;

    const criteria = {period: query.period};
    GuessBorrowlist.findAndCountAll({
      where: criteria,
      order: [
        ['id', 'DESC']
      ],
      offset: offset,
      limit: pageSize
    }).then(data => {
      data.rows = data.rows.map(item => {
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
 * 查询--根据期数--当前用户
 */
module.exports.queryByPeriodForCurrentUser = {
  auth: 'jwt',
  validate: {
    query: {
      period: Joi.number().integer().required(),
      page: Joi.number().integer().min(1)
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const GuessBorrowlist = DB.getModel('guessBorrowlist');
    const session = request.auth.credentials;
    const query = request.query;
    const offset = (query.page ? query.page - 1 : 0 ) * pageSize;

    const criteria = {
      period: query.period,
      username: session.username
    };
    GuessBorrowlist.findAndCountAll({
      where: criteria,
      order: [
        ['id', 'DESC']
      ],
      offset: offset,
      limit: pageSize
    }).then(data => {
      data.rows = data.rows.map(item => {
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
 * 查询--当前所剩竞猜次数
 */
module.exports.queryLeftGuessCount = {
  auth: 'jwt',
  validate: {
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const GuessBorrowlist = DB.getModel('guessBorrowlist');
    const Borrowlist = DB.getModel('borrowlist');
    const session = request.auth.credentials;

    if (/^demo.*/.test(session.username)) reply(0);

    //查询当前进行的竞赛钱包期数
    Borrowlist.findOne({
      attributes: ['period'],
      where: {
        borrowtype: 2,
        status: 2
      }
    }).then(data => {
      if (!data) throw Boom.badRequest('当前没有进行中的活动');

      const period = data.period;

      return GuessBorrowlist.count({
        where: {
          period: period,
          username: session.username,
          createdAt: {$gte: new Date(moment(moment().format('YYYY-MM-DD')))}
        }
      });
    }).then(data => {
      data = data > 0 ? 0 : 1;
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};

/**
 * 查询--中奖人--根据期数
 */
module.exports.queryWinnersByPeriod = {
  // auth: 'jwt',
  validate: {
    query: {
      period: Joi.number().integer().required()
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const GuessBorrowlist = DB.getModel('guessBorrowlist');
    const Borrowlist = DB.getModel('borrowlist');
    const query = request.query;

    const criteria = {period: query.period};

    //查询当前期数的总资产第一名
    Borrowlist.findOne({
      where: criteria,
      order: [['rmb_balance', 'DESC']]
    }).then(data => {
      if (!data) throw Boom.badRequest('活动不存在');
      if (data.status == 2) throw Boom.badRequest('活动还未结束');

      //查询竞猜数额差值最小前三
      return GuessBorrowlist.findAll({
        raw: true,
        attributes: [
          'username',
          'amount',
          [Sequelize.literal(`cast(ABS(amount - ${data.rmb_balance}) as decimal(11, 2))`), 'difference']
        ],
        where: criteria,
        group: 'id',
        order: [
          [Sequelize.literal(`cast(ABS(amount - ${data.rmb_balance}) as decimal(11, 2))`), 'ASC'],
          ['id', 'ASC']
        ],
        limit: 3
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
