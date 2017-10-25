const http = require('http');
const https = require('https');
const request = require('request');
const qs = require('querystring');
const fs = require('fs');
const xml2js = require('xml2js');
const moment = require('moment-timezone');
const config = require('../config/config');
const util_string = require('../lib/string');
const util_encrypt = require('../lib/encrypt');
const client = require('./redis').getClient();

const accessToken = {};
const JSAPITicket = {};

/**
 * 获取access_token（基础支持）
 * @param scope
 */
exports.getAccessTokenUseScope = scope => {

  //开发环境从控制中心获取
  if (process.env.NODE_ENV == 'develop') return this.getAccessTokenFromDistributionCenterByScope(scope);

  return new Promise((resolve, reject) => {

    const internal = {};

    internal.getAccessToken = () => {
      return new Promise((resolve, reject) => {
        //这是需要提交的数据
        const post_data = {
          appid: config.weChat[scope].APPID,
          secret: config.weChat[scope].SECRET,
          grant_type: config.weChat[scope].GRANT_TYPE
        };
        const content = qs.stringify(post_data);
        const options = {
          hostname: 'api.weixin.qq.com',
          port: 443,
          path: '/cgi-bin/token',
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': content.length
          }
        };
        const req = https.request(options, function (response) {
          response.setEncoding('utf8');
          let responseData = '';
          response.on('data', function (data) {
            responseData += data;
          });
          response.on('end', function () {
            responseData = JSON.parse(responseData);
            if (responseData.errcode) return reject(responseData);
            resolve(responseData);
          });
        });
        req.on('error', function (e) {
          reject(e);
        });
        req.write(content);
        req.end();
      });
    }

    //scope不存在
    if (!config.weChat[scope]) throw new Error('scope not exist');

    //读取缓存
    if (accessToken[scope] && accessToken[scope].expiredAt > Date.now()) return resolve(accessToken[scope]);

    //获取
    internal.getAccessToken().then(data => {
      accessToken[scope] = accessToken[scope] ? accessToken[scope] : {};
      accessToken[scope].accessToken = data.access_token;
      accessToken[scope].expiredAt = Date.now() + Number(data.expires_in) * 1000;
      resolve(accessToken[scope]);
    }).catch(err => {
      reject(err);
    });

  });

}

/**
 * 从控制中心获取access_token（基础支持）
 * @param scope
 */
exports.getAccessTokenFromDistributionCenterByScope = scope => {

  return new Promise((resolve, reject) => {

    //这是需要提交的数据
    const post_data = {scope};

    const content = qs.stringify(post_data);

    const options = {
      hostname: 'www.bitekuang.com',
      port: 443,
      path: '/api/weChat/getAccessToken?' + content,
      method: 'get',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    };
    const req = https.request(options, function (response) {
      response.setEncoding('utf8');
      let responseData = '';
      response.on('data', function (data) {
        responseData += data;
      });
      response.on('end', function () {
        responseData = JSON.parse(responseData);
        resolve(responseData);
      });
    });
    req.on('error', function (e) {
      reject(e);
    });
    req.end();
  });

}

/**
 * 获取access_token（网页授权access_token）
 * @param scope
 * @param code
 *
 * data: {
        'access_token':'ACCESS_TOKEN',
        'expires_in':7200,
        'refresh_token':'REFRESH_TOKEN',
        'openid':'OPENID',
        'scope':'SCOPE',
        'unionid': 'o6_bmasdasdsad6_2sgVt7hMZOPfL'
    }
 *
 */
exports.getAccessTokenByCodeUseScope = (scope, code) => {
  return new Promise((resolve, reject) => {
    //这是需要提交的数据
    const post_data = {
      appid: config.weChat[scope].APPID,
      secret: config.weChat[scope].SECRET,
      code: code,
      grant_type: 'authorization_code'
    };
    const content = qs.stringify(post_data);
    const options = {
      hostname: 'api.weixin.qq.com',
      port: 443,
      path: '/sns/oauth2/access_token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': content.length
      }
    };
    const req = https.request(options, function (response) {
      response.setEncoding('utf8');
      let responseData = '';
      response.on('data', function (data) {
        responseData += data;
      });
      response.on('end', function () {
        responseData = JSON.parse(responseData);
        if (responseData.errcode) return reject(responseData);
        resolve(responseData);
      });
    });
    req.on('error', function (e) {
      reject(e);
    });
    req.write(content);
    req.end();
  });

}

