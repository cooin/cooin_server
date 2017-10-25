'use strict';
const Joi = require('joi');
const Boom = require('boom');
const moment = require('moment-timezone');
const fs = require('fs');
const config = require('../../config/config');
const util_IDGenerator = require('../../lib/IDGenerator');
const service_applywithdraw = require('../../service/applywithdraw');
const ORDER_ROBOT_QUANTITY_BTC = process.env.ORDER_ROBOT_QUANTITY_BTC.split(',');
const ORDER_ROBOT_QUANTITY_LTC = process.env.ORDER_ROBOT_QUANTITY_LTC.split(',');
const pageSize = parseInt(process.env.DB_PAGE_SIZE);

/**
 * 查询
 *
 * 附带银行信息
 */
module.exports.query = {
  auth: 'jwt',
  validate: {
    query: {
      page: Joi.number().integer().min(1),
      status: Joi.number().integer().min(0).max(5),
      currencytype: Joi.number().integer().valid(0, 1, 2),
      applydate: Joi.string()
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const Applywithdraw = DB.getModel('applywithdraw');
    const Bankaccount = DB.getModel('bankaccount');
    // const session = request.auth.credentials;
    const query = request.query;
    const offset = (query.page ? query.page - 1 : 0 ) * pageSize;

    const criteria = {};
    if (query.status != null) criteria.pay = query.status;
    if (query.currencytype != null) criteria.currencytype = query.currencytype;
    if (query.applydate) criteria.applydate = {$lte: moment(query.applydate).format('YYYYMMDDHHmm')};

    let data_applywithdraw, data_bankaccount;
    //查询提现记录
    Applywithdraw.findAndCountAll({
      where: criteria,
      order: [
        ['id', 'DESC']
      ],
      offset: offset,
      limit: pageSize
    }).then(data => {
      data_applywithdraw = JSON.parse(JSON.stringify(data));

      //查询银行卡信息
      let array_bankId = [];
      data_applywithdraw.rows.forEach(item => {
        array_bankId.push(item.payinfo);
      });
      return Bankaccount.findAll({
        where: {
          id: {$in: array_bankId}
        }
      });
    }).then(data => {
      data_bankaccount = data;

      data_applywithdraw.rows.forEach((applywithdraw, index) => {
        data_bankaccount.forEach(bankaccount => {
          if (applywithdraw.payinfo == bankaccount.id) data_applywithdraw.rows[index].bank = bankaccount;
        });
      });
      reply(data_applywithdraw);
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
    const Applywithdraw = DB.getModel('applywithdraw');
    const Bankaccount = DB.getModel('bankaccount');
    // const session = request.auth.credentials;
    const params = request.params;
    const query = request.query;
    const offset = (query.page ? query.page - 1 : 0 ) * pageSize;

    const criteria = {
      username: params.username
    };
    let data_applywithdraw, data_bankaccount;
    //查询提现记录
    Applywithdraw.findAndCountAll({
      where: criteria,
      order: [
        ['id', 'DESC']
      ],
      offset: offset,
      limit: pageSize
    }).then(data => {
      data_applywithdraw = JSON.parse(JSON.stringify(data));

      //查询银行卡信息
      let array_bankId = [];
      data_applywithdraw.rows.forEach(item => {
        array_bankId.push(item.payinfo);
      });
      return Bankaccount.findAll({
        where: {
          id: {$in: array_bankId}
        }
      });
    }).then(data => {
      data_bankaccount = data;

      data_applywithdraw.rows.forEach((applywithdraw, index) => {
        data_bankaccount.forEach(bankaccount => {
          if (applywithdraw.payinfo == bankaccount.id) data_applywithdraw.rows[index].bank = bankaccount;
        });
      });
      reply(data_applywithdraw);
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
    const Applywithdraw = DB.getModel('applywithdraw');
    // const session = request.auth.credentials;
    const query = request.query;

    const criteria = {
      pay: 4,
      applydate: {
        $gte: moment(query.startTime).format('YYYYMMDDHHmm'),
        $lte: moment(query.endTime).format('YYYYMMDDHHmm')
      }
    };
    Applywithdraw.findAll({
      attributes: [
        'currencytype',
        [Sequelize.fn('SUM', Sequelize.col('shiji')), 'total']
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
 * 聚合--所有未提现总金额
 */
module.exports.aggregationForNotWithdraw = {
  auth: 'jwt',
  validate: {
    query: {
      applydate: Joi.string()
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const Applywithdraw = DB.getModel('applywithdraw');
    // const session = request.auth.credentials;
    const query = request.query;

    const criteria = {
      pay: 0
    };
    if (query.applydate) criteria.applydate = {$lte: moment(query.applydate).format('YYYYMMDDHHmm')}
    Applywithdraw.findAll({
      attributes: [
        'currencytype',
        [Sequelize.fn('SUM', Sequelize.col('shiji')), 'total'],
        [Sequelize.fn('COUNT', 1), 'count']
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
    const Applywithdraw = DB.getModel('applywithdraw');
    // const session = request.auth.credentials;
    const params = request.params;

    const criteria = {
      pay: [0, 4],
      username: params.username
    };
    Applywithdraw.findAll({
      attributes: [
        'currencytype',
        [Sequelize.fn('SUM', Sequelize.col('shiji')), 'total']
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
 * 搜索--用户名、提现号
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
    const Applywithdraw = DB.getModel('applywithdraw');
    const Bankaccount = DB.getModel('bankaccount');
    // const session = request.auth.credentials;
    const query = request.query;
    const offset = (query.page ? query.page - 1 : 0 ) * pageSize;

    const criteria = {
      $or: [
        {username: query.search},
        {rcashname: query.search},
        {applypayid: query.search}
      ]
    };
    let data_applywithdraw, data_bankaccount;
    //查询提现记录
    Applywithdraw.findAndCountAll({
      where: criteria,
      order: [
        ['id', 'DESC']
      ],
      offset: offset,
      limit: pageSize
    }).then(data => {
      data_applywithdraw = JSON.parse(JSON.stringify(data));

      //查询银行卡信息
      let array_bankId = [];
      data_applywithdraw.rows.forEach(item => {
        array_bankId.push(item.payinfo);
      });
      return Bankaccount.findAll({
        where: {
          id: {$in: array_bankId}
        }
      });
    }).then(data => {
      data_bankaccount = data;

      data_applywithdraw.rows.forEach((applywithdraw, index) => {
        data_bankaccount.forEach(bankaccount => {
          if (applywithdraw.payinfo == bankaccount.id) data_applywithdraw.rows[index].bank = bankaccount;
        });
      });
      reply(data_applywithdraw);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};

/**
 * 审核不通过
 *
 * 我的钱包资金修改
 * 修改提现（处理中）的状态为提现（失败）
 * 插入资金变动明细
 * 改变提现状态（1）
 */
module.exports.checkNotPass = {
  auth: 'jwt',
  validate: {
    params: {
      applypayid: Joi.string().max(30).required()
    },
    payload: {
      remarks: Joi.string().max(200).required()
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const Applywithdraw = DB.getModel('applywithdraw');
    const Master_register = DB.getModel('master_register');
    const Fund_in_out = DB.getModel('fund_in_out');
    // const session = request.auth.credentials;
    const params = request.params;
    const payload = request.payload;

    let applywithdraw;

    //查询
    Applywithdraw.findOne({
      where: {
        applypayid: params.applypayid,
        pay: 0
      }
    }).then(data => {
      if (!data) throw new Error('数据不存在');

      applywithdraw = data;

      //事务
      return Sequelize.transaction(t => {

        /**
         * 我的钱包资金修改
         */
        return Master_register.update({
          rmb_balance: Sequelize.literal(`cast(rmb_balance + ${applywithdraw.money} as decimal(11, 2))`)
        }, {
          where: {username: applywithdraw.username},
          transaction: t
        }).then(data => {
          if (data[0] != 1) throw new Error('操作失败');

          /**
           * 修改提现（处理中）的状态为提现（失败）
           */
          return Fund_in_out.update({
            fundmoneystatus: 'drawfail'
          }, {
            where: {
              username: applywithdraw.username,
              orderid: applywithdraw.applypayid,
              fundmoneystatus: 'outdeal'
            },
            transaction: t
          });
        }).then(data => {
          if (data[0] != 1) throw new Error('操作失败');

          //获取流水号
          return util_IDGenerator.get('fund_in_out');
        }).then(id => {

          /**
           * 插入资金变动明细
           */
          let fundDoc = {
            transNumber: id,
            username: applywithdraw.username,
            orderid: 0,
            fundmoneystatus: 'cancelfordrawout',
            curr_type: applywithdraw.currencytype,
            addorminus: 'add',
            actiondate: moment().format('YYYYMMDD'),
            paymode: 0,
            borrowid: applywithdraw.applypayid,
            price: 0,
            quantity: 0,
            money: applywithdraw.money
          };
          return Fund_in_out.create(fundDoc, {transaction: t});
        }).then(data => {

          /**
           * 改变提现状态（1）
           */
          return Applywithdraw.update({
            pay: 1,
            admintxt: payload.remarks
          }, {
            where: {
              applypayid: params.applypayid,
              pay: 0
            },
            transaction: t
          });
        });
      });
    }).then(data => {
      //事务结束

      return Applywithdraw.findOne({
        where: {applypayid: params.applypayid}
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
 * 处理中
 */
module.exports.handling = {
  auth: 'jwt',
  validate: {
    params: {
      applypayid: Joi.string().max(30).required()
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const Applywithdraw = DB.getModel('applywithdraw');
    // const session = request.auth.credentials;
    const params = request.params;

    const criteria = {
      applypayid: params.applypayid,
      pay: 0
    };
    Applywithdraw.update({
      pay: 2
    }, {
      where: criteria
    }).then(data => {
      if (data[0] != 1) throw new Error('操作失败');

      return Applywithdraw.findOne({
        where: {applypayid: params.applypayid}
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
 * 失败
 *
 * 我的钱包资金修改
 * 修改提现（处理中）的状态为提现（失败）
 * 插入资金变动明细
 * 改变提现状态（3）
 */
module.exports.failure = {
  auth: 'jwt',
  validate: {
    params: {
      applypayid: Joi.string().max(30).required()
    },
    payload: {
      remarks: Joi.string().max(200).required()
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const Applywithdraw = DB.getModel('applywithdraw');
    const Master_register = DB.getModel('master_register');
    const Fund_in_out = DB.getModel('fund_in_out');
    // const session = request.auth.credentials;
    const params = request.params;
    const payload = request.payload;

    let applywithdraw;

    //查询
    Applywithdraw.findOne({
      where: {
        applypayid: params.applypayid,
        pay: {$in: [0, 2]}
      }
    }).then(data => {
      if (!data) throw new Error('数据不存在');

      applywithdraw = data;

      //事务
      return Sequelize.transaction(t => {

        /**
         * 我的钱包资金修改
         */
        return Master_register.update({
          rmb_balance: Sequelize.literal(`cast(rmb_balance + ${applywithdraw.money} as decimal(11, 2))`)
        }, {
          where: {username: applywithdraw.username},
          transaction: t
        }).then(data => {
          if (data[0] != 1) throw new Error('操作失败');

          /**
           * 修改提现（处理中）的状态为提现（失败）
           */
          return Fund_in_out.update({
            fundmoneystatus: 'drawfail'
          }, {
            where: {
              username: applywithdraw.username,
              orderid: applywithdraw.applypayid,
              fundmoneystatus: 'outdeal'
            },
            transaction: t
          });
        }).then(data => {
          if (data[0] != 1) throw new Error('操作失败');

          //获取流水号
          return util_IDGenerator.get('fund_in_out');
        }).then(id => {

          /**
           * 插入资金变动明细
           */
          let fundDoc = {
            transNumber: id,
            username: applywithdraw.username,
            orderid: 0,
            fundmoneystatus: 'cancelfordrawout',
            curr_type: applywithdraw.currencytype,
            addorminus: 'add',
            actiondate: moment().format('YYYYMMDD'),
            paymode: 0,
            borrowid: applywithdraw.applypayid,
            price: 0,
            quantity: 0,
            money: applywithdraw.money
          };
          return Fund_in_out.create(fundDoc, {transaction: t});
        }).then(data => {

          /**
           * 改变提现状态（3）
           */
          return Applywithdraw.update({
            pay: 3,
            admintxt: payload.remarks
          }, {
            where: {
              applypayid: params.applypayid,
              pay: {$in: [0, 2]}
            },
            transaction: t
          });
        });
      });
    }).then(data => {
      //事务结束

      return Applywithdraw.findOne({
        where: {applypayid: params.applypayid}
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
 * 失败（成功后修改为失败）
 *
 * 我的钱包资金修改
 * 插入资金变动明细
 * 改变提现状态（3）
 */
module.exports.failureAfterSuccess = {
  auth: 'jwt',
  validate: {
    params: {
      applypayid: Joi.string().max(30).required()
    },
    payload: {
      remarks: Joi.string().max(200).required()
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const Applywithdraw = DB.getModel('applywithdraw');
    const Master_register = DB.getModel('master_register');
    const Fund_in_out = DB.getModel('fund_in_out');
    // const session = request.auth.credentials;
    const params = request.params;
    const payload = request.payload;

    let applywithdraw;

    //查询
    Applywithdraw.findOne({
      where: {
        applypayid: params.applypayid,
        pay: 4
      }
    }).then(data => {
      if (!data) throw new Error('数据不存在');

      applywithdraw = data;

      //事务
      return Sequelize.transaction(t => {

        /**
         * 我的钱包资金修改
         */
        return Master_register.update({
          rmb_balance: Sequelize.literal(`cast(rmb_balance + ${applywithdraw.money} as decimal(11, 2))`)
        }, {
          where: {username: applywithdraw.username},
          transaction: t
        }).then(data => {
          if (data[0] != 1) throw new Error('操作失败');

          //获取流水号
          return util_IDGenerator.get('fund_in_out');
        }).then(id => {

          /**
           * 插入资金变动明细
           */
          let fundDoc = {
            transNumber: id,
            username: applywithdraw.username,
            orderid: 0,
            fundmoneystatus: 'cancelfordrawout',
            curr_type: applywithdraw.currencytype,
            addorminus: 'add',
            actiondate: moment().format('YYYYMMDD'),
            paymode: 0,
            borrowid: applywithdraw.applypayid,
            price: 0,
            quantity: 0,
            money: applywithdraw.money
          };
          return Fund_in_out.create(fundDoc, {transaction: t});
        }).then(data => {

          /**
           * 改变提现状态（3）
           */
          return Applywithdraw.update({
            pay: 3,
            admintxt: payload.remarks
          }, {
            where: {
              applypayid: params.applypayid,
              pay: 4
            },
            transaction: t
          });
        });
      });
    }).then(data => {
      //事务结束

      return Applywithdraw.findOne({
        where: {applypayid: params.applypayid}
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
 * 修改提现（处理中）的状态为提现（成功）
 * 改变提现状态（4）
 */
module.exports.success = {
  auth: 'jwt',
  validate: {
    params: {
      applypayid: Joi.string().max(30).required()
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const Applywithdraw = DB.getModel('applywithdraw');
    const Fund_in_out = DB.getModel('fund_in_out');
    // const session = request.auth.credentials;
    const params = request.params;

    let applywithdraw;

    //查询
    Applywithdraw.findOne({
      where: {
        applypayid: params.applypayid,
        pay: {$in: [0, 2]}
      }
    }).then(data => {
      if (!data) throw new Error('数据不存在');

      applywithdraw = data;

      //事务
      return Sequelize.transaction(t => {

        /**
         * 修改提现（处理中）的状态为提现（成功）
         */
        return Fund_in_out.update({
          fundmoneystatus: 'out'
        }, {
          where: {
            username: applywithdraw.username,
            orderid: applywithdraw.applypayid,
            fundmoneystatus: 'outdeal'
          },
          transaction: t
        }).then(data => {
          if (data[0] != 1) throw new Error('操作失败');

          /**
           * 改变提现状态（4）
           */
          return Applywithdraw.update({
            pay: 4
          }, {
            where: {
              applypayid: params.applypayid,
              pay: {$in: [0, 2]}
            },
            transaction: t
          });
        });
      });
    }).then(data => {
      //事务结束

      //发送汇款状态通知
      service_applywithdraw.sendTemplateMsgForRemit(request.server, applywithdraw.applypayid).catch(err => logger.error(err));

      return Applywithdraw.findOne({
        where: {applypayid: params.applypayid}
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
 * 成功（批量修改）
 *
 * 修改提现（处理中）的状态为提现（成功）
 * 改变提现状态（4）
 */
module.exports.successBatch = {
  auth: 'jwt',
  validate: {
    payload: {
      applydate: Joi.string().required()
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const Applywithdraw = DB.getModel('applywithdraw');
    const Fund_in_out = DB.getModel('fund_in_out');
    // const session = request.auth.credentials;
    const payload = request.payload;

    let array_applypayid = [];
    //查询
    Applywithdraw.findAll({
      attributes: ['username', 'applypayid'],
      where: {
        applydate: {$lte: moment(payload.applydate).format('YYYYMMDDHHmm')},
        pay: {$in: [0, 2]}
      }
    }).then(data => {
      if (data.length == 0) throw new Error('没有适合的数据');

      //用户名数组
      let array_username = [];
      let array_orderid = [];
      data.forEach(item => {
        array_username.push(item.username);
        array_orderid.push(item.applypayid);
        array_applypayid.push(item.applypayid);
      });

      //事务
      return Sequelize.transaction(t => {

        /**
         * 修改提现（处理中）的状态为提现（成功）
         */
        return Fund_in_out.update({
          fundmoneystatus: 'out'
        }, {
          where: {
            username: {$in: array_username},
            orderid: {$in: array_orderid},
            fundmoneystatus: 'outdeal'
          },
          transaction: t
        }).then(data => {

          /**
           * 改变提现状态（4）
           */
          return Applywithdraw.update({
            pay: 4
          }, {
            where: {
              applydate: {$lte: moment(payload.applydate).format('YYYYMMDDHHmm')},
              pay: {$in: [0, 2]}
            },
            transaction: t
          });
        });
      });

    }).then(data => {
      //事务结束

      //发送汇款状态通知
      array_applypayid.forEach(applypayid => {
        service_applywithdraw.sendTemplateMsgForRemit(request.server, applypayid);
      });

      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};

/**
 * 导出
 */
module.exports.export = {
  auth: 'jwt',
  validate: {
    query: {
      applydate: Joi.string().required()
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const Applywithdraw = DB.getModel('applywithdraw');
    const Bankaccount = DB.getModel('bankaccount');
    // const session = request.auth.credentials;
    const query = request.query;

    let applywithdraw;
    let bankaccount;

    //查询提现记录
    Applywithdraw.findAll({
      where: {
        pay: 0,
        applydate: {$lte: moment(query.applydate).format('YYYYMMDDHHmm')}
      }
    }).then(data => {
      if (data.length == 0) throw new Error('没有可导出的数据');
      applywithdraw = data;

      //查询银行卡信息
      let array_bankId = [];
      data.forEach(item => {
        array_bankId.push(item.payinfo);
      });
      return Bankaccount.findAll({
        where: {
          id: {$in: array_bankId}
        }
      });
    }).then(data => {
      bankaccount = data;
      let obj_bankaccount = {};
      bankaccount.forEach(item => {
        obj_bankaccount[item.id] = item;
      });

      //文本内容
      let text = '# ; ; ; ; ; ;\n';
      applywithdraw.forEach(item => {
        if (!obj_bankaccount[item.payinfo]) return;
        /**
         * 转账汇款类型
         */
        let transType;
        let areaCode;
        //同城
        if (obj_bankaccount[item.payinfo].state == config.bank.area) {
          areaCode = '0021';
          //招行
          if (config.bank.shortName[obj_bankaccount[item.payinfo].bankid] == config.bank.bankName) {
            //同城招行个人账户转账
            transType = 'TRF1';
          } else {
            //同城他行转账
            transType = 'TRF3';
          }
        } else {
          areaCode = '';
          //招行
          if (config.bank.shortName[obj_bankaccount[item.payinfo].bankid] == config.bank.bankName) {
            //异地招行系统内普通汇款
            transType = 'TRT2';
          } else {
            //异地他行汇款
            transType = 'TRT3';
          }
        }
        let state = obj_bankaccount[item.payinfo].state;
        if (state == '北京' || state == '天津' || state == '上海' || state == '重庆') state = '';
        let remarks = item.applypayid.substring(item.applypayid.length - 5, item.applypayid.length);
        let row = `${config.bank.areaCode} ;${config.bank.bankNumber} ;${transType} ;${item.shiji} ;${item.rcashname} ;${state} ;${obj_bankaccount[item.payinfo].city} ; ;${config.bank.shortName[obj_bankaccount[item.payinfo].bankid]} ;${areaCode} ;${obj_bankaccount[item.payinfo].accountnumber} ;${remarks} ;10 ;实时\n`;
        text += row;
      });

      // let path = 'temp/';
      // let file = `BATCH-${config.bank.bankNumber}-${moment().format('YYYYMMDD')}.PAY`;
      //
      // fs.writeFile(path + file, text, (err) => {
      //   if (err) throw err;
      //   reply('static/' + file);
      // });

      reply(text);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};

/**
 * 需要核实
 *
 * 提现状态修改为5（需要电话核实）
 */
module.exports.verify = {
  auth: 'jwt',
  validate: {
    params: {
      applypayid: Joi.string().max(30).required()
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const Applywithdraw = DB.getModel('applywithdraw');
    // const session = request.auth.credentials;
    const params = request.params;

    let applywithdraw;

    Applywithdraw.update({pay: 5}, {
      where: {
        applypayid: params.applypayid,
        pay: {$in: [0, 2]}
      }
    }).then(data => {
      if (data[0] != 1) throw new Error('操作失败');
      return Applywithdraw.findOne({where: {applypayid: params.applypayid}});
    }).then(data => {
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};

/**
 * 已核实
 *
 * 提现状态修改为0（从5）
 */
module.exports.verified = {
  auth: 'jwt',
  validate: {
    params: {
      applypayid: Joi.string().max(30).required()
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const Applywithdraw = DB.getModel('applywithdraw');
    // const session = request.auth.credentials;
    const params = request.params;

    let applywithdraw;

    Applywithdraw.update({pay: 0}, {
      where: {
        applypayid: params.applypayid,
        pay: 5
      }
    }).then(data => {
      if (data[0] != 1) throw new Error('操作失败');
      return Applywithdraw.findOne({where: {applypayid: params.applypayid}});
    }).then(data => {
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};
