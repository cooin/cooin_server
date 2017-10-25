const url = require('url');
const qs = require('querystring');

/**
 * 向url地址添加参数
 * @param href
 * @param key
 * @param value
 */
exports.insert = (href, key, value) => {
  const urlObj = url.parse(href);
  const params = this.getParams(href);
  params[key] = value;
  const newHref = `${urlObj.protocol}//${urlObj.host}${(urlObj.path == urlObj.pathname && urlObj.path == '/') ? '' : urlObj.pathname}?${qs.stringify(params)}${urlObj.hash ? urlObj.hash : ''}`;
  return newHref;
}

/**
 * 获取url地址的参数
 * @param href
 */
exports.getParams = href => {
  const urlObj = url.parse(href);
  const query = urlObj.query;
  if (!query) return {};
  const params = {};
  const arrayKV = query.split("&");
  arrayKV.forEach(item => {
    const array = item.split("=");
    if (array.length == 2) params[array[0]] = array[1];
  });
  return params;
}


// const returnUrl = "http://www.cooin.com/api/weChat/test?a=a&b=b&c=&#hash";
// console.log(this.getParams(returnUrl));
// console.log(this.getParams('http://www.cooin.com/api/weChat/test?'));
// console.log(this.insert(returnUrl, 'openid', 'openid'));
// console.log(this.insert('http://cooin.yizhizhun.com', 'openid', 'openid'));
// console.log(this.insert('http://cooin.yizhizhun.com/mobile/guaguale.html', 'openid', 'openid'));
