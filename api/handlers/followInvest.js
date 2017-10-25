'use strict';
const Joi = require('joi');
const Boom = require('boom');
const JWT = require('jsonwebtoken')
const moment = require('moment-timezone');
const config = require('../../config/config');
const service_followInvest = require('../../service/followInvest');
const pageSize = parseInt(process.env.DB_PAGE_SIZE);

/**
 * 创建跟投
 */
module.exports.save = {
  auth: 'jwt',
  validate: {
    payload: {
      leaderId: Joi.string().required(),
      amount: Joi.number().required().min(100).max(1000000),
      profitLimit: Joi.number().greater(0),
      lossLimit: Joi.number().greater(0).max(1),
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const session = request.auth.credentials;
    const payload = request.payload;

    service_followInvest.save(request.server, session.username, payload.leaderId, payload.amount, payload.profitLimit, payload.lossLimit).then(data => {
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};

/**
 * 创建跟投
 */
module.exports.recharge = {
  auth: 'jwt',
  validate: {
    params: {
      followInvestId: Joi.string().required().max(30)
    },
    payload: {
      amount: Joi.number().required().min(100).max(1000000)
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const FollowInvest = DB.getModel('followInvest');
    const session = request.auth.credentials;
    const params = request.params;
    const payload = request.payload;

    FollowInvest.findOne({where: {followInvestId: params.followInvestId}}).then(data => {
      if (!data) throw Boom.badRequest('跟投不存在');
      if (data.username != session.username) throw Boom.badRequest('权限不足');
      return service_followInvest.recharge(request.server, params.followInvestId, payload.amount);
    }).then(data => {
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};

/**
 * 创建跟投
 */
module.exports.finish = {
  auth: 'jwt',
  validate: {
    params: {
      followInvestId: Joi.string().required().max(30)
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const FollowInvest = DB.getModel('followInvest');
    const session = request.auth.credentials;
    const params = request.params;

    FollowInvest.findOne({where: {followInvestId: params.followInvestId}}).then(data => {
      if (!data) throw Boom.badRequest('跟投不存在');
      if (data.username != session.username) throw Boom.badRequest('权限不足');
      return service_followInvest.finish(request.server, params.followInvestId);
    }).then(data => {
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};

/**
 * 查询--我跟投的人
 */
module.exports.queryLeaderForCurrentUser = {
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
    const session = request.auth.credentials;
    const query = request.query;

    const criteria = {
      username: session.username,
      status: [0, 1]
    };

    service_followInvest.queryAttachLeader(request.server, criteria, query.page, pageSize, [['id', 'DESC']]).then(data => {
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};

/**
 * 查询--跟投我的人
 */
module.exports.queryFollowerForCurrentUser = {
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
    const Master_register = DB.getModel('master_register');
    const session = request.auth.credentials;
    const query = request.query;

    Master_register.findOne({where: {username: session.username}}).then(data => {
      const criteria = {
        leaderId: data.activecode,
        status: [0, 1]
      };
      return service_followInvest.queryAttachFollower(request.server, criteria, query.page, pageSize, [['id', 'DESC']]);
    }).then(data => {
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};

/**
 * 查询--根据followInvestId
 */
module.exports.queryByFollowInvestId = {
  // auth: 'jwt',
  validate: {
    params: {
      followInvestId: Joi.string().required().max(30)
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    // const session = request.auth.credentials;
    const params = request.params;

    const criteria = {followInvestId: params.followInvestId};

    service_followInvest.queryAttachLeader(request.server, criteria, 1, pageSize, [['id', 'DESC']]).then(data => {
      reply(data.rows[0]);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};

/**
 * 查询--跟投我的人--三十天增长曲线
 */
module.exports.queryFollowerKLineForCurrentUser = {
  auth: 'jwt',
  validate: {
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const Master_register = DB.getModel('master_register');
    const session = request.auth.credentials;

    Master_register.findOne({where: {username: session.username}}).then(data => {
      return service_followInvest.queryFollowerKLine(request.server, data.activecode);
    }).then(data => {
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};

/**
 * 查询--指定用户--跟投他的人--三十天增长曲线
 */
module.exports.queryFollowerKLineForUser =  {
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
    // const session = request.auth.credentials;

    const params = request.params;

    service_followInvest.queryFollowerKLine(request.server, params.userId).then(data => {
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};

/**
 * 查询--最新跟投
 */
module.exports.queryLatest = {
  // auth: 'jwt',
  validate: {
    query: {
      size: Joi.number().integer().min(1).max(10).default(10)
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    // const session = request.auth.credentials;
    const query = request.query;

    const criteria = {
      status: 0
    };

    service_followInvest.queryAttachLeaderAndFollower(request.server, criteria, 1, query.size, [['id', 'DESC']]).then(data => {
      reply(data.rows);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};

/**
 * 查询--跟投牛人
 */
module.exports.queryTalent = {
  // auth: 'jwt',
  validate: {
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const Master_register = DB.getModel('master_register');
    // const session = request.auth.credentials;
    // const query = request.query;

    const criteria = {
      followInvestCount: {$gt: 0}
    };

    Master_register.findAll({
      attributes: config.attributes.master_register.public,
      where: criteria,
      order: [
        ['followInvestCount', 'desc'],
        ['profitRateFor3Month', 'desc']
      ],
      limit: 10
    }).then(data => {
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};

/**
 * 查询--是否跟投某人
 */
module.exports.isFollowInvest = {
  auth: 'jwt',
  validate: {
    query: {
      userId: Joi.string().required().min(5).max(10),
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const session = request.auth.credentials;
    const query = request.query;

    service_followInvest.isFollowInvest(request.server, session.username, query.userId).then(data => {
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};
