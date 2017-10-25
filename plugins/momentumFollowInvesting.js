const request = require('request');
const schedule = require('node-schedule');
const EventEmitter = require('events');

//钱包
class Wallet {
  constructor(rmbDeposit){
    this.rmb = rmbDeposit;
    this.btc = 0;
    this.statement = [];
  }

  buyBTC(price, quantity, time) {
    let rmbRequired = price * quantity;
    if (rmbRequired > this.rmb){
      console.log('insufficient RMB balance');
    } else {
      this.rmb -= rmbRequired;
      this.btc += quantity*0.998;
      this.statement.push([time, this.rmb, this.btc, this.rmb+price*this.btc]);
    }
  }

  sellBTC(price, quantity, time){
    if (quantity > this.btc) {
      console.log('insufficient BTC balance');
    } else {
      this.btc -= quantity;
      this.rmb += price*quantity*0.998;
      this.statement.push([time, this.rmb, this.btc, this.rmb+price*this.btc]);
    }
  }

  getStatement() {
    return this.statement.sort(timestampSortAscending);
  }
}

//降序比较器，用于数组排序
function timestampSortDescending(a, b){
  if (a[0] < b[0]) return 1;
  if (a[0] > b[0]) return -1;
  return 0;
}

//升序比较器，用于数组排序
function timestampSortAscending(a, b){
  if (a[0] < b[0]) return -1;
  if (a[0] > b[0]) return 1;
  return 0;
}

//给定区间值和数据计算移动平均值
function movingAverage(interval, data){
  if (data == null || interval > data.length) return null;
  let intervalData = data.slice(0,interval);
  let ma = intervalData.reduce( (a,b) => {
      if (typeof(a) == 'object' && typeof(b) == 'object') {
        return a[4] + b[4];
      } else if (typeof(a) == 'number' && typeof(b) == 'object'){
        return a + b[4];
      }
    }) / intervalData.length;
  return !isNaN(ma) ? {
      time: intervalData[0][0],
      movingAverage: ma
    } : null;
}

//生成获取交易信号的Promise
function tryGetTradingSignal() {
  return new Promise((resolve, reject) => {
    request.get(
      'https://www.okcoin.cn/api/v1/kline.do?symbol=btc_cny&type=1min&size=200',
      {json: {key: 'value'}},
      (err, res, body) => {
        if (!err && res.statusCode == 200) {
          let data = body.sort(timestampSortDescending);
          let signal = generateTradingSignal(data);
          signal !== null ? resolve(signal) : reject(null);
        }
        else {
          reject(null);
        }
      });
  });
}

//给定数据计算5，30均线并生成交易信号
function generateTradingSignal(data) {
  if (data === null) return null;
  let ma5 = movingAverage(5, data);
  let ma30 = movingAverage(30, data);
  if (ma5.movingAverage == null || ma30.movingAverage == null) return null;
  if (ma5.movingAverage > ma30.movingAverage){
    return {
      time: data[0][0],
      signal: 'buy',
      price: data[0][4]
    };
  } else if (ma5.movingAverage == ma30.movingAverage) {
    return null;
  } else if (ma5.movingAverage < ma30.movingAverage) {
    return {
      time: data[0][0],
      signal: 'sell',
      price: data[0][4]
    };
  }
}

//钱包变化后更新数据库
function updateFolloweeRegister(table, followee, wallet){
  table.update({
    rmb: wallet.rmb,
    btc: wallet.btc,
    bt2: wallet.bt2
  },{
    where: {username: followee}
  })
}


exports.register = (server, options, next) => {

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];
  const FolloweeRegisterTable = DB.getModel('followee_register');
  const cronSchedule = '0-59/5 * * * * *';
  const internal = {};

  //如果没有创建基金账户就创建
  FolloweeRegisterTable.findOrCreate({
    where: {username: 'macross'},
    defaults: {
      fundname: '大奖章基金',
      rmb: 100000,
      btc: 0,
      bt2: 0
    }
  });

  internal.do = () => {
    let lastSignal = {};
    class SignalEmitter extends EventEmitter {}
    const btcSignalEmitter = new SignalEmitter();
    let macross;

    //处理交易信号，模拟买卖账户并更新数据库
    btcSignalEmitter.on('signal', (signal) => {
      if (signal == null) return;
      logger.info('On Signal: ', signal);
      if (signal.signal == 'buy'){
        let quantity = Math.floor(macross.rmb / signal.price);
        if (quantity !== 0) {
          macross.buyBTC(signal.price, quantity, signal.time);
          updateFolloweeRegister(FolloweeRegisterTable, 'macross', macross);
        }
      } else if (signal.signal == 'sell'){
        if (macross.btc !== 0){
          macross.sellBTC(signal.price, macross.btc, signal.time);
          updateFolloweeRegister(FolloweeRegisterTable, 'macross', macross);
        }
      }
    });

    //交易信号事件触发器
    let signalUpdater = schedule.scheduleJob(cronSchedule, () => {
      if (macross === undefined){
        FolloweeRegisterTable.findOne({
          where: {
            username: 'macross'
          }
        }).then( (result)=>{
          let resultObj = result.get({plain: true});
          macross = new Wallet(resultObj.rmb);
          macross.btc = resultObj.btc;
        });
      }


      let signal = tryGetTradingSignal();
      signal.then( (signal) => {
        if (signal.time !== lastSignal.time) {
          lastSignal = signal;
          btcSignalEmitter.emit('signal', signal);
        } else {
        }
      })
    });
  };

  internal.do();

  next();
};

exports.register.attributes = {
  name: 'schedule momentumFollowInvesting',
  version: '1.0.0'
};




