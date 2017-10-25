const request = require('request');
const cheerio = require('cheerio');
const moment = require('moment-timezone');
const qs = require('querystring');

const value = {
  gold: {
    code: 8830,
    data: null,
    latestDate: null
  },
  oil: {
    code: 8849,
    data: null,
    latestDate: null
  },
  share_SH: {
    code: 40820,
    data: null,
    latestDate: null
  },
  share_HK: {
    code: 179,
    data: null,
    latestDate: null
  },
  dollar: {
    code: 2111,
    data: null,
    latestDate: null
  }
};

/**
 * 从investing获取月均价
 * @param type
 */
exports.month = type => {

  return new Promise((resolve, reject) => {

    let latestDate = moment().format('YYYY/MM/DD');

    if (value[type].latestDate == latestDate && value[type].data) resolve(value[type].data);

    const query = {
      action: 'historical_data',
      curr_id: value[type].code,
      st_date: '2013/06/01',
      end_date: latestDate,
      interval_sec: 'Monthly'
    };
    request.post({
      url: `https://cn.investing.com/instruments/HistoricalDataAjax`,
      form: query,
      // encoding: null,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.95 Safari/537.36',
        'X-Requested-With': 'XMLHttpRequest'
      }
    }, function (err, httpResponse, body) {
      if (err) return reject(err);
      let data = {};
      let $ = cheerio.load(body);
      $('#curr_table tbody tr').each(function () {
        let key = moment(parseInt($(this).children().eq(0).attr('data-real-value')) * 1000).format('YYYYMM');
        data[key] = $(this).children().eq(1).text();
      });
      resolve(data);
    });
  });
}

/**
 * 从investing获取日均价
 * @param type
 */
exports.date = type => {

  return new Promise((resolve, reject) => {

    let latestDate = moment().format('YYYY/MM/DD');

    if (value[type].latestDate == latestDate && value[type].data) resolve(value[type].data);

    const query = {
      action: 'historical_data',
      curr_id: value[type].code,
      st_date: '2013/06/12',
      end_date: latestDate,
      interval_sec: 'Daily'
    };
    request.post({
      url: `https://cn.investing.com/instruments/HistoricalDataAjax`,
      form: query,
      // encoding: null,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.95 Safari/537.36',
        'X-Requested-With': 'XMLHttpRequest'
      }
    }, function (err, httpResponse, body) {
      if (err) return reject(err);
      let data = {};
      let $ = cheerio.load(body);
      $('#curr_table tbody tr').each(function () {
        let key = moment(parseInt($(this).children().eq(0).attr('data-real-value')) * 1000).format('YYYYMMDD');
        data[key] = $(this).children().eq(1).text();
      });
      resolve(data);
    });
  });
}

/**
 * 从investing获取实时行情
 * @param type
 */
exports.real = type => {

  return new Promise((resolve, reject) => {

    const query = {
      pair_id: value[type].code,
      pair_id_for_news: value[type].code,
      chart_type: 'area',
      pair_interval: 60,
      candle_count: 120,
      events: 'yes',
      volume_series: 'yes',
      period: ''
    };
    request.get({
      url: `https://cn.investing.com/common/modules/js_instrument_chart/api/data.php?${qs.stringify(query)}`,
      // encoding: null,
      headers: {
        Accept: 'application/json, text/javascript, */*; q=0.01',
        // 'Accept-Encoding': 'gzip, deflate, sdch, br',
        'Accept-Language': 'zh-CN,zh;q=0.8,en;q=0.6',
        Connection: 'keep-alive',
        Cookie: 'PHPSESSID=vi5rt7qtuircromdk4tqbk5se3; adBlockerNewUserDomains=1486967147; StickySession=id.59049741037.211.cn.investing.com; __gads=ID=e78dac86cebd24b4:T=1486967150:S=ALNI_MbTNkpKITnvp_v8Gk4jzKgYRLDlcQ; geoC=CN; SideBlockUser=a%3A2%3A%7Bs%3A10%3A%22stack_size%22%3Ba%3A1%3A%7Bs%3A11%3A%22last_quotes%22%3Bi%3A8%3B%7Ds%3A6%3A%22stacks%22%3Ba%3A1%3A%7Bs%3A11%3A%22last_quotes%22%3Ba%3A7%3A%7Bi%3A0%3Ba%3A3%3A%7Bs%3A7%3A%22pair_ID%22%3Bs%3A4%3A%228830%22%3Bs%3A10%3A%22pair_title%22%3Bs%3A0%3A%22%22%3Bs%3A9%3A%22pair_link%22%3Bs%3A17%3A%22%2Fcommodities%2Fgold%22%3B%7Di%3A1%3Ba%3A3%3A%7Bs%3A7%3A%22pair_ID%22%3Bs%3A4%3A%228849%22%3Bs%3A10%3A%22pair_title%22%3Bs%3A0%3A%22%22%3Bs%3A9%3A%22pair_link%22%3Bs%3A22%3A%22%2Fcommodities%2Fcrude-oil%22%3B%7Di%3A2%3Ba%3A3%3A%7Bs%3A7%3A%22pair_ID%22%3Bs%3A5%3A%2240820%22%3Bs%3A10%3A%22pair_title%22%3Bs%3A0%3A%22%22%3Bs%3A9%3A%22pair_link%22%3Bs%3A27%3A%22%2Findices%2Fshanghai-composite%22%3B%7Di%3A3%3Ba%3A3%3A%7Bs%3A7%3A%22pair_ID%22%3Bs%3A5%3A%2244486%22%3Bs%3A10%3A%22pair_title%22%3Bs%3A0%3A%22%22%3Bs%3A9%3A%22pair_link%22%3Bs%3A18%3A%22%2Findices%2Fchina-a50%22%3B%7Di%3A4%3Ba%3A3%3A%7Bs%3A7%3A%22pair_ID%22%3Bs%3A5%3A%2228930%22%3Bs%3A10%3A%22pair_title%22%3Bs%3A0%3A%22%22%3Bs%3A9%3A%22pair_link%22%3Bs%3A23%3A%22%2Findices%2Fftse-china-a50%22%3B%7Di%3A5%3Ba%3A3%3A%7Bs%3A7%3A%22pair_ID%22%3Bs%3A4%3A%222111%22%3Bs%3A10%3A%22pair_title%22%3Bs%3A16%3A%22%E7%BE%8E%E5%85%83+%E4%BA%BA%E6%B0%91%E5%B8%81%22%3Bs%3A9%3A%22pair_link%22%3Bs%3A19%3A%22%2Fcurrencies%2Fusd-cny%22%3B%7Di%3A6%3Ba%3A3%3A%7Bs%3A7%3A%22pair_ID%22%3Bs%3A3%3A%22179%22%3Bs%3A10%3A%22pair_title%22%3Bs%3A0%3A%22%22%3Bs%3A9%3A%22pair_link%22%3Bs%3A20%3A%22%2Findices%2Fhang-sen-40%22%3B%7D%7D%7D%7D; nyxDorf=NzBjMG47M3FhNmFsN2Q4JGMzZjs0NGJ%2BZmFvZA%3D%3D; billboardCounter_6=0; _ga=GA1.2.879007721.1486967150',
        Host: 'cn.investing.com',
        Referer: 'https://cn.investing.com/commodities/gold',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.95 Safari/537.36',
        'X-Requested-With': 'XMLHttpRequest'
      }
    }, function (err, httpResponse, body) {
      if (err) return reject(err);
      resolve(JSON.parse(body).attr);
    });
  });
}

/**
 * 从investing获取所有实时行情
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

