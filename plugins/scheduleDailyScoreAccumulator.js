const schedule = require('node-schedule');

//获取昨日日期字符串yyyy-mm-dd
function getYesterdayDateString() {
  let now = new Date();
  now.setUTCDate(now.getDate() - 1);
  return now.toISOString().slice(0,10);
}

exports.register = (server, options, next) => {

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];

  const rule = new schedule.RecurrenceRule();
  rule.hour = 1;
  rule.minute = 0;
  rule.second = 0;

  let scoredNetWorth = 2000;

  let dailyUpdater = schedule.scheduleJob(rule, () => {
    internal.do();
  });

  const internal = {};

  internal.do = () => {
    let yesterdayDate = getYesterdayDateString();
    let btc_price;
    let ltc_price;

    Sequelize.query(`SELECT coinType, unit, close FROM kline 
                      WHERE DATE(FROM_UNIXTIME(time/1000)) = DATE('${yesterdayDate}') 
                      AND unit = '1day'`)
    .then((result) => {
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

      //每日递增市值超过一定数额的用户积分
      Sequelize.query(`UPDATE master_register 
                       SET score = score + 1 
                       WHERE username IN
                        (SELECT username FROM
                          (SELECT username, SUM(rmb) AS rmb, SUM(btc) AS btc, SUM(bt2) AS bt2 FROM
                            (SELECT username, rmb_balance_f + rmb_balance AS rmb, btc_balance_f + btc_balance AS btc, bt2_balance_f + bt2_balance AS bt2 
                            FROM master_register
                            UNION ALL
                            SELECT username, SUM(rmb_balance_f + rmb_balance) AS rmb, SUM(btc_balance_f + btc_balance) AS btc, SUM(bt2_balance_f + bt2_balance) AS bt2 
                            FROM autoinvest GROUP BY username) AS total_balances 
                          GROUP BY username) AS total_balance 
                          WHERE rmb+${btc_price}*btc+${ltc_price}*bt2 >= ${scoredNetWorth});`);

    });

  };

  next();
};

exports.register.attributes = {
  name: 'schedule scheduleDailyScoreAccumulator',
  version: '1.0.0'
};




