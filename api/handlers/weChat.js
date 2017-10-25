'use strict';
const Joi = require('joi');
const Boom = require('boom');
const JWT = require('jsonwebtoken');
const request = require('request');
const qs = require('querystring');
const xml2js = require('xml2js');
const url = require('url');
const config = require('../../config/config');
const util_weChat = require('../../lib/weChat');
const util_encrypt = require('../../lib/encrypt');
const util_url = require('../../lib/url');

/**
 * 获取accessToken
 */
module.exports.getAccessToken = {
  validate: {
    query: {
      scope: Joi.string().required()
    },
    options: {
      allowUnknown: true
    }
  },
  handler: function (request, reply) {
    const query = request.query;
    util_weChat.getAccessTokenUseScope(query.scope).then(data => {
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    })
  }
};

/**
 * 获取JSAPITicket
 */
module.exports.getJSAPITicket = {
  validate: {
    query: {
      scope: Joi.string().required()
    },
    options: {
      allowUnknown: true
    }
  },
  handler: function (request, reply) {
    const query = request.query;
    util_weChat.getJSAPITicketUseScope(query.scope).then(data => {
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    })
  }
};

/**
 * 微信授权分发接口
 */
module.exports.authorizationRoute = {
  validate: {
    query: {
      weChat_authorization: Joi.string().required()
    },
    options: {
      allowUnknown: true
    }
  },
  handler: function (request, reply) {
    const query = request.query;
    const weChat_authorization = query.weChat_authorization;
    delete query.weChat_authorization;
    reply.redirect(weChat_authorization + "?" + qs.stringify(query));
  }
};

/**
 * 微信base授权
 */