/**
 * 获取微信用户信息--网页授权
 * @param access_token（网页授权access_token）
 * @param openid
 *
 * data: {
        'openid':' OPENID',
        ' nickname': NICKNAME,
        'sex':'1',
        'province':'PROVINCE'
        'city':'CITY',
        'country':'COUNTRY',
        'headimgurl': 'headimgurl',
        'privilege':[
            'PRIVILEGE1'
            'PRIVILEGE2'
        ],
        'unionid': 'o6_bmasdasdsad6_2sgVt7hMZOPfL'
    }
 *
 */
exports.getUserInfo = (access_token, openid) => {
  return new Promise((resolve, reject) => {
    //这是需要提交的数据
    const post_data = {
      access_token: access_token,
      openid: openid
    };
    const content = qs.stringify(post_data);
    const options = {
      hostname: 'api.weixin.qq.com',
      port: 443,
      path: '/sns/userinfo',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': content.length
      }
    };
    const req = https.request(options, function (response) {
      response.setEncoding('utf8');
      let responseData = '';
      response.on('data', function (data) {
        responseData += data;
      });
      response.on('end', function () {
        responseData = JSON.parse(responseData);
        if (responseData.errcode) return reject(responseData);
        resolve(responseData);
      });
    });
    req.on('error', function (e) {
      reject(e);
    });
    req.write(content);
    req.end();
  });

}

/**
 * 获取微信用户信息--基础支持
 * @param scope
 * @param openid
 *
 * {
    "subscribe": 1,
    "openid": "o6_bmjrPTlm6_2sgVt7hMZOPfL2M",
    "nickname": "Band",
    "sex": 1,
    "language": "zh_CN",
    "city": "广州",
    "province": "广东",
    "country": "中国",
    "headimgurl":    "http://wx.qlogo.cn/mmopen/g3MonUZtNHkdmzicIlibx6iaFqAc56vxLSUfpb6n5WKSYVY0ChQKkiaJSgQ1dZuTOgvLLrhJbERQQ4eMsv84eavHiaiceqxibJxCfHe/0",
   "subscribe_time": 1382694957,
   "unionid": " o6_bmasdasdsad6_2sgVt7hMZOPfL"
   "remark": "",
   "groupid": 0
}
 */
exports.getUserInfoUseScope = (scope, openid) => {
  return new Promise((resolve, reject) => {
    //获取accessToken
    return this.getAccessTokenUseScope(scope).then(data => {
      //请求
      request({
        url: `https://api.weixin.qq.com/cgi-bin/user/info?${qs.stringify({
          access_token: data.accessToken,
          openid: openid
        })}`,
        method: "GET",
        json: true
      }, (err, httpResponse, body) => {
        if (err) return reject(err);
        if (body.errcode) return reject(body);
        resolve(body);
      });
    }).catch(err => {
      reject(err)
    });
  });
}

/**
 * 发送模板消息
 * @param scope
 * @param openid
 * @param template_id
 * @param url
 * @param template
 */
exports.sendTemplateMsgUseScope = (scope, openid, template_id, url, template) => {
  return new Promise((resolve, reject) => {
    //获取accessToken
    return this.getAccessTokenUseScope(scope).then(data => {
      //请求
      request({
        url: `https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=${data.accessToken}`,
        method: "POST",
        json: true,
        body: {
          'touser': openid,
          'template_id': template_id,
          'url': url,
          'data': template
        }
      }, (err, httpResponse, body) => {
        if (err) return reject(err);
        if (body.errcode != 0) return reject(body);
        resolve(body);
      });
    }).catch(err => {
      reject(err)
    });
  });
}

/**
 * 发送模板消息--登录提醒
 * @param scope
 * @param openid
 * @param username
 * @param ip
 */
exports.sendTemplateMsgForUserLogin = (scope, openid, username, ip) => {
  return this.sendTemplateMsgUseScope(scope, openid, config.weChat[scope].templates.登录提醒.template_id, config.weChat[scope].templates.登录提醒.url(), {
    first: {
      value: `用户${username}，您已成功登录！`,
      color: '#173177'
    },
    //登录时间
    keyword1: {
      value: moment().format('YYYY-MM-DD HH:mm:ss'),
      color: '#173177'
    },
    //登录IP
    keyword2: {
      value: ip,
      color: '#173177'
    },
    remark: {
      value: '如果本次登录非您本人操作，请尽快修改密码',
      color: '#173177'
    }
  });
}

