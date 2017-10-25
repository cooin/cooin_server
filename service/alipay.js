const https = require('https');
const request = require('request');

let data_cookie = 'RZ135wKFy3cp6WmH3nCUaai0hJ4UzXauthRZ13GZ00';

/**
 * 设置cookie
 *
 * @param server
 * @param cookie
 * @returns {Promise.<T>}
 */
exports.setCookie = (server, cookie) => {
  return new Promise((resolve, reject) => {
    data_cookie = cookie;
    resolve();
  });
};

/**
 * 获取cookie
 *
 * @param server
 * @returns {Promise.<T>}
 */
exports.getCookie = (server) => {

  //开发环境从控制中心获取
  if (process.env.NODE_ENV == 'develop') return this.getCookieFromDistributionCenter();

  return new Promise((resolve, reject) => {
    resolve(data_cookie);
  });
};

/**
 * 从控制中心获取cookie
 */
exports.getCookieFromDistributionCenter = () => {

  logger.info('开发环境从控制中心获取');

  return new Promise((resolve, reject) => {

    request({
      url: `http://${process.env.DOMAIN_PRODUCTION}/api/alipay/getCookie`,
      method: 'GET'
    }, function (err, httpResponse, body) {
      if (err) reject(err);

      logger.info('cookie', body);
      resolve(body);
    });
  });

}
