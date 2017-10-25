'use strict';
const Joi = require('joi');
const Boom = require('boom');
const JWT = require('jsonwebtoken')
const moment = require('moment-timezone');
const service_follow = require('../../service/follow');
const pageSize = parseInt(process.env.DB_PAGE_SIZE);

/**
 * 关注
 */
module.exports.save = {
  auth: 'jwt',
  validate: {
    payload: {
      followUserId: Joi.string().required().min(5).max(10)
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const session = request.auth.credentials;
    const payload = request.payload;

    service_follow.save(request.server, session.username, payload.followUserId).then(data => {
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};

/**
 * 取消关注
 */
module.exports.cancel = {
  auth: 'jwt',
  validate: {
    payload: {
      followUserId: Joi.string().required().min(5).max(10)
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const session = request.auth.credentials;
    const payload = request.payload;

    service_follow.cancel(request.server, session.username, payload.followUserId).then(data => {
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};

/**
 * 查询--我--关注的人
 */
module.exports.queryFollowForCurrentUser = {
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
    const session = request.auth.credentials;
    const query = request.query;

    const criteria = {
      username: session.username
    };

    service_follow.queryAttachFollow(request.server, criteria, query.page, pageSize, [['id', 'DESC']]).then(data => {
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};

/**
 * 查询--我--粉丝
 */
module.exports.queryFansForCurrentUser = {
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
        followUserId: data.activecode
      };
      return service_follow.queryAttachFans(request.server, criteria, query.page, pageSize, [['id', 'DESC']]).then(data => {
        reply(data);
      })
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};

/**
 * 查询--用户--关注的人
 */
module.exports.queryFollowForUser = {
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
    const params = request.params;
    const query = request.query;


    Master_register.findOne({where: {activecode: params.userId}}).then(data => {
      if (!data) throw Boom.badRequest('用户不存在');
      const criteria = {
        username: data.username
      };
      return service_follow.queryAttachFollow(request.server, criteria, query.page, pageSize, [['id', 'DESC']]);
    }).then(data => {
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};

/**
 * 查询--用户--粉丝
 */
module.exports.queryFansForUser = {
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
    const params = request.params;
    const query = request.query;

    const criteria = {
      followUserId: params.userId
    };

    service_follow.queryAttachFans(request.server, criteria, query.page, pageSize, [['id', 'DESC']]).then(data => {
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};

/**
 * 查询--是否关注某人
 */
module.exports.isFollow = {
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

    service_follow.isFollow(request.server, session.username, query.userId).then(data => {
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};