/**
 * 发送模板消息--通用（账户操作信息提醒）
 * @param scope
 * @param openid
 * @param first
 * @param theme
 * @param content
 * @param time
 * @param remark
 */
exports.sendTemplateMsgForCommon = (scope, openid, first, theme, content, time, remark, url) => {
  return this.sendTemplateMsgUseScope(scope, openid, config.weChat[scope].templates.账户操作信息提醒.template_id, config.weChat[scope].templates.账户操作信息提醒.url(url), {
    first: {
      value: first,
      color: '#173177'
    },
    //主题
    keyword1: {
      value: theme,
      color: '#173177'
    },
    //内容
    keyword2: {
      value: content,
      color: '#173177'
    },
    //时间
    keyword3: {
      value: time,
      color: '#173177'
    },
    remark: {
      value: remark,
      color: '#173177'
    }
  });
}

/**
 * 发送模板消息--充值到账通知
 * @param scope
 * @param openid
 * @param username
 * @param time
 * @param amount
 * @param balance
 */
exports.sendTemplateMsgForChargeSuccess = (scope, openid, username, time, amount, balance) => {
  return this.sendTemplateMsgUseScope(scope, openid, config.weChat[scope].templates.充值到账通知.template_id, config.weChat[scope].templates.充值到账通知.url(), {
    first: {
      value: `用户${username}，您的充值已成功`,
      color: '#173177'
    },
    //充值时间
    keyword1: {
      value: moment(time).format('YYYY-MM-DD HH:mm:ss'),
      color: '#173177'
    },
    //充值金额
    keyword2: {
      value: `${amount}元`,
      color: '#173177'
    },
    //可用余额
    keyword3: {
      value: `${balance}元`,
      color: '#173177'
    },
    remark: {
      value: '如有疑问，请与我们联系，咨询热线：400-6080-518',
      color: '#173177'
    }
  });
}

/**
 * 发送模板消息--汇款状态通知
 * @param scope
 * @param openid
 * @param username
 * @param time
 * @param amount
 * @param fee
 * @param time
 * @param bankNumber
 */
exports.sendTemplateMsgForRemit = (scope, openid, username, amount, fee, time, bankNumber) => {
  return this.sendTemplateMsgUseScope(scope, openid, config.weChat[scope].templates.汇款状态通知.template_id, config.weChat[scope].templates.汇款状态通知.url(), {
    first: {
      value: `用户${username}，您的提现已汇出，实际到账${amount}元（手续费${fee}元）`,
      color: '#173177'
    },
    //汇款状态
    keyword1: {
      value: '已汇出',
      color: '#173177'
    },
    //汇款人
    keyword2: {
      value: config.bank.accountName,
      color: '#173177'
    },
    //汇款时间
    keyword3: {
      value: moment(time).format('YYYY-MM-DD HH:mm:ss'),
      color: '#173177'
    },
    remark: {
      value: `请注意查收（提现银行卡尾号${bankNumber.toString().substring(bankNumber.toString().length - 4, bankNumber.toString().length)}）`,
      color: '#173177'
    }
  });
}

/**
 * 发送模板消息--定投扣款提醒
 * @param scope
 * @param openid
 * @param username
 * @param amount
 * @param time
 * @param autoInvestId
 */
exports.sendTemplateMsgForAutoInvestTip = (scope, openid, username, amount, time, autoInvestId) => {
  return this.sendTemplateMsgUseScope(scope, openid, config.weChat[scope].templates.定投扣款提醒.template_id, config.weChat[scope].templates.定投扣款提醒.url(), {
    first: {
      value: `用户${username}，您在比特矿设定的定投（序号：${autoInvestId}）将进行扣款`,
      color: '#173177'
    },
    //产品名称
    keyword1: {
      value: 'BTC定投',
      color: '#173177'
    },
    //扣款时间
    keyword2: {
      value: moment(time).format('YYYY-MM-DD'),
      color: '#173177'
    },
    //扣款金额
    keyword3: {
      value: `${amount}元`,
      color: '#173177'
    },
    remark: {
      value: `请确保您的比特矿人民币余额充足`,
      color: '#173177'
    }
  });
}

/**
 * 发送模板消息--产品到期提醒（定投到期）
 * @param scope
 * @param openid
 * @param username
 * @param period
 * @param amount
 * @param count
 * @param time
 * @param autoInvestId
 */
