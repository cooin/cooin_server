const schedule = require('node-schedule');
const request = require('request');


exports.register = (server, options, next) => {

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];

  const internal = {};

  internal.do = () => {
    let btc_ticker;
    let ltc_ticker;
    let userFollowers;
    let fundFollowers;
    let userFollowees;
    let fundFollowees;
    let userFolloweesBalance;
    let fundFolloweesBalance;
    let orderQueue = [];

    //获取实时ticker数据
    function getTickers(symbol) {
      return new Promise((resolve, reject) => {
        request.get(
          'https://www.okcoin.cn/api/v1/ticker.do?symbol=' + symbol,
          {json: {key: 'value'}},
          (err, res, body) => {
            if (!err && res.statusCode == 200) {
              resolve(body);
            }
            else {
              reject(null);
            }
          });
      });
    }

    //定时抓取比特币莱特币市场数据
    let priceUpdater = schedule.scheduleJob('0-59/5 * * * * *', () => {
      getTickers('btc_cny').then( (result) => {
        if (result !== null){
          btc_ticker = result;
        }
      });

      getTickers('ltc_cny').then( (result) => {
        if (result !== null){
          ltc_ticker = result;
        }
      });
    });

    //定时抓取跟投者数据,抓取被跟投的领投人列表
    let followerAndFolloweeUpdater = schedule.scheduleJob('0-59/5 * * * * *', () => {
      Sequelize.query(`
                    SELECT followInvestId, followWho, rmb_balance_f + rmb_balance AS rmb, btc_balance_f + btc_balance AS btc, bt2_balance_f + bt2_balance AS bt2 
                    FROM followinvest 
                    WHERE status=0 AND followType=0 AND rmb_balance_f=0 AND btc_balance_f=0 AND bt2_balance_f=0
                    `)
        .then( (result)=>{
          if (result[0].length >0){
            userFollowers = result[0];
          }
        })
        .then( ()=>{
          if (userFollowers !== undefined) {
            let duplicatedFollowees = userFollowers.map((x)=>x.followWho);
            userFollowees = duplicatedFollowees.filter(function (elem, pos) {
              return duplicatedFollowees.indexOf(elem) == pos;
            });
          }
        });

      Sequelize.query(`
                    SELECT followInvestId, followWho, rmb_balance_f + rmb_balance AS rmb, btc_balance_f + btc_balance AS btc, bt2_balance_f + bt2_balance AS bt2 
                    FROM followinvest 
                    WHERE status=0 AND followType=1 AND rmb_balance_f=0 AND btc_balance_f=0 AND bt2_balance_f=0
                    `)
        .then( (result)=>{
          if (result[0].length > 0){
            fundFollowers = result[0];
          }
        })
        .then( ()=>{
          if (fundFollowers !== undefined) {
            let duplicatedFollowees = fundFollowers.map((x)=>x.followWho);
            fundFollowees = duplicatedFollowees.filter(function (elem, pos) {
              return duplicatedFollowees.indexOf(elem) == pos;
            });
          }
        });
    });

    //定时抓取被跟投的领头人账户余额信息
    let balanceUpdater = schedule.scheduleJob('0-59/5 * * * * *', () => {
      if (userFollowees !== undefined){
        Sequelize.query(`
                        SELECT username, rmb_balance_f + rmb_balance AS rmb, btc_balance_f + btc_balance AS btc, bt2_balance_f + bt2_balance AS bt2 
                        FROM master_register
                        WHERE username IN (${"'" + userFollowees.join("','") + "'"})
                        `)
          .then( (result)=>{
            if (result[0].length >0){
              userFolloweesBalance = result[0];
            }
          });
      }

      if (fundFollowees !== undefined){
        Sequelize.query(`
                        SELECT username, rmb, btc, bt2 
                        FROM followee_register
                        WHERE username IN (${"'" + fundFollowees.join("','") + "'"})
                        `)
          .then( (result)=>{
            if (result[0].length >0){
              fundFolloweesBalance = result[0];
            }
          });
      }
    });

    //计算持仓比例生成订单
    function tryToGenerateTrade(followerAccount, followeeAccounts, btc_price, ltc_price){
      let followeeAccount = followeeAccounts.find( (x)=>x=followerAccount.followWho );
      let followeeNetWorth = followeeAccount.rmb + btc_price*followeeAccount.btc + ltc_price*followeeAccount.bt2;
      let followerNetWorth = followerAccount.rmb + btc_price*followerAccount.btc + ltc_price*followerAccount.bt2;
      let followeeBtcRatio = btc_price*followeeAccount.btc/followeeNetWorth;
      let followeeLtcRatio = ltc_price*followeeAccount.bt2/followeeNetWorth;
      let targetFollowerBtc = followerNetWorth*followeeBtcRatio/btc_price;
      let targetFollowerLtc = followerNetWorth*followeeLtcRatio/ltc_price;
      let trades = [];
      if (targetFollowerBtc > followerAccount.btc) {
        trades.push({followInvestId: followerAccount.followInvestId, side: 'buy', symbol: 'btc', quantity: targetFollowerBtc - followerAccount.btc});
      } else if (targetFollowerBtc < followerAccount.btc){
        trades.push({followInvestId: followerAccount.followInvestId, side: 'sell', symbol: 'btc', quantity: followerAccount.btc - targetFollowerBtc})
      }
      if (targetFollowerLtc > followerAccount.bt2){
        trades.push({followInvestId: followerAccount.followInvestId, side: 'buy', symbol: 'ltc', quantity: targetFollowerLtc - followerAccount.bt2});
      } else if (targetFollowerLtc < followerAccount.bt2){
        trades.push({followInvestId: followerAccount.followInvestId, side: 'sell', symbol: 'ltc', quantity: followerAccount.bt2 - targetFollowerLtc});
      }

      return trades.length !== 0 ? trades : null;
    }

    //策略机器人定时对比跟投单账户与领头人账户的资产配置比例，然后生成下单到下单队列
    let followUserTradeGenerator = schedule.scheduleJob('0-59/10 * * * * *', () => {
      if (userFolloweesBalance !== undefined) {
        userFollowers.forEach( (followInvest)=>{
          let trade = tryToGenerateTrade(followInvest, userFolloweesBalance, btc_ticker.ticker.last, ltc_ticker.ticker.last);
          if (trade !== null) {
            trade.forEach( (order)=>orderQueue.push(order));
          }
        })
      }
    });

    //策略机器人定时对比跟投单账户与策略基金账户的资产配置比例，然后生成下单到下单队列
    let followFundTradeGenerator = schedule.scheduleJob('0-59/10 * * * * *', () => {
      if (fundFolloweesBalance !== undefined) {
        fundFollowers.forEach( (followInvest)=>{
          let trade = tryToGenerateTrade(followInvest, fundFolloweesBalance, btc_ticker.ticker.last, ltc_ticker.ticker.last);
          if (trade !== null) {
            trade.forEach( (order)=>orderQueue.push(order));
          }
        })
      }
    });

    //机器人自动把下单队列中的订单传给交易引擎
    let orderDespatcher = schedule.scheduleJob('0-59/1 * * * * *', () => {
      if (orderQueue.length !== 0){
        let trade = orderQueue.shift();
        //用下单接口下单
        logger.info('FollowInvest: ', trade);
      }
    });


  };

  internal.do();

  next();
};

exports.register.attributes = {
  name: 'schedule scheduleFollowInvest',
  version: '1.0.0'
};




