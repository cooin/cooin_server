const moment = require('moment-timezone');
const config = require('../config/config');
const util_IDGenerator = require('../lib/IDGenerator');
const util_weChat = require('../lib/weChat');
const MsgService = require('../lib/messageservice-api');
const MQ = new MsgService(process.env.QUEUE_ORDER);
//下单机器人每次购买数量范围btc
const ORDER_ROBOT_QUANTITY_BTC = process.env.ORDER_ROBOT_QUANTITY_BTC.split(',');
//下单机器人每次购买数量范围ltc
const ORDER_ROBOT_QUANTITY_LTC = process.env.ORDER_ROBOT_QUANTITY_LTC.split(',');
//订单过期时长
const ORDER_EXPIRE = process.env.ORDER_EXPIRE;


/**
 * 充值（从我的钱包想定投充值每月扣费金额）
 *
 * 我的钱包扣除每期扣款金额
 *    余额足
 *        插入我的钱包变更记录
 *        定投增加每期扣款金额
 *        插入定投钱包变更记录
 *        以定投作为钱包，以市价单购买定投的币种
 *
 * @param server
 * @param doc
 * @returns {Promise.<T>}
 */
exports.charge = (server, doc) => {

  const self = this;

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];

  const Master_register = DB.getModel('master_register');
  const AutoInvest = DB.getModel('autoInvest');
  const Fund_in_out = DB.getModel('fund_in_out');

  //获取流水号
  return util_IDGenerator.gets('fund_in_out', 2, 0).then(data => {
    let array_transNumber = data;

    //事务
    return Sequelize.transaction(t => {
      //我的钱包扣除每期扣款金额（如果是定投第一期则从冻结资金里面扣除）
      let updateDoc = {};
      let criteria = {};
      if (doc.nowPeriod == 0) {
        updateDoc = {
          rmb_balance_f: Sequelize.literal(`cast(rmb_balance_f - ${doc.perAmount} as decimal(11, 2))`)
        };
        criteria = {
          username: doc.username,
          rmb_balance_f: {$gte: doc.perAmount}
        };
      } else {
        updateDoc = {
          rmb_balance: Sequelize.literal(`cast(rmb_balance - ${doc.perAmount} as decimal(11, 2))`)
        };
        criteria = {
          username: doc.username,
          rmb_balance: {$gte: doc.perAmount}
        };
      }
      return Master_register.update(updateDoc, {
        where: criteria,
        transaction: t
      }).then(data => {
        //余额不足
        if (data[0] != 1) throw new Error('余额不足');

        //插入我的钱包变更记录
        let fundDoc = {
          transNumber: array_transNumber[0],
          username: doc.username,
          orderid: 0,
          fundmoneystatus: 'autoinvestin',
          curr_type: 0,
          addorminus: 'minus',
          actiondate: moment().format('YYYYMMDD'),
          paymode: 'w',
          borrowid: doc.autoInvestId,
          price: 0,
          quantity: 0,
          money: doc.perAmount
        };
        return Fund_in_out.create(fundDoc, {transaction: t});
      }).then(data => {
        //定投增加每期扣款金额（在有效期内）
        return AutoInvest.update({
          rmb_balance: Sequelize.literal(`cast(rmb_balance + ${doc.perAmount} as decimal(11, 2))`)
        }, {
          where: {
            id: doc.id,
            nowPeriod: {$lt: doc.totalPeriod}
          },
          transaction: t
        })
      }).then(data => {
        if (data[0] != 1) throw new Error('充值失败');

        //插入定投钱包变更记录
        let fundDoc = {
          transNumber: array_transNumber[1],
          username: doc.username,
          orderid: 0,
          fundmoneystatus: 'autoinvestin',
          curr_type: 0,
          addorminus: 'add',
          actiondate: moment().format('YYYYMMDD'),
          paymode: 't',
          borrowid: doc.autoInvestId,
          price: 0,
          quantity: 0,
          money: doc.perAmount
        };
        return Fund_in_out.create(fundDoc, {transaction: t});
      });
    }).then(data => {
      //查询最新定投
      return AutoInvest.findOne({where: {id: doc.id}});
    }).catch(err => {
      logger.error(err);
      return Promise.reject(err);
    });
  });
};

/**
 * 定投
 *
 * 充值
 * 以定投作为钱包，以市价单购买定投的币种
 *
 * @param server
 * @param doc
 * @returns {Promise.<T>}
 */
