'use strict';
const Joi = require('joi');
const Boom = require('boom');
const moment = require('moment-timezone');
const config = require('../../config/config');
const util_weChat = require('../../lib/weChat');
const util_string = require('../../lib/string');
const client = require('../../lib/redis').getClient();

/**
 * 微信--发送模板消息---通用（账户操作信息提醒）
 */
module.exports.sendTemplateMsgForCommon = {
  auth: 'jwt',
  validate: {
    payload: {
      first: Joi.string().required(),
      theme: Joi.string().required(),
      content: Joi.string().required(),
      remark: Joi.string().required(),
      url: Joi.string(),
    },
    options: {
      allowUnknown: true
    }
  },
  handler: function (request, reply) {

    const DB = request.getDb(process.env.DB_DBNAME);
    const Master_register = DB.getModel('master_register');

    const payload = request.payload;

    const time = moment().format('YYYY-MM-DD HH:mm:ss');

    const key = 'weChatTemplateMsg';
    const expire = 3600;

    client.ttlAsync(key).then(data => {
      if (data > 0) throw Boom.badRequest('还有' + data + '秒才能再次发送消息');
      //查询订阅用户
      return Master_register.findAll({
        attributes: ['username', 'openid'],
        where: {
          openid: {$ne: null},
          subscribe: 1
        }
      })
    }).then(data => {
      reply();
      //发送消息
      data.forEach(item => {
        const content = payload.content.replace('{{username}}', util_string.hidePhoneNumber(item.username));
        util_weChat.sendTemplateMsgForCommon(config.weChat.bitekuang.name, item.openid, payload.first, payload.theme, content, time, payload.remark, payload.url);
      });
      //设置消息倒计时
      client.multi().set(key, '').expire(key, expire).execAsync();
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });
  }
};
