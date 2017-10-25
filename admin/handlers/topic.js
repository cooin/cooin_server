'use strict';
const Joi = require('joi');
const Boom = require('boom');
const JWT = require('jsonwebtoken')
const moment = require('moment-timezone');
const _ = require('lodash');
const service_topic = require('../../service/topic');
const pageSize = parseInt(process.env.DB_PAGE_SIZE);


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
    const Topic = DB.getModel('topic');
    // const session = request.auth.credentials;
    const params = request.params;

    const criteria = {id: params.id, status: [0, 2]};

    const doc = {
      status: 1,
      publishedAt: new Date()
    };
    //更新
    Topic.update(doc, {
      where: criteria
    }).then(data => {
      if (data[0] != 1) throw Boom.badRequest('发布失败');
      return Topic.findOne({
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
    const Topic = DB.getModel('topic');
    // const session = request.auth.credentials;
    const params = request.params;

    const criteria = {id: params.id, status: 1};

    const doc = {
      status: 2
    };
    //更新
    Topic.update(doc, {
      where: criteria
    }).then(data => {
      if (data[0] != 1) throw Boom.badRequest('取消发布失败');
      return Topic.findOne({
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
 * 推荐
 */
module.exports.recommend = {
  auth: 'jwt',
  validate: {
    params: {
      id: Joi.string().required()
    },
    payload: {
      recommendAt: Joi.date()
    },
    options: {
      allowUnknown: true
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const Topic = DB.getModel('topic');
    // const session = request.auth.credentials;
    const params = request.params;
    const payload = request.payload;

    const criteria = {id: params.id, status: 1};

    const doc = {
      isRecommend: 1,
      recommendAt: payload.recommendAt ? payload.recommendAt : new Date()
    };
    //更新
    Topic.update(doc, {
      where: criteria
    }).then(data => {
      if (data[0] != 1) throw Boom.badRequest('推荐失败');
      return Topic.findOne({
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
 * 取消推荐
 */
module.exports.unRecommend = {
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
    const Topic = DB.getModel('topic');
    // const session = request.auth.credentials;
    const params = request.params;
    const payload = request.payload;

    const criteria = {id: params.id, status: 1};

    const doc = {
      isRecommend: 0,
      recommendAt: null
    };
    //更新
    Topic.update(doc, {
      where: criteria
    }).then(data => {
      if (data[0] != 1) throw Boom.badRequest('取消推荐失败');
      return Topic.findOne({
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
 * 查询--话题
 */
module.exports.query = {
  auth: 'jwt',
  validate: {
    query: {
      page: Joi.number().integer().min(1).default(1),
      isRecommend: Joi.number().integer().valid(0, 1)
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const Topic = DB.getModel('topic');
    // const session = request.auth.credentials;

    const query = request.query;

    const criteria = {rootId: 0};

    if (query.isRecommend) criteria.isRecommend = query.isRecommend;

    service_topic.queryAttachComment(request.server, criteria, query.page, pageSize, [['id', 'DESC']]).then(data => {
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};

/**
 * 查询--评论
 */
module.exports.queryComment = {
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
    const Topic = DB.getModel('topic');
    // const session = request.auth.credentials;

    const query = request.query;

    const criteria = {rootId: {$ne: 0}};

    service_topic.queryAttachComment(request.server, criteria, query.page, pageSize, [['id', 'DESC']]).then(data => {
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};

/**
 * 查询--举报
 */
module.exports.queryReport = {
  auth: 'jwt',
  validate: {
    params: {
      id: Joi.string().required()
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
    // const Topic = DB.getModel('topic');
    const TopicReport = DB.getModel('topicReport');
    // const session = request.auth.credentials;
    const query = request.query;
    const params = request.params;
    const offset = --query.page * pageSize;

    const criteria = {
      $or: [
        {rootId: params.id},
        {topicId: params.id}
      ]
    };

    TopicReport.findAndCountAll({
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
 * 查询--根据
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
    // const Topic = DB.getModel('topic');
    // const session = request.auth.credentials;
    const params = request.params;

    const criteria = {
      id: params.id
    };

    service_topic.queryAttachComment(request.server, criteria, 1, pageSize, [['id', 'DESC']]).then(data => {
      reply(data.rows[0]);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};

/**
 * 从微信图文解析文章
 */
module.exports.parseFromWeChatArticle = {
  auth: 'jwt',
  validate: {
    payload: {
      sourceUrl: Joi.string().required().max(1000),
      username: Joi.string().required().max(30)
    },
    options: {
      allowUnknown: true
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    // const session = request.auth.credentials;
    const payload = request.payload;

    service_topic.parseFromWeChatArticle(request.server, payload.sourceUrl, payload.username).then(data => {
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};

/**
 * 更新话题（类型是文章的）
 */
module.exports.updateArticle = {
  auth: 'jwt',
  validate: {
    params: {
      id: Joi.string().required()
    },
    payload: {
      title: Joi.string().max(100).required(),
      summary: Joi.string().max(200),
      cover: Joi.string().max(200),
      content: Joi.string().required().max(100000),
      tags: Joi.string().max(200)
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const Topic = DB.getModel('topic');
    const TopicTag = DB.getModel('topicTag');
    // const session = request.auth.credentials;
    const params = request.params;
    const payload = request.payload;

    const doc = {
      content: payload.content
    };
    if (payload.title) doc.title = payload.title;
    if (payload.summary) doc.summary = payload.summary;
    if (payload.cover) doc.cover = payload.cover;

    if (payload.tags) doc.tags = _.union(payload.tags.split(',')).toString();

    return Promise.resolve().then(() => {
      if (!doc.tags) return Promise.resolve();

      return TopicTag.count({
        where: {tag: doc.tags.split(',')}
      }).then(count => {
        if (count != doc.tags.split(',').length) throw new Error('话题类型异常');
        return Promise.resolve();
      });
    }).then(() => {
      return Topic.update(doc, {where: {id: params.id}});
    }).then(data => {
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};
