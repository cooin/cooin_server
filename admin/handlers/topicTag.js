'use strict';
const Joi = require('joi');
const Boom = require('boom');
const moment = require('moment-timezone');
const config = require('../../config/config');
const pageSize = parseInt(process.env.DB_PAGE_SIZE);

/**
 * 保存
 */
module.exports.save = {
  auth: 'jwt',
  validate: {
    payload: {
      logo: Joi.string().max(200),
      cover: Joi.string().max(200),
      tag: Joi.string().max(30).required(),
      intro: Joi.string().max(10000).required(),
      qqGroup: Joi.string().max(200),
      whitePaper: Joi.string().max(1000)
    },
    options: {
      allowUnknown: true
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const TopicTag = DB.getModel('topicTag');
    // const session = request.auth.credentials;
    const payload = request.payload;

    const doc = {
      tag: payload.tag,
      intro: payload.intro,
      status: 0
    };

    if (payload.logo) doc.logo = payload.logo;
    if (payload.cover) doc.cover = payload.cover;
    if (payload.qqGroup) doc.qqGroup = payload.qqGroup;
    if (payload.whitePaper) doc.whitePaper = payload.whitePaper;

    TopicTag.count({
      where: {tag: payload.tag}
    }).then(data => {
      if (data >=1) throw new Error('该话题已经创建过了');
      return TopicTag.create(doc);
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
      logo: Joi.string().max(200),
      cover: Joi.string().max(200),
      tag: Joi.string().max(30).required(),
      intro: Joi.string().max(10000).required(),
      qqGroup: Joi.string().max(200),
      whitePaper: Joi.string().max(1000)
    },
    options: {
      allowUnknown: true
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const TopicTag = DB.getModel('topicTag');
    // const session = request.auth.credentials;
    const params = request.params;
    const payload = request.payload;

    const criteria = {id: params.id};

    const doc = {
      tag: payload.tag,
      intro: payload.intro
    };

    if (payload.logo) doc.logo = payload.logo;
    if (payload.cover) doc.cover = payload.cover;
    if (payload.qqGroup) doc.qqGroup = payload.qqGroup;
    if (payload.whitePaper) doc.whitePaper = payload.whitePaper;

    TopicTag.findOne({
      raw: true,
      where: {tag: payload.tag}
    }).then(data => {
      if (data.id != params.id && data) throw new Error('该话题已经创建过了');
      //更新
      return TopicTag.update(doc, {
        where: criteria
      });
    }).then(data => {
      if (data[0] != 1) throw Boom.badRequest('话题不存在');
      return TopicTag.findOne({
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
 * 发布
 */
module.exports.publish = {
  auth: 'jwt',
  validate: {
    params: {
      id: Joi.string().required()
    },
    options: {
      allowUnknown: true
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const TopicTag = DB.getModel('topicTag');
    // const session = request.auth.credentials;
    const params = request.params;

    const criteria = {id: params.id, status: [0, 2]};

    const doc = {
      status: 1
    };
    //更新
    TopicTag.update(doc, {
      where: criteria
    }).then(data => {
      if (data[0] != 1) throw Boom.badRequest('发布失败');
      return TopicTag.findOne({
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
 * 下架
 */
module.exports.unPublish = {
  auth: 'jwt',
  validate: {
    params: {
      id: Joi.string().required()
    },
    options: {
      allowUnknown: true
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const TopicTag = DB.getModel('topicTag');
    // const session = request.auth.credentials;
    const params = request.params;

    const criteria = {id: params.id, status: 1};

    const doc = {
      status: 2
    };
    //更新
    TopicTag.update(doc, {
      where: criteria
    }).then(data => {
      if (data[0] != 1) throw Boom.badRequest('取消发布失败');
      return TopicTag.findOne({
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
 * 查询
 */
module.exports.query = {
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
    const TopicTag = DB.getModel('topicTag');
    // const session = request.auth.credentials;
    const query = request.query;
    const offset = --query.page * pageSize;

    const criteria = {};

    TopicTag.findAndCountAll({
      attributes: config.attributes.topicTag.list,
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
 * 查询全部
 */
module.exports.queryAll = {
  // auth: 'jwt',
  validate: {
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const TopicTag = DB.getModel('topicTag');
    // const session = request.auth.credentials;

    const criteria = {status: 1};

    TopicTag.findAll({
      attributes: config.attributes.topicTag.publicList,
      where: criteria,
      order: [
        ['heat', 'DESC'],
        ['id', 'DESC']
      ],
    }).then(data => {
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};

/**
 * 查询--根据tag
 */
module.exports.queryByTag = {
  auth: 'jwt',
  validate: {
    params: {
      tag: Joi.string().required()
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const TopicTag = DB.getModel('topicTag');
    // const session = request.auth.credentials;
    const params = request.params;

    const criteria = {tag: params.tag};

    TopicTag.findOne({
      attributes: config.attributes.topicTag.detail,
      where: criteria
    }).then(data => {
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};