exports.sendTemplateMsgForAutoInvestExpire = (scope, openid, username, period, amount, count, time, autoInvestId) => {
  return this.sendTemplateMsgUseScope(scope, openid, config.weChat[scope].templates.产品到期提醒.template_id, config.weChat[scope].templates.定投扣款提醒.url(), {
    first: {
      value: `尊敬的用户${username}，您在比特矿设定的定投(序号: ${autoInvestId})已到期，总期数 ${period}期，定投总金额 ${amount}元，已购买比特币总额 ${count}btc ，您可以登录比特矿 - 盈利工具 - 定投管理进行赎回操作。`,
      color: '#173177'
    },
    //产品名称
    productname: {
      value: 'BTC定投',
      color: '#173177'
    },
    //到期时间
    date: {
      value: moment(time).format('YYYY-MM-DD'),
      color: '#173177'
    },
    remark: {
      value: ``,
      color: '#173177'
    }
  });
}

/**
 * 发送模板消息--问题回复通知
 * @param scope
 * @param openid
 * @param username
 * @param question
 * @param answerer
 * @param content
 */
exports.sendTemplateMsgForReply = (scope, openid, username, question, answerer, content) => {
  return this.sendTemplateMsgUseScope(scope, openid, config.weChat[scope].templates.问题回复通知.template_id, config.weChat[scope].templates.问题回复通知.url(), {
    first: {
      value: `尊敬的用户${username}，您在比特矿的提问有人回复了`,
      color: '#173177'
    },
    //问题
    keyword1: {
      value: question,
      color: '#173177'
    },
    //回答者
    keyword2: {
      value: answerer,
      color: '#173177'
    },
    //回答内容
    keyword3: {
      value: content,
      color: '#173177'
    },
    remark: {
      value: `感谢您的使用！`,
      color: '#173177'
    }
  });
}

/**
 * 发送模板消息--委托成交提醒
 * @param scope
 * @param openid
 * @param username
 * @param transType
 * @param coinType
 * @param quantity
 * @param total
 * @param time
 */
exports.sendTemplateMsgForMatch = (scope, openid, username, transType, coinType, quantity, total, time) => {
  return this.sendTemplateMsgUseScope(scope, openid, config.weChat[scope].templates.委托成交提醒.template_id, config.weChat[scope].templates.委托成交提醒.url(), {
    first: {
      value: `尊敬的用户${username}，您的委托已成交（成交总金额:人民币${total} 元）`,
      color: '#173177'
    },
    //数量
    keyword1: {
      value: (transType == 'buy' ? '买入' : '卖出') + quantity + ' ' + config.coin[coinType].name,
      color: '#173177'
    },
    //价格
    keyword2: {
      value: (total / quantity).toFixed(2),
      color: '#173177'
    },
    //时间
    keyword3: {
      value: moment(time).format('YYYY-MM-DD HH:mm:ss'),
      color: '#173177'
    },
    remark: {
      value: `点击查看交易详情`,
      color: '#173177'
    }
  });
}

/**
 * 生成文本消息
 */
exports.generateMsgForText = (openid, content) => {
  return `<xml>
            <ToUserName><![CDATA[${openid}]]></ToUserName>
            <FromUserName><![CDATA[${config.weChat.bitekuang.account}]]></FromUserName>
            <CreateTime>${Date.now()}</CreateTime>
            <MsgType><![CDATA[text]]></MsgType>
            <Content><![CDATA[${content}]]></Content>
          </xml>`;
}

/**
 * 获取jsapi_ticket
 * @param scope
 */
exports.getJSAPITicketUseScope = scope => {

  //开发环境从控制中心获取
  if (process.env.NODE_ENV == 'develop') return this.getJSAPITicketFromDistributionCenterByScope(scope);

  const internal = {};

  internal.getJSAPITicket = access_token => {
    return new Promise((resolve, reject) => {
      //请求
      request({
        url: `https://api.weixin.qq.com/cgi-bin/ticket/getticket?${qs.stringify({
          access_token: access_token,
          type: 'jsapi'
        })}`,
        method: "GET",
        json: true
      }, (err, httpResponse, body) => {
        if (err) return reject(err);
        if (body.errcode != 0) return reject(body);
        resolve(body);
      });
    });
  }

  //scope不存在
  if (!config.weChat[scope]) throw new Error('scope not exist');

  //读取缓存
  if (JSAPITicket[scope] && JSAPITicket[scope].expiredAt > Date.now()) return Promise.resolve(JSAPITicket[scope]);

  //获取
  return this.getAccessTokenUseScope(scope).then(data => {
    return internal.getJSAPITicket(data.accessToken);
  }).then(data => {
    JSAPITicket[scope] = JSAPITicket[scope] ? JSAPITicket[scope] : {};
    JSAPITicket[scope].ticket = data.ticket;
    JSAPITicket[scope].expiredAt = Date.now() + Number(data.expires_in) * 1000;
    return Promise.resolve(JSAPITicket[scope]);
  });

}

