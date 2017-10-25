/**
 * 支付宝充值记录查询
 *
 * 轮询支付宝充值记录
 * 保存数据
 *
 */

const request = require('request');
const iconv = require('iconv-lite');
const https = require('https');
const qs = require('querystring');
const moment = require('moment-timezone');
const service_chargeAlipay = require('../service/chargeAlipay');
const service_alipay = require('../service/alipay');


const monitor = {};

monitor.counter = 0;

monitor.statusMonitor = flag => {
  monitor.counter = flag ? 0 : monitor.counter + 1;
  if (monitor.counter < 20) return;
  monitor.sendErrorMsg();
  monitor.counter = 0;
}

monitor.sendErrorMsg = () => {
  request('http://test.yizhizhun.com/btkaction.php?type=serverproblem&ipaddress=btk&mobile=136********');
  request('http://test.yizhizhun.com/btkaction.php?type=serverproblem&ipaddress=btk&mobile=183********');
  request('http://test.yizhizhun.com/btkaction.php?type=serverproblem&ipaddress=btk&mobile=182********');
}

exports.register = (server, options, next) => {

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];

  const ChargeAlipay = DB.getModel('chargeAlipay');

  const internal = {};

  //查询交易订单
  internal.query = (page, size, startTime, endTime) => {
    return new Promise((resolve, reject) => {
      return service_alipay.getCookie(server).then(data => {
        //这是需要提交的数据
        const post_data = {
          startDateInput: moment(startTime).format('YYYY-MM-DD HH:mm'),
          endDateInput: moment(endTime).format('YYYY-MM-DD HH:mm'),
          startAmount: ``,
          endAmount: ``,
          targetMainAccount: ``,
          activeTargetSearchItem: ``,
          orderNo: ``,
          tradeNo: ``,
          sortType: 0,
          sortTarget: `tradeTime`,
          showType: 0,
          searchType: 0,
          pageSize: size,
          pageNum: page,
          billUserId: 2088721526257236,
          forceAync: 0,
          fromTime: `00:00`,
          toTime: `00:00`,
          type: ``,
          _input_charset: `utf-8`,
          ctoken: `pcsOUL9mYfCb0GHQ`
        };
        const content = qs.stringify(post_data);
        const options = {
          hostname: 'mbillexprod.alipay.com',
          port: 443,
          path: '/enterprise/accountDetailQuery.json',
          method: 'post',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'Cookie': 'ALIPAYJSESSIONID=' + data,
            'Content-Length': content.length,
            'Referer': 'https://mbillexprod.alipay.com/enterprise/accountDetail.htm'
          }
        };
        logger.info('支付宝充值查询', post_data);
        const req = https.request(options, function (response) {
          // response.setEncoding('utf8');
          let responseData = '';
          response.on('data', function (data) {
            responseData += iconv.decode(data, 'GBK');
          });
          response.on('end', function () {
            responseData = JSON.parse(responseData);
            resolve(responseData);
          });
        });
        req.on('error', function (err) {
          reject(err);
        });
        req.write(content);
        req.end();
      });
    });
  };

  //查询从当前时间到上笔订单之间的所有订单
  internal.do = () => {
    //数据
    let datas = [];
    //查询最新一条记录
    return ChargeAlipay.findOne({
      order: [
        ['id', 'DESC'],
      ]
    }).then(data => {
      //查询开始时间（一数据库最新一条记录为起点，没有则已今天零点为起点）
      let startTime = data ? new Date(data.tradeTime).getTime() + 60000 : moment(Date.now() - 24 * 60 * 60 * 1000 * 30);
      //查询结束时间（当前时间）
      let endTime = Date.now();
      //page
      let page = 1;
      let size = 20;

      //轮询
      function polling() {
        //查询
        return internal.query(page, size, startTime, endTime).then(data => {
          //请求错误
          if (data.status != 'succeed') throw new Error('请求遇到错误啦');
          //保存数据
          datas = datas.concat(data.result.detail);
          //继续请求
          if (data.result.paging.totalItems > page++ * size) return polling();
          //返回
          return Promise.resolve(datas);
        })
      }

      //轮询
      return polling();
    });
  };

  //处理充值记录
  //docs充值记录
  internal.handle = (docs) => {

    docs.forEach(doc => {
      service_chargeAlipay.handle(server, doc).catch(err => {
        logger.error(err);
      })
    });

  };

  //执行
  function execute() {

    //执行
    internal.do().then(data => {
      //插入的数据
      let docs = [];
      //没有数据
      if (data.length == 0) return Promise.resolve(docs);
      //逆序
      data.reverse();
      //逆序排队插入（保证早的充值订单插入成功）
      let i = 0;

      function queue() {
        let tradeTime = data[i].tradeTime;
        let tradeNo = data[i].tradeNo;
        let transMemo = data[i].transMemo;
        let otherAccountFullname = data[i].otherAccountFullname;
        let otherAccountEmail = data[i].otherAccountEmail;
        let tradeAmount = Number(Number(data[i].tradeAmount).toFixed(2));
        let status = 0;
        let doc = {tradeTime, tradeNo, transMemo, otherAccountFullname, otherAccountEmail, tradeAmount, status};
        if (tradeAmount < 0) {
          //继续插入
          if (data[++i]) return queue();
          //结束
          return Promise.resolve(docs);
        }
        return ChargeAlipay.create(doc).then(doc => {
          docs.push(doc);
          //继续插入
          if (data[++i]) return queue();
          //结束
          return Promise.resolve(docs);
        });
      }

      //逆序插入
      return queue();
    }).then(docs => {
      //循环
      // setTimeout(execute, process.env.CHARGE_ALIPAY_TIME);
      //处理插入的数据
      internal.handle(docs);
      monitor.statusMonitor(true);
    }).catch(err => {
      logger.error(err);
      //循环
      // setTimeout(execute, process.env.CHARGE_ALIPAY_TIME);
      monitor.statusMonitor(false);
    });
  }

  execute();
  setInterval(execute, process.env.CHARGE_ALIPAY_TIME);

  next();
};

