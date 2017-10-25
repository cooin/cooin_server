'use strict';
const Joi = require('joi');
const Boom = require('boom');
const JWT = require('jsonwebtoken')
const moment = require('moment-timezone');
const _ = require('lodash');
const service_master_register = require('../../service/master_register');
const service_topic = require('../../service/topic');
const pageSize = parseInt(process.env.DB_PAGE_SIZE);

/**
 * 发表话题
 */
module.exports.save = {
  auth: 'jwt',
  validate: {
    payload: {
      type: Joi.number().integer().required().valid(1, 2, 3),
      title: Joi.string().max(100)
        .when('type', {
          is: 2,
          then: Joi.required()
        }),
      summary: Joi.string().max(200),
      cover: Joi.string().max(200),
      content: Joi.string().required()
        .when('type', {
          is: 1,
          then: Joi.string().max(5000)
        })
        .when('type', {
          is: 2,
          then: Joi.string().max(500000)
        })
        .when('type', {
          is: 3,
          then: Joi.string().max(100)
        }),
      images: Joi.string().max(1000),
      imagesMini: Joi.string().max(1000),
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
    const session = request.auth.credentials;
    const payload = request.payload;

    const doc = {
      username: session.username,
      type: payload.type,
      content: payload.content
    };
    if (payload.title) doc.title = payload.title;
    if (payload.summary) doc.summary = payload.summary;
    if (payload.cover) doc.cover = payload.cover;
    if (payload.images) doc.images = payload.images;
    if (payload.imagesMini) doc.imagesMini = payload.imagesMini;

    if (payload.tags) doc.tags = _.union(payload.tags.split(',')).toString();

    //查看用户是否被禁言
    service_master_register.getSilentAt(session.username).then(silentAt => {
      if (parseInt(silentAt) > Date.now()) throw new Error('您已被禁言');

      if (!doc.tags) return Promise.resolve();

      return TopicTag.count({
        where: {tag: doc.tags.split(',')}
      }).then(count => {
        if (count != doc.tags.split(',').length) throw new Error('话题类型异常');
        return Promise.resolve();
      });
    }).then(() => {
      return Topic.create(doc);
    }).then(data => {
      reply(data);
      //更新标签热度
      service_topic.updateTopicTagHeat(request.server, data.id, 2);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};

/**
 * 评论
 */
module.exports.comment = {
  auth: 'jwt',
  validate: {
    params: {
      id: Joi.number().integer().required()
    },
    payload: {
      content: Joi.string().required().max(500)
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const Topic = DB.getModel('topic');
    const session = request.auth.credentials;
    const params = request.params;
    const payload = request.payload;

    const doc = {
      parentId: params.id,
      username: session.username,
      content: payload.content
    };

    let model;

    //查看用户是否被禁言
    service_master_register.getSilentAt(session.username).then(silentAt => {
      if (parseInt(silentAt) > Date.now()) throw new Error('您已被禁言');

      //查询被评论内容
      return Topic.findOne({
        where: {id: params.id}
      })
    }).then(data => {
      if (!data) throw Boom.badRequest('评论的内容不存在');
      //暂时不开放评论评论
      if (data.rootId != 0) throw Boom.badRequest('不能回复评论哟');
      //评论的是话题
      if (data.rootId == 0) {
        doc.rootId = data.id;
      } else {
        doc.rootId = data.rootId;
      }
      //事务
      return Sequelize.transaction(t => {
        //保存文档
        return Topic.create(doc, {transaction: t}).then(data => {
          model = data;
          //被评论内容评论数累加
          return Topic.update({
            commentCount: Sequelize.literal(`commentCount + 1`)
          }, {
            where: {id: params.id},
            transaction: t
          });
        });
      });
    }).then(data => {
      reply(model);
      //更新标签热度
      service_topic.updateTopicTagHeat(request.server, model.rootId, 1);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};

/**
 * 赞
 */
module.exports.praise = {
  auth: 'jwt',
  validate: {
    params: {
      id: Joi.number().integer().required()
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const Topic = DB.getModel('topic');
    const TopicPraiseAndOppose = DB.getModel('topicPraiseAndOppose');
    const session = request.auth.credentials;
    const params = request.params;

    const doc = {
      username: session.username,
      topicId: params.id,
      praiseOrOppose: 1
    };

    //查询被点赞内容
    Topic.findOne({
      raw: true,
      where: {id: params.id}
    }).then(data => {
      if (!data) throw Boom.badRequest('点赞的内容不存在');
      //事务
      return Sequelize.transaction(t => {
        //保存文档
        return TopicPraiseAndOppose.findOrCreate({
          where: {
            username: session.username,
            topicId: params.id
          },
          transaction: t,
          defaults: doc
        }).spread((model, created) => {
          //点赞
          if (created) {
            data.isPraise = 1;
            data.praiseCount += 1;
            //被评论内容点赞数累加
            return Topic.update({
              praiseCount: Sequelize.literal(`praiseCount + 1`)
            }, {
              where: {id: params.id},
              transaction: t
            }).then(() => data);
          }
          //取消赞
          data.isPraise = 0;
          data.praiseCount -= 1;
          return TopicPraiseAndOppose.destroy({
            where: {
              username: session.username,
              topicId: params.id
            },
            transaction: t
          }).then(() => {
            return Topic.update({
              praiseCount: Sequelize.literal(`praiseCount - 1`)
            }, {
              where: {id: params.id},
              transaction: t
            })
          }).then(() => data);
        });
      });
    }).then(data => {
      reply(data);
      //更新标签热度
      service_topic.updateTopicTagHeat(request.server, data.rootId ? data.rootId : data.id, data.isPraise ? 1 : -1);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};

/**
 * 举报
 */
module.exports.report = {
  auth: 'jwt',
  validate: {
    params: {
      id: Joi.number().integer().required()
    },
    payload: {
      content: Joi.string().max(1000).required()
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const Topic = DB.getModel('topic');
    const TopicReport = DB.getModel('topicReport');
    const session = request.auth.credentials;
    const params = request.params;
    const payload = request.payload;

    let topic;

    const doc = {
      username: session.username,
      topicId: params.id,
      content: payload.content
    };

    //查询举报内容
    Topic.findOne({
      raw: true,
      where: {id: params.id}
    }).then(data => {
      if (!data) throw Boom.badRequest('举报的内容不存在');
      topic = data;
      doc.rootId = topic.rootId;

      //创建举报
      return TopicReport.findOrCreate({
        where: {
          username: session.username,
          topicId: params.id
        },
        defaults: doc
      });
    }).then(data => {
      if (!data[1]) throw Boom.badRequest('已经举报过了');

      //更新被举报内容状态
      const task = [];
      //被举报内容举报状态修改
      task.push(Topic.update({
        reportStatus: 1
      }, {
        where: {id: topic.id}
      }));
      //如果举报的是评论，评论附属话题举报状态修改为2
      if (topic.rootId) task.push(Topic.update({
        reportStatus: 2
      }, {
        where: {id: topic.rootId}
      }));
      return Promise.all(task).then(() => {
        reply(data[0]);
      });
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
  // auth: 'jwt',
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

    const session = request.headers.authorization ? JWT.decode(request.headers.authorization, process.env.JWT_SECRET) : null;

    const query = request.query;

    const criteria = {rootId: 0, status: 1};

    service_topic.queryAttachComment(request.server, criteria, query.page, pageSize, [['id', 'DESC']], session).then(data => {
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};

/**
 * 查询--当前用户
 */
module.exports.queryForCurrentUser = {
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
    const session = request.auth.credentials;
    const query = request.query;

    const criteria = {rootId: 0, username: session.username, status: 1};

    service_topic.queryAttachComment(request.server, criteria, query.page, pageSize, [['id', 'DESC']], session).then(data => {
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};

/**
 * 查询--当前用户关注的人的话题
 */
module.exports.queryFollowerTopicForCurrentUser = {
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
    const Follow = DB.getModel('follow');
    const session = request.auth.credentials;
    const query = request.query;

    //查询关注的人的ID
    Follow.findAll({
      raw: true,
      attributes: [
        'followUserId',
        [Sequelize.literal(`(select master_register.username from master_register where master_register.activecode = follow.followUserId)`), 'followUsername']
      ],
      where: {username: session.username}
    }).then(data => {
      const array_username = [];
      data.forEach(item => array_username.push(item.followUsername));
      const criteria = {rootId: 0, username: array_username, status: 1};
      return service_topic.queryAttachComment(request.server, criteria, query.page, pageSize, [['id', 'DESC']], session);
    }).then(data => {
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};

/**
 * 查询--指定用户
 */
module.exports.queryForUser = {
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
    // const session = request.auth.credentials;
    const params = request.params;
    const query = request.query;

    const session = request.headers.authorization ? JWT.decode(request.headers.authorization, process.env.JWT_SECRET) : null;

    Master_register.findOne({where: {activecode: params.userId}}).then(data => {
      if (!data) throw Boom.badRequest('用户不存在');
      const criteria = {rootId: 0, username: data.username, status: 1};
      return service_topic.queryAttachComment(request.server, criteria, query.page, pageSize, [['id', 'DESC']], session)
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
module.exports.queryById = {
  // auth: 'jwt',
  validate: {
    params: {
      id: Joi.number().integer().required()
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const DB = request.getDb(process.env.DB_DBNAME);
    const Topic = DB.getModel('topic');
    // const session = request.auth.credentials;
    const params = request.params;

    const session = request.headers.authorization ? JWT.decode(request.headers.authorization, process.env.JWT_SECRET) : null;

    const criteria = {rootId: 0, id: params.id, status: 1};

    service_topic.queryAttachComment(request.server, criteria, 1, pageSize, [['id', 'DESC']], session).then(data => {
      reply(data.rows[0]);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};

/**
 * 查询--精选
 */
module.exports.queryRecommend = {
  // auth: 'jwt',
  validate: {
    query: {
      page: Joi.number().integer().min(1).default(1),
      size: Joi.number().integer().min(1).max(10).default(10)
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

    const session = request.headers.authorization ? JWT.decode(request.headers.authorization, process.env.JWT_SECRET) : null;

    const criteria = {rootId: 0, isRecommend: 1, status: 1};

    service_topic.queryAttachComment(request.server, criteria, 1, query.size, [['recommendAt', 'DESC']], session).then(data => {
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};

/**
 * 查询--标签
 */
module.exports.queryByTag = {
  // auth: 'jwt',
  validate: {
    params: {
      tag: Joi.string().required().max(30),
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
    const TopicTag = DB.getModel('topicTag');
    // const session = request.auth.credentials;
    const params = request.params;
    const query = request.query;

    const session = request.headers.authorization ? JWT.decode(request.headers.authorization, process.env.JWT_SECRET) : null;

    TopicTag.findOne({where: {tag: params.tag}}).then(data => {
      if (!data) throw Boom.badRequest('话题不存在');
      const criteria = {rootId: 0, tags: {$like: `%${params.tag}%`}, status: 1};
      return service_topic.queryAttachComment(request.server, criteria, query.page, pageSize, [['id', 'DESC']], session)
    }).then(data => {
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};
