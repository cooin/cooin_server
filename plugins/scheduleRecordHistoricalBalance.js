const schedule = require('node-schedule');

//获取昨日开始日期时间
function getYesterdayBegin() {
    let now = new Date(2017,2,16);
    now.setUTCDate(now.getDate() - 1);
    now.setUTCHours(0,0,0,0);
    return now;
}

//获取昨日结束日期时间
function getYesterdayEnd(){
    let now = new Date(2017,2,16);
    now.setUTCDate(now.getDate() - 1);
    now.setUTCHours(23,59,59,999);
    return now;
}

//转换日期时间对象为日期时间yyyy-mm-dd hh:mm:ss字符串
function getBalanceQueryDateString(date){
    let string = date.toISOString();
    return string.slice(0, 10) + ' ' + date.toISOString().slice(11, 19);
}

//获取昨日日期字符串yyyy-mm-dd
function getYesterdayDateString() {
    let now = new Date();
    now.setUTCDate(now.getDate() - 1);
    return now.toISOString().slice(0,10);
}

exports.register = (server, options, next) => {

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];

  const PerformanceHistoryTable = DB.getModel('performance_history');
  const FolloweePerformanceHistoryTable = DB.getModel('followee_performance_history');

  const rule = new schedule.RecurrenceRule();
  rule.hour = 0;
  rule.minute = 55;
  rule.second = 0;

  let dailyUpdater = schedule.scheduleJob(rule, () => {
    internal.do();
  });

  const internal = {};

  internal.do = () => {
    let yesterdayDate = getYesterdayDateString();
    let btc_price;
    let ltc_price;

    //找到昨日账户变动过的用户列表并把他们当前的余额抓出来插入历史余额表然后根据历史币价计算当时的账户总价值
    Sequelize.query(`SELECT username, SUM(rmb) AS rmb, SUM(btc) AS btc, SUM(bt2) AS bt2 FROM
                        (SELECT username, rmb_balance_f + rmb_balance AS rmb, btc_balance_f + btc_balance AS btc, bt2_balance_f + bt2_balance AS bt2 
                        FROM master_register 
                        UNION
                        SELECT username, SUM(rmb_balance_f + rmb_balance) AS rmb, SUM(btc_balance_f + btc_balance) AS btc, SUM(bt2_balance_f + bt2_balance) AS bt2 
                        FROM autoinvest  
                        GROUP BY username) 
                     AS total_balance
                     GROUP BY username;
  `).then((result) => {
      PerformanceHistoryTable.bulkCreate(result[0]);
    }).then(() => {
      return Sequelize.query(`SELECT coinType, unit, close FROM kline 
                      WHERE DATE(FROM_UNIXTIME(time/1000)) = DATE('${yesterdayDate}') 
                      AND unit = '1day'`);
    }).then((result) => {
      result[0].forEach((element) => {
        if (element.coinType === 'btc') {
          btc_price = element.close;
        }
        if (element.coinType === 'ltc') {
          ltc_price = element.close;
        }
      });
    }).then(function () {
      if (btc_price === undefined) {
        console.log('btc price is not available for yesterday');
        return;
      }
      if (ltc_price === undefined) {
        console.log('ltc price is not available for yesterday');
        return;
      }
      Sequelize.query(`UPDATE performance_history SET net_worth = rmb + ${btc_price}*btc + ${ltc_price}*bt2 
                      WHERE net_worth = 0 AND DATE(createdAt) = DATE(NOW());`);

      //每日记录跟投策略基金账户余额
      Sequelize.query(`SELECT username, fundname, rmb, btc, bt2 
                     FROM followee_register;
                    `)
        .then( (result) => {
          FolloweePerformanceHistoryTable.bulkCreate(result[0]);
        }).then( () => {
        Sequelize.query(`UPDATE followee_performance_history SET net_worth = rmb + ${btc_price}*btc + ${ltc_price}*bt2 
                      WHERE net_worth = 0 AND DATE(createdAt) = DATE(NOW());`);
      });
    });

  };

  next();
};

exports.register.attributes = {
  name: 'schedule scheduleRecordHistoricalBalance',
  version: '1.0.0'
};