/**
 * 从控制中心获取jsapi_ticket
 * @param scope
 */
exports.getJSAPITicketFromDistributionCenterByScope = scope => {

  return new Promise((resolve, reject) => {
    //请求
    request({
      url: `https://www.bitekuang.com/api/weChat/getJSAPITicket?${qs.stringify({
        scope
      })}`,
      method: "GET",
      json: true
    }, (err, httpResponse, body) => {
      if (err) return reject(err);
      resolve(body);
    });
  });

}

/**
 * JS API CONFIG
 * @param scope
 */
exports.getJSAPIConfigUseScope = (scope, url) => {
  const timestamp = parseInt(Date.now() / 1000);
  const nonceStr = util_string.random(20);
  return this.getJSAPITicketUseScope(scope).then(data => {
    const JSAPITicket = data.ticket;
    const signature = this.getSignature(timestamp, JSAPITicket, nonceStr, url);
    return Promise.resolve({
      appId: config.weChat[scope].APPID,
      timestamp: timestamp,
      nonceStr: nonceStr,
      signature: signature
    });
  });
}

/**
 * JS API CONFIG
 * @param scope
 */
exports.getSignature = (timestamp, JSAPITicket, nonceStr, url) => {
  const signValue = "jsapi_ticket=" + JSAPITicket + "&noncestr=" + nonceStr + "&timestamp=" + timestamp + "&url=" + url;
  return util_encrypt.SHA1(signValue);
}

/**
 * 取二维码ticket
 * @param scope
 * @param sceneId
 */
exports.getQRCodeTicketUseScope = (scope, sceneId) => {

  //缓存时间
  const expire = 3600;
  //微信二维码票据缓存key前缀
  const keyPrefix = 'QRCodeTicket';
  //key生成规则：keyPrefix_sceneId_QRCodeTicket
  const keyWildcard = keyPrefix + '_' + sceneId + '_*';

  const internal = {};

  internal.getQRCodeTicket = access_token => {
    return new Promise((resolve, reject) => {
      //请求
      request({
        url: `https://api.weixin.qq.com/cgi-bin/qrcode/create?${qs.stringify({
          access_token: access_token
        })}`,
        method: "POST",
        json: true,
        body: {
          expire_seconds: expire,
          action_name: 'QR_SCENE',
          action_info: {
            scene: {
              scene_id: sceneId
            }
          }
        }
      }, (err, httpResponse, body) => {
        if (err) return reject(err);
        if (body.errcode) return reject(body);
        resolve(body);
      });
    });
  }

  //scope不存在
  if (!config.weChat[scope]) throw new Error('scope not exist');

  //根据通配符查找key
  return client.keysAsync(keyWildcard).then(data => {
    //有对应的key，从key中截取QRCodeTicket
    if (data.length == 1) return Promise.resolve(data[0].match(/^QRCodeTicket_\d+_(.*)$/)[1]);
    let QRCodeTicket;
    //获取
    return this.getAccessTokenUseScope(scope).then(data => {
      return internal.getQRCodeTicket(data.accessToken);
    }).then(data => {
      QRCodeTicket = data.ticket;
      //放入缓存
      const key = keyPrefix + '_' + sceneId + '_' + QRCodeTicket;
      return client.multi().set(key, '').expire(key, expire).execAsync();
    }).then(() => {
      return Promise.resolve(QRCodeTicket);
    });
  });

}

/**
 * 通过二维码ticket获取sceneId
 * @param QRCodeTicket
 */
exports.getSceneIdByQRCodeTicket = QRCodeTicket => {

  //微信二维码票据缓存key前缀
  const keyPrefix = 'QRCodeTicket';
  //key生成规则：keyPrefix_sceneId_QRCodeTicket
  const keyWildcard = keyPrefix + '_' + '*_' + QRCodeTicket;

  //根据通配符查找key
  return client.keysAsync(keyWildcard).then(data => {
    //有对应的key，从key中截取sceneId
    if (data.length == 1) return Promise.resolve(data[0].split('_')[1]);
    return Promise.reject(new Error('QRCodeTicket is not available'));
  });

}