exports.withhold = (server, doc) => {

  const self = this;

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];

  const AutoInvest = DB.getModel('autoInvest');
  const Orderlist_bid = DB.getModel('orderlist_bid');

  let orderid;
  //获取订单ID
  return util_IDGenerator.get('orderlist_bid').then(id => {
    orderid = id;
    //充值
    return self.charge(server, doc);
  }).then(data => {
    doc = data;
    //订单
    let order = {
      orderid: orderid,
      username: doc.username,
      bors: 'b',
      curr_type: doc.coinType == 'btc' ? 1 : 2,
      moneyfrom: 't',
      borrowid: doc.autoInvestId,
      total: doc.perAmount,
      orderdate: moment().format('YYYYMMDD'),
      orderdatedetail: moment().format('YYYYMMDDHHmm'),
      isRobot: 0,
      isMatched: 0,
      isMarket: 1,
      expiredAt: new Date((Date.now() + Number(ORDER_EXPIRE) * 60 * 60 * 1000))
    };

    //货币交易精度
    let decimal;
    switch (doc.coinType) {
      case 'btc':
        decimal = ORDER_ROBOT_QUANTITY_BTC[2];
        break;
      case 'ltc':
        decimal = ORDER_ROBOT_QUANTITY_LTC[2];
        break;
    }

    //事务
    return Sequelize.transaction(t => {
      //扣除可用rbm余额， 并更新冻结rmb余额
      return AutoInvest.update({
        rmb_balance: Sequelize.literal(`cast(rmb_balance - ${doc.perAmount} as decimal(11, 2))`),
        rmb_balance_f: Sequelize.literal(`cast(rmb_balance_f + ${doc.perAmount} as decimal(11, 2))`),
        nowAmount: Sequelize.literal(`cast(nowAmount + ${doc.perAmount} as decimal(11, 2))`),
        nowPeriod: Sequelize.literal(`cast(nowPeriod + 1 as decimal(11))`),
        status: doc.nowPeriod + 1 == doc.totalPeriod ? 1 : 0
      }, {
        where: {
          id: doc.id,
          rmb_balance: {$gte: doc.perAmount},
          nowPeriod: {$lt: doc.totalPeriod}
        },
        transaction: t
      }).then(data => {
        //余额不足
        if (data[0] != 1) throw new Error('余额不足');
        //下单
        return Orderlist_bid.create(order, {transaction: t});
      }).then(order => {
        //插入队列
        let msg = {type: process.env.QUEUE_ORDER_TYPE_ORDER, id: order.id, bors: order.bors};
        let delays = 0;
        let priority = 8;
        return MQ.enQueue(msg, priority, delays);
      });
    }).then(data => {
      //查询最新定投
      return AutoInvest.findOne({where: {id: doc.id}});
    }).then(data => {
      //到期提醒
      if (data.status == 1) this.sendTemplateMsgForAutoInvestExpire(server, data);
      return Promise.resolve(data);
    });
  }).catch(err => {
    //插入定投失败记录
    let array_failureDate = doc.failureDate ? doc.failureDate.split(',') : [];
    array_failureDate.push(Date.now());
    AutoInvest.update({
      failureDate: array_failureDate.toString()
    }, {
      where: {id: doc.id}
    });
    return Promise.reject(err);
  });
};

/**
 * 结束（赎回）
 *
 * 从定投中扣除所有冻结资金
 * 从定投中扣除所有货币
 * 把扣除的资金添加到我的钱包中
 * 把扣除的货币添加到我的钱包中
 * 插入钱包变更记录
 *
 * @param server
 * @param doc
 * @returns {Promise.<T>}
 */