module.exports.baseAuthorization = {
  validate: {
    query: {
      code: Joi.string().required(),
      returnUrl: Joi.string().required(),
      jwt: Joi.string()
    },
    options: {
      allowUnknown: true
    }
  },
  handler: function (request, reply) {

    const DB = request.getDb(process.env.DB_DBNAME);
    const Master_register = DB.getModel('master_register');

    const query = request.query;
    const session = JWT.decode(query.jwt, process.env.JWT_SECRET);

    let openid;
    //获取openid
    util_weChat.getAccessTokenByCodeUseScope(config.weChat.bitekuang.name, query.code).then(data => {
      // if (!session || !session.username) throw new Error('invalid authorization');

      openid = data.openid;

      if (!session || !session.username) return;

      //绑定openid
      return Master_register.update({
        openid: data.openid
      }, {
        where: {
          username: session.username,
          openid: null
        }
      });
    }).then(data => {
      //重定向
      if (data) {
        //有session
        reply.redirect(query.returnUrl);
      } else {
        //没有session（返回参数中添加openid）
        reply.redirect(util_url.insert(query.returnUrl, 'openid', openid));
      }

      //查询是否订阅公众号
      if (data) util_weChat.getUserInfoUseScope(config.weChat.bitekuang.name, openid).then(data => {
        //更新订阅状态
        return Master_register.update({
          subscribe: data.subscribe
        }, {
          where: {
            username: session.username
          }
        });
      }).catch(err => {
        logger.error(err);
      });
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};

/**
 * 微信授权测试
 */
module.exports.test = {
  validate: {
    query: {
      sessionOn: Joi.string().default('on')
    },
    options: {
      allowUnknown: true
    }
  },
  handler: function (request, reply) {

    const query = request.query;

    const weChat_authorizationRoute = "http://www.cooin.com/api/weChat/authorizationRoute";

    const weChat_authorization = "http://cooin.yizhizhun.com/api/weChat/baseAuthorization";

    const returnUrl = "http://www.cooin.com";

    const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ2YWxpZCI6dHJ1ZSwidXNlcm5hbWUiOiIxODIyMzU3MzAzOSIsInVzZXJpZCI6MTAyNTYsImV4cCI6MTQ4NTI0NzEwNTg5OSwiaWF0IjoxNDg1MjQ1MzA1fQ.Vd8BQTYqhvn23O0XEuMyFJjwb9XTgQafXVj95lgHSo0';

    const params = {
      weChat_authorization: weChat_authorization,
      returnUrl: returnUrl
    };

    if (query.sessionOn == 'on') params.jwt = jwt;

    const redirect_uri = weChat_authorizationRoute + "?" + qs.stringify(params);

    const url = "https://open.weixin.qq.com/connect/oauth2/authorize?" +
      "appid=" + config.weChat.bitekuang.APPID + "&" +
      "redirect_uri=" + encodeURIComponent(redirect_uri) + "&" +
      "response_type=code&" +
      "scope=snsapi_base&" +
      "state=0#wechat_redirect";

    reply.redirect(url);

  }
};

/**
 * 微信--发送模板消息--登录提醒
 */
module.exports.sendTemplateMsgForUserLogin = {
  validate: {
    payload: {
      username: Joi.string().required(),
      ip: Joi.string().required()
    },
    options: {
      allowUnknown: true
    }
  },
  handler: function (request, reply) {

    const DB = request.getDb(process.env.DB_DBNAME);
    const Master_register = DB.getModel('master_register');

    const payload = request.payload;

    Promise.resolve().then(() => {
      //增加内网访问限制
      if (request.info.hostname != 'localhost' && request.info.hostname != '127.0.0.1') return Boom.badRequest('权限不足');
      //查询用户
      return Master_register.findOne({
        attributes: ['username', 'openid'],
        where: {
          username: request.payload.username
        }
      });
    }).then(data => {
      if (!data) return Boom.badRequest('用户不存在');
      //用户未关注
      if (data.subscribe == 0) return Boom.badRequest('用户未关注');
      return util_weChat.sendTemplateMsgForUserLogin(config.weChat.bitekuang.name, data.openid, data.username, payload.ip);
    }).then(data => {
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};

/**
 * 微信--发送模板消息---通用（账户操作信息提醒）
 */
module.exports.sendTemplateMsgForCommon = {
  validate: {
    payload: {
      username: Joi.string().required(),
      first: Joi.string().required(),
      theme: Joi.string().required(),
      content: Joi.string().required(),
      time: Joi.string().required(),
      remark: Joi.string().required()
    },
    options: {
      allowUnknown: true
    }
  },
  handler: function (request, reply) {

    const DB = request.getDb(process.env.DB_DBNAME);
    const Master_register = DB.getModel('master_register');

    const payload = request.payload;

    Promise.resolve().then(() => {
      //增加内网访问限制
      if (request.info.hostname != 'localhost' && request.info.hostname != '127.0.0.1') return Boom.badRequest('权限不足');
      //查询用户
      return Master_register.findOne({
        attributes: ['username', 'openid'],
        where: {
          username: request.payload.username
        }
      });
    }).then(data => {
      if (!data) return Boom.badRequest('用户不存在');
      //用户未关注
      if (data.subscribe == 0) return Boom.badRequest('用户未关注');
      return util_weChat.sendTemplateMsgForCommon(config.weChat.bitekuang.name, data.openid, payload.first, payload.theme, payload.content, payload.time, payload.remark);
    }).then(data => {
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};

/**
 * 微信--问题回复通知
 */
module.exports.sendTemplateMsgForReply = {
  validate: {
    payload: {
      username: Joi.string().required(),
      question: Joi.string().required(),
      answerer: Joi.string().required(),
      content: Joi.string().required()
    },
    options: {
      allowUnknown: true
    }
  },
  handler: function (request, reply) {

    const DB = request.getDb(process.env.DB_DBNAME);
    const Master_register = DB.getModel('master_register');

    const payload = request.payload;

    Promise.resolve().then(() => {
      //增加内网访问限制
      if (request.info.hostname != 'localhost' && request.info.hostname != '127.0.0.1') return Boom.badRequest('权限不足');
      //查询用户
      return Master_register.findOne({
        attributes: ['username', 'openid'],
        where: {
          username: request.payload.username
        }
      });
    }).then(data => {
      if (!data) return Boom.badRequest('用户不存在');
      //用户未关注
      if (data.subscribe == 0) return Boom.badRequest('用户未关注');
      return util_weChat.sendTemplateMsgForReply(config.weChat.bitekuang.name, data.openid, data.username, payload.question, payload.answerer, payload.content);
    }).then(data => {
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};

/**
 * 微信--服务器校验
 */
module.exports.verify = {
  validate: {
    options: {
      allowUnknown: true
    }
  },
  handler: function (request, reply) {
    const query = request.query;

    console.log('**************weChat verify**************');
    console.log(query);
    /*
     {
     signature: 'd920842ace2363a2c8b678f4b5c8217b22f6a9ef',
     echostr: '4896864139527290841',
     timestamp: '1489139593',
     nonce: '2002255008'
     }
     */

    const array = [config.weChat.bitekuang.serverConfig.token, query.timestamp, query.nonce];
    let str = '';
    array.sort().forEach(item => str += item);
    if (util_encrypt.SHA1(str) == query.signature) return reply(query.echostr);
    return reply();
  }
};

/**
 * 微信--微信通知
 */
module.exports.notify = {
  validate: {
    options: {
      allowUnknown: true
    }
  },
  handler: function (request, reply) {

    const DB = request.getDb(process.env.DB_DBNAME);
    const Master_register = DB.getModel('master_register');

    const payload = request.payload;

    console.log('**************weChat notify**************');
    console.log(payload);
    logger.info('**************weChat notify**************');
    logger.info(payload);

    //统一不做任何回复提示
    reply();

    xml2js.parseString(payload, (err, result) => {
      if (err) return logger.error(err);

      const data = result.xml;
      //事件推送
      if (data.MsgType[0] == 'event') {

        /**
         * 订阅
         */
        if (data.Event[0] == 'subscribe' && !data.Ticket) {
          //回复欢迎语
          // reply(util_weChat.generateMsgForText(data.FromUserName[0], config.weChat.bitekuang.subscribe));
          //更新用户订阅状态
          Master_register.update({
            subscribe: 1
          }, {
            where: {openid: data.FromUserName[0]}
          }).catch(err => logger.error(err));
        }

        /**
         * 取消订阅
         */
        if (data.Event[0] == 'unsubscribe') {
          //回复
          // reply(util_weChat.generateMsgForText(data.FromUserName[0], config.weChat.bitekuang.unsubscribe));
          //更新用户订阅状态
          Master_register.update({
            subscribe: 0
          }, {
            where: {openid: data.FromUserName[0]}
          }).catch(err => logger.error(err));
        }

        /**
         * 扫描带参数二维码、扫码订阅
         */
        if (data.Event[0] == 'SCAN' || (data.Event[0] == 'subscribe' && data.Ticket)) {
          //根据ticket找到对应的用户，并绑定openid
          util_weChat.getSceneIdByQRCodeTicket(data.Ticket[0]).then(sceneId => {
            //openid
            return Master_register.update({
              openid: data.FromUserName[0],
              subscribe: 1
            }, {
              where: {username: sceneId}
            }).catch(err => logger.error(err));
          });
        }
      }
    });
  }
};

/**
 * 获取JSAPITicket
 */
module.exports.getJSAPIConfig = {
  validate: {
    query: {
      url: Joi.string().required()
    },
    options: {
      allowUnknown: true
    }
  },
  handler: function (request, reply) {
    const query = request.query;
    util_weChat.getJSAPIConfigUseScope(config.weChat.bitekuang.name, query.url).then(data => {
      reply(data);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    })
  }
};

/**
 * 获取二维码
 */
module.exports.getQRCode = {
  // auth: 'jwt',
  validate: {
    query: {
      jwt: Joi.string().required()
    },
    options: {
      allowUnknown: true
    }
  },
  handler: function (req, reply) {
    const session = JWT.decode(req.query.jwt, process.env.JWT_SECRET);

    //获取ticket
    util_weChat.getQRCodeTicketUseScope(config.weChat.bitekuang.name, session.username).then(data => {
      const url = `https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=${data}`;
      request(url).pipe(req.raw.res);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};

const returnUrl = "http://www.cooin.com/api/weChat/test?a=a&b=b#hash";
const urlObj = url.parse(returnUrl);
console.log(urlObj);
