const moment = require('moment-timezone');
const client = require('./redis').getClient();
const util_number = require('./number');

let keyData = {
  userborrow: {
    count: parseInt(process.env.PER_SECOND_USER_BORROW_ID_COUNT),
    code: '1',
    prefix: 'id_userborrow_',
    latest: 'id_userborrow_latest',
  },
  orderlist_bid: {
    count: parseInt(process.env.PER_SECOND_ORDER_ID_COUNT),
    code: '2',
    prefix: 'id_orderlist_bid_',
    latest: 'id_orderlist_bid_latest',
  },
  followInvest: {
    count: parseInt(process.env.PER_SECOND_FOLLOW_INVEST_ID_COUNT),
    code: '3',
    prefix: 'id_followInvest_',
    latest: 'id_followInvest_latest',
  },
  fund_in_out: {
    count: parseInt(process.env.PER_SECOND_TRANS_NUMBER_COUNT),
    code: '4',
    prefix: 'id_fund_in_out_',
    latest: 'id_fund_in_out_latest',
  },
  orderlist: {
    count: parseInt(process.env.PER_SECOND_ORDER_LIST_ID_COUNT),
    code: '5',
    prefix: 'id_orderlist_',
    latest: 'id_orderlist_latest',
  },
  applywithdraw: {
    count: parseInt(process.env.PER_SECOND_APPLY_WITHDRAW_ID_COUNT),
    code: '6',
    prefix: 'id_applywithdraw_',
    latest: 'id_applywithdraw_latest',
  },
  orderlist_bid_log: {
    count: parseInt(process.env.PER_SECOND_ORDER_LIST_BID_LOG_COUNT),
    code: '7',
    prefix: 'id_orderlist_bid_log_',
    latest: 'id_orderlist_bid_log_latest',
  },
  borrowlist: {
    count: parseInt(process.env.PER_SECOND_BORROW_LIST_ID_COUNT),
    code: '8',
    prefix: 'id_borrowlist_',
    latest: 'id_borrowlist_latest',
  },
  question: {
    count: parseInt(process.env.PER_SECOND_QUESTION_ID_COUNT),
    code: '9',
    prefix: 'id_question_',
    latest: 'id_question_latest',
  }
};

let internal = {};

internal.array = length => {
  let array = [];
  for (let j = 0; j < length; j++) {
    array.push(j);
  }
  return array;
}

let value = {
  100: internal.array(100),
  1000: internal.array(1000),
  10000: internal.array(10000),
  100000: internal.array(100000),
  1000000: internal.array(1000000)
};

/**
 * ID生成器
 * @param type
 * @returns {Promise.<*>}
 */
exports.generate = type => {
  if (!keyData[type]) return Promise.reject(new Error('ID类型不存在'));
  //时间戳（秒）
  let current = parseInt(Date.now() / 1000);
  //每次生成ID覆盖时长
  let duration = 4;
  //ID过期延时时长
  let delay = 5;

  //查询latest
  return client.getAsync(keyData[type].latest).then(data => {

    if (!data) duration *= 2;

    let i = 0;

    let internal = {};

    internal.do = () => {
      let serviceTime = current + i;
      let key = keyData[type].prefix + serviceTime;
      return client.existsAsync(key).then(data => {
        if (data == 1) return Promise.resolve(data);
        return client.multi().sadd(key, value[keyData[type].count]).expire(key, delay + i).execAsync();
      }).then(data => {
        if (++i < duration) return internal.do();
        return Promise.resolve();
      });
    };

    return internal.do();

  }).then(data => {

    //设置latest
    return client.setAsync(keyData[type].latest, current + duration);
  })

}

/**
 * 获取ID
 * @param type 类型
 * @param code 业务代码
 * @returns {Promise.<*>}
 */
exports.get = (type, code = 0) => {
  if (!keyData[type]) return Promise.reject(new Error('ID类型不存在'));
  //时间戳（秒）
  let current = parseInt(Date.now() / 1000);
  //键
  let key = keyData[type].prefix + current;
  //随机获取
  return client.spopAsync(key).then(data => {
    //组合ID（业务代码 + 获取时间戳 + 不重复随机数）
    let id = keyData[type].code + util_number.fill(code, 2) + current + util_number.fill(data, 6);
    return Promise.resolve(id);
  });
}

/**
 * 获取ID数组
 * @param type 类型
 * @param length 长度
 * @param code 业务代码
 * @returns {Promise.<*>}
 */
exports.gets = (type, length, code = 0) => {
  if (!keyData[type]) return Promise.reject(new Error('ID类型不存在'));
  if (isNaN(length)) return Promise.reject(new Error('length必须是数字'));
  length = parseInt(length);
  let task = [];
  for (let i = 0; i < length; i++) {
    task.push(this.get(type, code))
  }
  return Promise.all(task);
}

/**
 * 导出配置
 */
exports.config = keyData;