exports.finish = (server, doc) => {

  const self = this;

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];

  const Master_register = DB.getModel('master_register');
  const AutoInvest = DB.getModel('autoInvest');
  const Fund_in_out = DB.getModel('fund_in_out');

  //已赎回
  if (doc.status == 2) return Promise.reject(new Error('已经赎回过了'));

  //获取流水号
  return Promise.all([
    util_IDGenerator.gets('fund_in_out', 2, doc.coinType == 'btc' ? 1 : 2),
    util_IDGenerator.gets('fund_in_out', 2, 0)
  ]).then(data => {
    let array_transNumber = data;

    //事务
    return Sequelize.transaction(t => {

      //从定投中扣除所有冻结资金
      //从定投中扣除所有货币
      let rmb_balance, coin_balance, coin_type, decimal;
      if (doc.rmb_balance > 0) {
        rmb_balance = doc.rmb_balance;
      }
      if (doc.rmb_balance_f > 0) {
        rmb_balance = rmb_balance ? rmb_balance + doc.rmb_balance_f : doc.rmb_balance_f;
      }
      if (doc.coinType == 'btc') {
        coin_balance = doc.btc_balance;
        coin_type = 'btc_balance';
        decimal = ORDER_ROBOT_QUANTITY_BTC[2];
      }
      if (doc.coinType == 'ltc') {
        coin_balance = doc.bt2_balance;
        coin_type = 'bt2_balance';
        decimal = ORDER_ROBOT_QUANTITY_LTC[2];
      }
      return AutoInvest.update({
        rmb_balance: 0,
        rmb_balance_f: 0,
        btc_balance: 0,
        bt2_balance: 0,
        redeemCount: coin_balance,
        adjustBalance: rmb_balance,
        status: 2
      }, {
        where: {
          id: doc.id,
          status: {$ne: 2}
        },
        transaction: t
      }).then(data => {
        //赎回失败
        if (data[0] != 1) throw new Error('赎回失败');

        //把扣除的货币添加到我的钱包中
        let updateDoc = {};
        updateDoc[coin_type] = Sequelize.literal(`cast(${coin_type} + ${coin_balance} as decimal(11, ${decimal}))`);
        //把扣除的资金添加到我的钱包中
        if (rmb_balance) {
          updateDoc.rmb_balance = Sequelize.literal(`cast(rmb_balance + ${rmb_balance} as decimal(11, 2))`);
        }
        return Master_register.update(updateDoc, {
          where: {username: doc.username},
          transaction: t
        });
      }).then(data => {
        //赎回失败
        if (data[0] != 1) throw new Error('赎回失败');

        //插入定投钱包变更记录
        let task = [];

        //插入定投钱包变更记录
        let fundForAutoInvestDoc = {
          transNumber: array_transNumber[0][0],
          username: doc.username,
          orderid: 0,
          fundmoneystatus: 'autoinvestout',
          curr_type: doc.coinType == 'btc' ? 1 : 2,
          addorminus: 'minus',
          actiondate: moment().format('YYYYMMDD'),
          paymode: 't',
          borrowid: doc.autoInvestId,
          price: 0,
          quantity: coin_balance,
          money: coin_balance
        };
        task.push(Fund_in_out.create(fundForAutoInvestDoc, {transaction: t}));
        //插入我的钱包变更记录
        let fundForMasterDoc = {
          transNumber: array_transNumber[0][1],
          username: doc.username,
          orderid: 0,
          fundmoneystatus: 'autoinvestout',
          curr_type: doc.coinType == 'btc' ? 1 : 2,
          addorminus: 'add',
          actiondate: moment().format('YYYYMMDD'),
          paymode: 'w',
          borrowid: doc.autoInvestId,
          price: 0,
          quantity: coin_balance,
          money: coin_balance
        };
        task.push(Fund_in_out.create(fundForMasterDoc, {transaction: t}));

        if (rmb_balance) {
          //插入定投钱包余额变更记录
          let fundForAutoInvestBalanceAdjustDoc = {
            transNumber: array_transNumber[1][0],
            username: doc.username,
            orderid: 0,
            fundmoneystatus: 'autoinvestbalanceadjust',
            curr_type: 0,
            addorminus: 'minus',
            actiondate: moment().format('YYYYMMDD'),
            paymode: 't',
            borrowid: doc.autoInvestId,
            price: 0,
            quantity: 0,
            money: rmb_balance
          };
          task.push(Fund_in_out.create(fundForAutoInvestBalanceAdjustDoc, {transaction: t}));
          //插入我的钱包余额变更记录
          let fundForMasterBalanceAdjustDoc = {
            transNumber: array_transNumber[1][1],
            username: doc.username,
            orderid: 0,
            fundmoneystatus: 'autoinvestbalanceadjust',
            curr_type: 0,
            addorminus: 'add',
            actiondate: moment().format('YYYYMMDD'),
            paymode: 'w',
            borrowid: doc.autoInvestId,
            price: 0,
            quantity: 0,
            money: rmb_balance
          };
          task.push(Fund_in_out.create(fundForMasterBalanceAdjustDoc, {transaction: t}));
        }

        return Promise.all(task);
      });
    }).then(data => {
      //查询最新定投
      return AutoInvest.findOne({where: {id: doc.id}});
    });
  });
};

/**
 * 定投扣款提醒
 * @param server
 * @param doc
 * @returns {*}
 */
exports.sendTemplateMsgForAutoInvestTip = (server, doc) => {

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];

  const Master_register = DB.getModel('master_register');

  let master_register;

  //查询账户
  return Master_register.findOne({
    where: {username: doc.username}
  }).then(data => {
    master_register = data;

    //用户未关注
    if (master_register.subscribe == 0) return Promise.reject(new Error('用户未关注'));
    //发送消息
    return util_weChat.sendTemplateMsgForAutoInvestTip(
      config.weChat.bitekuang.name,
      master_register.openid,
      master_register.username,
      doc.perAmount,
      moment(Date.now() + 24 * 3600000).format('YYYY-MM-DD'),
      doc.autoInvestId
    );
  });
};

/**
 * 定投到期提醒
 * @param server
 * @param doc
 * @returns {*}
 */
exports.sendTemplateMsgForAutoInvestExpire = (server, doc) => {

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];

  const Master_register = DB.getModel('master_register');

  let master_register;

  //查询账户
  return Master_register.findOne({
    where: {username: doc.username}
  }).then(data => {
    master_register = data;

    //用户未关注
    if (master_register.subscribe == 0) return Promise.reject(new Error('用户未关注'));
    //发送消息
    return util_weChat.sendTemplateMsgForAutoInvestExpire(
      config.weChat.bitekuang.name,
      master_register.openid,
      master_register.username,
      doc.nowPeriod,
      doc.nowAmount,
      doc.btc_balance,
      new Date(),
      doc.autoInvestId
    );
  });
};
