const request = require('request');
const iconv = require('iconv-lite');
const moment = require('moment-timezone');

const value = {
  gold: {
    value: 'hf_GC',
    index: 0,
    now:0,
    percent: 1,
    end: 7
  },
  oil: {
    value: 'hf_CL',
    index: 0,
    now:0,
    percent: 1,
    end: 7
  },
  share_SH: {
    value: 's_sh000001',
    index: 1,
    now:1,
    range: 2,
    percent: 3
  },
  share_SZ: {
    value: 's_sz399001',
    index: 1,
    now:1,
    range: 2,
    percent: 3
  },
  share_HK: {
    value: 'rt_hkHSI',
    index: 2,
    now:2,
    range: 7,
    percent: 8
  },
  dollar: {
    value: 'fx_susdcny',
    index: 1,
    now:1,
    range: 11,
    percent: 10
  }
};

/**
 * 从sina获取实时行情
 * @param type
 */
exports.real = type => {

  if (!value[type]) return Promise.reject(new Error(`类型（${type}）不存在`));

  return new Promise((resolve, reject) => {
    request.get({
      url: `http://hq.sinajs.cn/rn=${Date.now()}list=${value[type].value}`,
      encoding: null,
      headers: {
      }
    }, function (err, httpResponse, body) {
      if (err) return reject(err);
      let data = iconv.decode(body, 'GBK');
      const startIndex = data.indexOf('"');
      data = data.substring(startIndex + 1);
      const endIndex = data.indexOf('"');
      data = data.substring(0, endIndex);
      const array = data.split(',');
      const response = {
        now: array[value[type].now],
        range: value[type].range ? array[value[type].range] : Number(array[value[type].end] - array[value[type].now]).toFixed(2),
        percent: array[value[type].percent]
      };
      resolve(response);
    });
  });
}

/**
 * 从sina获取所有实时行情
 * @param type
 */
exports.realAll = () => {

  let task = [];
  for(let key in value) {
    task.push(this.real(key));
  }
  return Promise.all(task).then(datas => {
    let i = 0;
    let response = {};
    for(let key in value) {
      response[key] = datas[i++];
    }
    return Promise.resolve(response);
  });
}