exports.register.attributes = {
  name: 'charge',
  version: '1.0.0'
};


// const internal = {};
//
// //查询交易订单
// internal.query = () => {
//
//   request.post({
//     url: 'https://mbillexprod.alipay.com/enterprise/accountDetailQuery.json',
//     //直接返回buffer
//     encoding: null,
//     headers: {
//       'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
//       'Cookie': 'ALIPAYJSESSIONID=RZ12r6ILX38P5L6CpXavJJJd59gZxaauthRZ11GZ00',
//       'Referer': 'https://mbillexprod.alipay.com/enterprise/accountDetail.htm'
//     },
//     form: {
//       startDateInput: `2017-01-18 10:01`,
//       endDateInput: `2017-01-18 10:02`,
//       startAmount: ``,
//       endAmount: ``,
//       targetMainAccount: ``,
//       activeTargetSearchItem: ``,
//       orderNo: ``,
//       tradeNo: ``,
//       sortType: 0,
//       sortTarget: `tradeTime`,
//       showType: 0,
//       searchType: 0,
//       pageSize: 20,
//       pageNum: 1,
//       billUserId: 2088721526257236,
//       forceAync: 0,
//       fromTime: `00:00`,
//       toTime: `00:00`,
//       type: ``,
//       _input_charset: `utf-8`,
//       ctoken: `pcsOUL9mYfCb0GHQ`
//     }
//   }, function (err, httpResponse, body) {
//     console.log(err);
//     // console.log(httpResponse);
//     // console.log(body);
//     body = iconv.decode(body, 'GBK');
//     body = JSON.parse(body);
//     console.log(body);
//     console.log(body.status);
//     console.log(body.result.detail.length);
//     console.log(Date.now());
//     // console.log(body.result.detail);
//
//   });
//
// };
//
// internal.query();
