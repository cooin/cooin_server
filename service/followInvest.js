const moment = require('moment-timezone');
const config = require('../config/config');
const util_IDGenerator = require('../lib/IDGenerator');
const util_number = require('../lib/number');
const service_orderlist_bid = require('./orderlist_bid');

/**
 * 创建跟投
 * @param server
 * @param username
 * @param leaderId
 * @param amount
 * @param profitLimit
 * @param lossLimit
 */
exports.save = (server, username, leaderId, amount, profitLimit, lossLimit) => {

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];
  const Master_register = DB.getModel('master_register');
  const FollowInvest = DB.getModel('followInvest');
  const Fund_in_out = DB.getModel('fund_in_out');

  let leader;
  let followInvest;

  //查询领投人
  return Master_register.findOne({where: {activecode: leaderId}}).then(data => {
    if (!data) throw new Error('被跟投者不存在');
    if (data.username == username) throw new Error('不能跟投自己');
    leader = data;

    //领投人领投总金额判断
    if (leader.managedBalance >= leader.toplimitForLeadBalance) throw new Error('该领投人领头总额已用完');
    if (leader.managedBalance + amount > leader.toplimitForLeadBalance) throw new Error(`该领投人还剩余${Number(leader.toplimitForLeadBalance - leader.managedBalance).toFixed(2)}领投额`);

    //查询是否有处于跟投中的跟投
    return FollowInvest.count({where: {username, leaderId, status: 0}});
  }).then(count => {
    if (count > 0) throw new Error('已经跟投过了');

    /**
     * 事务
     * 扣除我的钱包余额
     * 创建跟投
     * 流水记录（我的钱包，跟投钱包）
     */
    return Sequelize.transaction(t => {

      //扣除我的钱包余额
      return Master_register.update({
        rmb_balance: Sequelize.literal(`cast(rmb_balance - ${amount} as decimal(11, 2))`),
        followInvestCount: Sequelize.literal(`cast(followInvestCount + 1 as decimal(11))`)
      }, {
        where: {
          username: username,
          rmb_balance: {$gte: amount}
        },
        transaction: t
      }).then(data => {
        //余额不足
        if (data[0] != 1) throw new Error('余额不足');

        //获取跟投流水
        return util_IDGenerator.get('followInvest', 0);
      }).then(followInvestId => {

        //创建跟投
        const doc = {
          username: username,
          leaderId: leaderId,
          followInvestId: followInvestId,
          rmb_balance: amount,
          initialBalance: amount,
          profitLimit: profitLimit,
          lossLimit: lossLimit
        };
        return FollowInvest.create(doc);
      }).then(data => {
        followInvest = data;

        //领投人被跟头人数累加，管理资金累加
        return Master_register.update({
          fansInvestCount: Sequelize.literal(`cast(fansInvestCount + 1 as decimal(11))`),
          managedBalance: Sequelize.literal(`cast(managedBalance + ${amount} as decimal(12,2))`)
        }, {
          where: {activecode: leaderId},
          transaction: t
        });
      }).then(data => {

        //获取流水
        return util_IDGenerator.gets('fund_in_out', 2, 0);
      }).then(array_transNumber => {

        //我的钱包流水
        const fundDocForMaster = {
          transNumber: array_transNumber[0],
          username: username,
          orderid: followInvest.followInvestId,
          fundmoneystatus: 'followinvestin',
          curr_type: 0,
          addorminus: 'minus',
          actiondate: moment().format('YYYYMMDD'),
          paymode: 'w',
          borrowid: 0,
          price: 0,
          quantity: 0,
          money: amount
        };

        //跟投钱包流水
        const fundDocForFollow = {
          transNumber: array_transNumber[1],
          username: username,
          orderid: followInvest.followInvestId,
          fundmoneystatus: 'followinvestin',
          curr_type: 0,
          addorminus: 'add',
          actiondate: moment().format('YYYYMMDD'),
          paymode: 'f',
          borrowid: 0,
          price: 0,
          quantity: 0,
          money: amount
        };

        //流水记录
        return Fund_in_out.bulkCreate([fundDocForMaster, fundDocForFollow], {transaction: t});
      });

    });

  }).then(() => {
    return Promise.resolve(followInvest);
  });
};

/**
 * 充值
 * @param server
 * @param followInvestId
 * @param amount
 */
exports.recharge = (server, followInvestId, amount) => {

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];
  const Master_register = DB.getModel('master_register');
  const FollowInvest = DB.getModel('followInvest');
  const Fund_in_out = DB.getModel('fund_in_out');

  let followInvest;

  //查询跟投
  return FollowInvest.findOne({where: {followInvestId}}).then(data => {
    if (!data) throw new Error('跟投不存在');
    if (data.status == 1) throw new Error('跟投已结束');
    followInvest = data;

    /**
     * 事务
     */
    return Sequelize.transaction(t => {

      //扣除我的钱包余额
      return Master_register.update({
        rmb_balance: Sequelize.literal(`cast(rmb_balance - ${amount} as decimal(11, 2))`)
      }, {
        where: {
          username: followInvest.username,
          rmb_balance: {$gte: amount}
        },
        transaction: t
      }).then(data => {
        //余额不足
        if (data[0] != 1) throw new Error('余额不足');

        //跟投余额、充值额度累加
        return FollowInvest.update({
          rmb_balance: Sequelize.literal(`cast(rmb_balance + ${amount} as decimal(11, 2))`),
          rechargeBalance: Sequelize.literal(`cast(rechargeBalance + ${amount} as decimal(11, 2))`)
        }, {
          where: {followInvestId},
          transaction: t
        });
      }).then(data => {

        //领投人管理资金额度累加
        return Master_register.update({
          managedBalance: Sequelize.literal(`cast(managedBalance + ${amount} as decimal(12,2))`)
        }, {
          where: {activecode: followInvest.leaderId},
          transaction: t
        });
      }).then(data => {
        if (data[0] != 1) throw new Error('领投人信息错误');

        //获取流水
        return util_IDGenerator.gets('fund_in_out', 2, 0);
      }).then(array_transNumber => {

        //我的钱包流水
        const fundDocForMaster = {
          transNumber: array_transNumber[0],
          username: followInvest.username,
          orderid: followInvestId,
          fundmoneystatus: 'followinvestin',
          curr_type: 0,
          addorminus: 'minus',
          actiondate: moment().format('YYYYMMDD'),
          paymode: 'w',
          borrowid: 0,
          price: 0,
          quantity: 0,
          money: amount
        };

        //跟投钱包流水
        const fundDocForFollow = {
          transNumber: array_transNumber[1],
          username: followInvest.username,
          orderid: followInvestId,
          fundmoneystatus: 'followinvestin',
          curr_type: 0,
          addorminus: 'add',
          actiondate: moment().format('YYYYMMDD'),
          paymode: 'w',
          borrowid: 0,
          price: 0,
          quantity: 0,
          money: amount
        };

        //流水记录
        return Fund_in_out.bulkCreate([fundDocForMaster, fundDocForFollow], {transaction: t});
      });

    });

  }).then(() => {
    return FollowInvest.findOne({where: {followInvestId}});
  });
};

/**
 * 结束跟投
 *
 * 撤销所有委托中的订单
 * 以市价单卖出所有货币
 * 改变跟投状态
 *
 * @param server
 * @param followInvestId
 * @param amount
 */
exports.finish = (server, followInvestId) => {

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];
  const Master_register = DB.getModel('master_register');
  const FollowInvest = DB.getModel('followInvest');
  const Orderlist_bid = DB.getModel('orderlist_bid');

  let followInvest;
  let array_sellOrder;

  //查询跟投
  return FollowInvest.findOne({where: {followInvestId}}).then(data => {
    if (!data) throw new Error('跟投不存在');
    if (data.status == 1) throw new Error('跟投已结束');
    followInvest = data;

    //查询所有委托中的订单
    return Orderlist_bid.findAll({
      where: {borrowid: followInvestId, status: 0, moneyfrom: 'f'}
    });
  }).then(data => {
    if (data.length == 0) return Promise.resolve();

    //撤销所有订单
    let counter = 0;
    const internal = {};
    internal.handel = () => {
      return service_orderlist_bid.cancel(server, data[counter]).then(() => {
        if (data[++counter]) return internal.handel();
        return Promise.resolve();
      });
    }
    return internal.handel();
  }).then(data => {

    //卖出所委买单（已成交， 部分成交）
    return Orderlist_bid.findAll({
      where: {borrowid: followInvestId, status: [2, 4], moneyfrom: 'f', bors: 'b'}
    });
  }).then(data => {
    array_sellOrder = data;
    if (data.length == 0) return Promise.resolve();

    //卖出所有订单
    let counter = 0;
    const internal = {};
    internal.handel = () => {
      return service_orderlist_bid.sell(server, data[counter]).then(() => {
        if (data[++counter]) return internal.handel();
        return Promise.resolve();
      });
    }
    return internal.handel();
  }).then(data => {

    //事务
    return Sequelize.transaction(t => {

      //改变跟投状态
      return FollowInvest.update({status: 1}, {where: {followInvestId, status: 0}, transaction: t}).then(data => {
        if (data[0] != 1) throw new Error('跟投状态修改失败');

        //领投人被跟投人数减少，管理资金减少
        return Master_register.update({
          fansInvestCount: Sequelize.literal(`cast(fansInvestCount - 1 as decimal(11))`),
          managedBalance: Sequelize.literal(`cast(managedBalance - ${followInvest.initialBalance + followInvest.rechargeBalance} as decimal(12,2))`)
        }, {
          where: {activecode: followInvest.leaderId},
          transaction: t
        });
      });
    });
  }).then(() => {
    //卖出的订单为空（定投没有任何货币，直接结算）
    if (array_sellOrder.length == 0) return this.handelFinishStatus(server, followInvestId);
    return FollowInvest.findOne({where: {followInvestId}});
  });
};

/**
 * 查询--附领投人
 *
 * @param server
 * @param doc
 * @returns {Promise.<T>}
 */
exports.queryAttachLeader = (server, criteria, page, pageSize, order) => {

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];
  const FollowInvest = DB.getModel('followInvest');
  const Orderlist_bid = DB.getModel('orderlist_bid');

  let data_followInvest;
  let data_order;


  const sql_nickname = `(select master_register.nickname from master_register where master_register.activecode = followInvest.leaderId)`;
  const sql_avatar = `(select master_register.avatar from master_register where master_register.activecode = followInvest.leaderId)`;
  const sql_fansInvestCount = `(select master_register.fansInvestCount from master_register where master_register.activecode = followInvest.leaderId)`;
  const sql_riskIndex = `(select master_register.riskIndex from master_register where master_register.activecode = followInvest.leaderId)`;
  const sql_role = `(select master_register.role from master_register where master_register.activecode = followInvest.leaderId)`;
  const sql_profitRateFor1Week = `(select master_register.profitRateFor1Week from master_register where master_register.activecode = followInvest.leaderId)`;
  const sql_profitRateFor1Month = `(select master_register.profitRateFor1Month from master_register where master_register.activecode = followInvest.leaderId)`;
  const sql_profitRateFor3Month = `(select master_register.profitRateFor3Month from master_register where master_register.activecode = followInvest.leaderId)`;
  const sql_profitRateFor6Month = `(select master_register.profitRateFor6Month from master_register where master_register.activecode = followInvest.leaderId)`;
  const sql_profitRateFor1Year = `(select master_register.profitRateFor1Year from master_register where master_register.activecode = followInvest.leaderId)`;

  return FollowInvest.findAndCountAll({
    raw: true,
    attributes: config.attributes.followInvest.list.concat([
      [Sequelize.literal(sql_nickname), 'nickname'],
      [Sequelize.literal(sql_avatar), 'avatar'],
      [Sequelize.literal(sql_fansInvestCount), 'fansInvestCount'],
      [Sequelize.literal(sql_riskIndex), 'riskIndex'],
      [Sequelize.literal(sql_role), 'role'],
      [Sequelize.literal(sql_profitRateFor1Week), 'profitRateFor1Week'],
      [Sequelize.literal(sql_profitRateFor1Month), 'profitRateFor1Month'],
      [Sequelize.literal(sql_profitRateFor3Month), 'profitRateFor3Month'],
      [Sequelize.literal(sql_profitRateFor6Month), 'profitRateFor6Month'],
      [Sequelize.literal(sql_profitRateFor1Year), 'profitRateFor1Year']
    ]),
    where: criteria,
    order: order,
    offset: --page * pageSize,
    limit: pageSize
  }).then(data => {
    data_followInvest = data;

    const array_followInvestId = [];
    data.rows.forEach(item => array_followInvestId.push(item.followInvestId));

    //查询订单
    return Orderlist_bid.findAll({
      raw: true,
      attributes: [
        'borrowid',
        'tradePlatform',
        'curr_type',
        [Sequelize.literal('cast(sum(nowquantity) as decimal(18,6))'), 'quantity']
      ],
      where: {
        borrowid: array_followInvestId,
        status: [2, 5],
        bors: 'b'
      },
      group: 'borrowid, tradePlatform, curr_type'
    });
  }).then(data => {
    data_order = data;

    data_followInvest.rows.forEach(followInvest => {
      followInvest.orders = [];
      data_order.forEach(order => {
        if (followInvest.followInvestId == order.borrowid) followInvest.orders.push(order);
      });
    });

    return Promise.resolve(data_followInvest);
  });
};

/**
 * 查询--附跟投人
 *
 * @param server
 * @param doc
 * @returns {Promise.<T>}
 */
exports.queryAttachFollower = (server, criteria, page, pageSize, order) => {

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];
  const FollowInvest = DB.getModel('followInvest');
  const Orderlist_bid = DB.getModel('orderlist_bid');

  let data_followInvest;
  let data_order;

  const sql_fansUserId = `(select master_register.activecode from master_register where master_register.username = followInvest.username)`;
  const sql_nickname = `(select master_register.nickname from master_register where master_register.username = followInvest.username)`;
  const sql_avatar = `(select master_register.avatar from master_register where master_register.username = followInvest.username)`;
  const sql_fansInvestCount = `(select master_register.fansInvestCount from master_register where master_register.username = followInvest.username)`;
  const sql_riskIndex = `(select master_register.riskIndex from master_register where master_register.username = followInvest.username)`;
  const sql_role = `(select master_register.role from master_register where master_register.username = followInvest.username)`;
  const sql_profitRateFor1Week = `(select master_register.profitRateFor1Week from master_register where master_register.username = followInvest.username)`;
  const sql_profitRateFor1Month = `(select master_register.profitRateFor1Month from master_register where master_register.username = followInvest.username)`;
  const sql_profitRateFor3Month = `(select master_register.profitRateFor3Month from master_register where master_register.username = followInvest.username)`;
  const sql_profitRateFor6Month = `(select master_register.profitRateFor6Month from master_register where master_register.username = followInvest.username)`;
  const sql_profitRateFor1Year = `(select master_register.profitRateFor1Year from master_register where master_register.username = followInvest.username)`;

  return FollowInvest.findAndCountAll({
    raw: true,
    attributes: config.attributes.followInvest.list.concat([
      [Sequelize.literal(sql_fansUserId), 'fansUserId'],
      [Sequelize.literal(sql_nickname), 'nickname'],
      [Sequelize.literal(sql_avatar), 'avatar'],
      [Sequelize.literal(sql_fansInvestCount), 'fansInvestCount'],
      [Sequelize.literal(sql_riskIndex), 'riskIndex'],
      [Sequelize.literal(sql_role), 'role'],
      [Sequelize.literal(sql_profitRateFor1Week), 'profitRateFor1Week'],
      [Sequelize.literal(sql_profitRateFor1Month), 'profitRateFor1Month'],
      [Sequelize.literal(sql_profitRateFor3Month), 'profitRateFor3Month'],
      [Sequelize.literal(sql_profitRateFor6Month), 'profitRateFor6Month'],
      [Sequelize.literal(sql_profitRateFor1Year), 'profitRateFor1Year']
    ]),
    where: criteria,
    order: order,
    offset: --page * pageSize,
    limit: pageSize
  }).then(data => {
    data_followInvest = data;

    const array_followInvestId = [];
    data.rows.forEach(item => array_followInvestId.push(item.followInvestId));

    //查询订单
    return Orderlist_bid.findAll({
      raw: true,
      attributes: [
        'borrowid',
        'tradePlatform',
        'curr_type',
        [Sequelize.literal('cast(sum(nowquantity) as decimal(18,6))'), 'quantity']
      ],
      where: {
        borrowid: array_followInvestId,
        status: [2, 5],
        bors: 'b'
      },
      group: 'borrowid, tradePlatform, curr_type'
    });
  }).then(data => {
    data_order = data;

    data_followInvest.rows.forEach(followInvest => {
      followInvest.orders = [];
      data_order.forEach(order => {
        if (followInvest.followInvestId == order.borrowid) followInvest.orders.push(order);
      });
    });

    return Promise.resolve(data_followInvest);
  });
};

/**
 * 查询--附跟投人
 *
 * @param server
 * @param doc
 * @returns {Promise.<T>}
 */
exports.queryAttachLeaderAndFollower = (server, criteria, page, pageSize, order) => {

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];
  const FollowInvest = DB.getModel('followInvest');
  const Orderlist_bid = DB.getModel('orderlist_bid');

  let data_followInvest;
  let data_order;

  const sql_follower_fansUserId = `(select master_register.activecode from master_register where master_register.username = followInvest.username)`;
  const sql_follower_nickname = `(select master_register.nickname from master_register where master_register.username = followInvest.username)`;
  const sql_follower_avatar = `(select master_register.avatar from master_register where master_register.username = followInvest.username)`;
  const sql_follower_fansInvestCount = `(select master_register.fansInvestCount from master_register where master_register.username = followInvest.username)`;
  const sql_follower_riskIndex = `(select master_register.riskIndex from master_register where master_register.username = followInvest.username)`;
  const sql_follower_role = `(select master_register.role from master_register where master_register.username = followInvest.username)`;
  const sql_follower_profitRateFor1Week = `(select master_register.profitRateFor1Week from master_register where master_register.username = followInvest.username)`;
  const sql_follower_profitRateFor1Month = `(select master_register.profitRateFor1Month from master_register where master_register.username = followInvest.username)`;
  const sql_follower_profitRateFor3Month = `(select master_register.profitRateFor3Month from master_register where master_register.username = followInvest.username)`;
  const sql_follower_profitRateFor6Month = `(select master_register.profitRateFor6Month from master_register where master_register.username = followInvest.username)`;
  const sql_follower_profitRateFor1Year = `(select master_register.profitRateFor1Year from master_register where master_register.username = followInvest.username)`;

  const sql_leader_nickname = `(select master_register.nickname from master_register where master_register.activecode = followInvest.leaderId)`;
  const sql_leader_avatar = `(select master_register.avatar from master_register where master_register.activecode = followInvest.leaderId)`;
  const sql_leader_fansInvestCount = `(select master_register.fansInvestCount from master_register where master_register.activecode = followInvest.leaderId)`;
  const sql_leader_riskIndex = `(select master_register.riskIndex from master_register where master_register.activecode = followInvest.leaderId)`;
  const sql_leader_role = `(select master_register.role from master_register where master_register.activecode = followInvest.leaderId)`;
  const sql_leader_profitRateFor1Week = `(select master_register.profitRateFor1Week from master_register where master_register.activecode = followInvest.leaderId)`;
  const sql_leader_profitRateFor1Month = `(select master_register.profitRateFor1Month from master_register where master_register.activecode = followInvest.leaderId)`;
  const sql_leader_profitRateFor3Month = `(select master_register.profitRateFor3Month from master_register where master_register.activecode = followInvest.leaderId)`;
  const sql_leader_profitRateFor6Month = `(select master_register.profitRateFor6Month from master_register where master_register.activecode = followInvest.leaderId)`;
  const sql_leader_profitRateFor1Year = `(select master_register.profitRateFor1Year from master_register where master_register.activecode = followInvest.leaderId)`;

  return FollowInvest.findAndCountAll({
    raw: true,
    attributes: [
      'leaderId',
      [Sequelize.literal(sql_follower_fansUserId), 'follower_fansUserId'],
      [Sequelize.literal(sql_follower_nickname), 'follower_nickname'],
      [Sequelize.literal(sql_follower_avatar), 'follower_avatar'],
      [Sequelize.literal(sql_follower_fansInvestCount), 'follower_fansInvestCount'],
      [Sequelize.literal(sql_follower_riskIndex), 'follower_riskIndex'],
      [Sequelize.literal(sql_follower_role), 'follower_role'],
      [Sequelize.literal(sql_follower_profitRateFor1Week), 'follower_profitRateFor1Week'],
      [Sequelize.literal(sql_follower_profitRateFor1Month), 'follower_profitRateFor1Month'],
      [Sequelize.literal(sql_follower_profitRateFor3Month), 'follower_profitRateFor3Month'],
      [Sequelize.literal(sql_follower_profitRateFor6Month), 'follower_profitRateFor6Month'],
      [Sequelize.literal(sql_follower_profitRateFor1Year), 'follower_profitRateFor1Year'],

      [Sequelize.literal(sql_leader_nickname), 'leader_nickname'],
      [Sequelize.literal(sql_leader_avatar), 'leader_avatar'],
      [Sequelize.literal(sql_leader_fansInvestCount), 'leader_fansInvestCount'],
      [Sequelize.literal(sql_leader_riskIndex), 'leader_riskIndex'],
      [Sequelize.literal(sql_leader_role), 'leader_role'],
      [Sequelize.literal(sql_leader_profitRateFor1Week), 'leader_profitRateFor1Week'],
      [Sequelize.literal(sql_leader_profitRateFor1Month), 'leader_profitRateFor1Month'],
      [Sequelize.literal(sql_leader_profitRateFor3Month), 'leader_profitRateFor3Month'],
      [Sequelize.literal(sql_leader_profitRateFor6Month), 'leader_profitRateFor6Month'],
      [Sequelize.literal(sql_leader_profitRateFor1Year), 'leader_profitRateFor1Year']
    ],
    where: criteria,
    order: order,
    offset: --page * pageSize,
    limit: pageSize
  }).then(data => {
    data_followInvest = data;

    return Promise.resolve(data_followInvest);
  });
};

/**
 * 跟投--委托单
 * @param server
 * @param order
 */
exports.follow = (server, order) => {

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];
  const Master_register = DB.getModel('master_register');
  const FollowInvest = DB.getModel('followInvest');
  const Fund_in_out = DB.getModel('fund_in_out');

  //查看订单是否是跟投单
  if (order.moneyfrom == 'f') return Promise.resolve();

  let array_followInvest;
  let ratio;

  //查询该委托单用户的跟投者
  return Master_register.findOne({
    where: {username: order.username}
  }).then(data => {
    //跟投者资金大于0
    return FollowInvest.findAll({
      where: {
        leaderId: data.activecode,
        rmb_balance: {$gt: 0},
        status: 0
      }
    });
  }).then(data => {
    //没有合适的跟投者
    if (data.length == 0) return Promise.resolve();

    array_followInvest = data;
    //查询领投人持仓比例
    return this.positionRatio(server, order);
  }).then(data => {
    if (!data) return Promise.resolve();

    ratio = data;

    const task = [];

    array_followInvest.forEach(item => {
      task.push(this.followDo(server, order, ratio, item));
    });
    return Promise.all(task);
  }).then(data => {
    return Promise.resolve(order);
  });
};

/**
 * 跟投--委托单--操作
 * @param server
 * @param order
 * @param ratio
 * @param doc
 */
exports.followDo = (server, order, ratio, doc) => {

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];
  const Master_register = DB.getModel('master_register');
  const FollowInvest = DB.getModel('followInvest');
  const Fund_in_out = DB.getModel('fund_in_out');

  //货币类型
  let coinType;
  for (let key in config.coin) {
    if (config.coin[key].code == order.curr_type) coinType = config.coin[key].name;
  }
  const decimal = config.coin[coinType].decimal;

  const total = util_number.floor(doc.rmb_balance * ratio, 2);
  const quantity = order.isMarket ? 0 : util_number.floor(total / order.bidprice, decimal);

  const walletType = 'f';
  const isMarket = order.isMarket;
  const isMatch = 0;
  const isInQueue = 0;
  const isRobot = 0;
  //委托
  return service_orderlist_bid.save(server, doc.username, walletType, doc.followInvestId, order.tradePlatform, coinType, order.bors, quantity, order.bidprice, total, isMarket, isMatch, isInQueue, isRobot, order.username, order.orderid);

};

/**
 * 计算委托单的持仓比例
 * @param server
 * @param order
 */
exports.positionRatio = (server, order) => {

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];
  const Master_register = DB.getModel('master_register');

  return Master_register.findOne({where: {username: order.username}}).then(data => {

    const ratio = order.total / (order.total + data.rmb_balance);

    return Promise.resolve(ratio);
  });
};

/**
 * 跟投--卖出
 * @param server
 * @param order
 */
exports.sell = (server, order) => {

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];
  const Orderlist_bid = DB.getModel('orderlist_bid');

  //查询跟投单
  return Orderlist_bid.findAll({
    where: {
      followOrderid: order.buyOrderid,
      moneyfrom: 'f',
      bors: 'b',
      status: [2, 4]
    }
  }).then(data => {
    data.forEach(item => {
      service_orderlist_bid.sell(server, item, order.bidprice);
    });
    return Promise.resolve();
  });
};

/**
 * 跟投--撤销
 * @param server
 * @param order
 */
exports.cancel = (server, order) => {

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];
  const Orderlist_bid = DB.getModel('orderlist_bid');

  //查询跟投单
  return Orderlist_bid.findAll({
    where: {
      followOrderid: order.bors == 'b' ? order.orderid : order.buyOrderid,
      moneyfrom: 'f',
      status: 0
    }
  }).then(data => {
    data.forEach(item => {
      service_orderlist_bid.cancel(server, item);
    });
    return Promise.resolve();
  });
};

/**
 * 提成
 * @param server
 * @param sellOrder
 */
exports.commission = (server, sellOrder) => {

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];
  const Master_register = DB.getModel('master_register');
  const FollowInvest = DB.getModel('followInvest');
  const Orderlist_bid = DB.getModel('orderlist_bid');
  const Fund_in_out = DB.getModel('fund_in_out');

  //钱包
  let Wallet;
  //钱包条件
  let criteriaForWallet;
  //订单
  let order;
  //领投人提成比例
  let commissionRate;
  //委托单赢利
  let profit;
  //委托单赢利比例
  let profitRate;
  //领投人赢利
  let profitForLeader;
  //平台提成（平台+领投人）
  let profitCommission;


  let docForOrder = {};
  let docForOwner = {};
  let docForLeader = {};
  let docForFundForOwner = {};
  let docForFundForLeader = {};

  //查询订单
  return Orderlist_bid.findOne({
    where: {orderid: sellOrder.buyOrderid}
  }).then(data => {
    order = data;
    if (!order) return Promise.resolve();
    if (order.bors == 's') return Promise.resolve();

    if (order.moneyfrom == 'w') {
      Wallet = Master_register;
      criteriaForWallet = {username: order.username};
    } else {
      Wallet = FollowInvest;
      criteriaForWallet = {followInvestId: order.borrowid};
    }

    //查询领投人分成比例
    return Promise.resolve().then(() => {
      if (!order.followUsername) return Promise.resolve();
      return Master_register.findOne({
        raw: true,
        attributes: ['commissionRate'],
        where: {username: order.followUsername}
      });
    }).then(data => {
      commissionRate = data ? data.commissionRate : 0;

      //流水号
      return util_IDGenerator.gets('fund_in_out', 2, 0);
    }).then(array_transNumber => {

      //委托单赢利
      profit = Number((order.sellRMBBalance - order.nowdealtotal).toFixed(2));
      //委托单赢利比例
      profitRate = Number((profit / order.nowdealtotal).toFixed(2));
      //平台提成（平台+领投人）
      profitCommission = profit > 0 ? Number((profit * config.commissionRate).toFixed(2)) : 0;
      //领投人赢利
      profitForLeader = Number((profitCommission * commissionRate).toFixed(2));

      //订单文档
      docForOrder.profitRate = profitRate;
      docForOrder.profitForLeader = profitForLeader;
      docForOrder.commissionRate = commissionRate;

      //委托人文档
      docForOwner.rmb_balance = Sequelize.literal(`cast(rmb_balance + ${order.sellRMBBalance - profitCommission} as decimal(11, 2))`);

      //领投人文档
      if (profitForLeader) docForLeader.rmb_balance = Sequelize.literal(`cast(rmb_balance + ${profitForLeader} as decimal(11, 2))`);

      //委托人流水
      docForFundForOwner = {
        transNumber: array_transNumber[0],
        username: order.username,
        orderid: order.orderid,
        fundmoneystatus: 'sellsucc',
        curr_type: 0,
        addorminus: 'add',
        actiondate: moment().format('YYYYMMDD'),
        paymode: sellOrder.moneyfrom,
        borrowid: sellOrder.borrowid,
        price: sellOrder.bidprice,
        quantity: sellOrder.nowquantity,
        money: Number((order.sellRMBBalance - profitCommission).toFixed(2))
      };

      //领投人流水
      if (profitForLeader) docForFundForLeader = {
        transNumber: array_transNumber[1],
        username: order.username,
        orderid: order.orderid,
        fundmoneystatus: 'commission',
        curr_type: 0,
        addorminus: 'add',
        actiondate: moment().format('YYYYMMDD'),
        paymode: sellOrder.moneyfrom,
        borrowid: sellOrder.borrowid,
        price: sellOrder.bidprice,
        quantity: sellOrder.nowquantity,
        money: profitForLeader
      };

      //事务
      return Sequelize.transaction(t => {

        //委托人钱包
        return Wallet.update(docForOwner, {
          where: criteriaForWallet,
          transaction: t
        }).then(data => {

          //领投人钱包
          if (!profitForLeader) return Promise.resolve();
          return Master_register.update(docForLeader, {
            where: {username: order.followUsername},
            transaction: t
          });
        }).then(data => {

          //订单
          return Orderlist_bid.update(docForOrder, {
            where: {orderid: sellOrder.buyOrderid},
            transaction: t
          });
        }).then(data => {

          //流水
          const docs = [];
          docs.push(docForFundForOwner);
          if (profitForLeader) docs.push(docForFundForLeader);
          return Fund_in_out.bulkCreate(docs, {transaction: t});
        });

      });

    }).then(() => {
      //计算跟投结束状态
      if (sellOrder.moneyfrom == 'f') this.handelFinishStatus(server, data.borrowid);
      return Promise.resolve(sellOrder);
    });

  });
};

/**
 * 跟投者30日增长曲线
 * @param server
 * @param userId
 */
exports.queryFollowerKLine = (server, userId) => {

  const sql = `
  select 
    date_format(createdAt, '%Y-%m-%d') as date, 
    count(id) as count
    from followInvest 
    where
      leaderId = '${userId}'
    group by date_format(createdAt, '%Y-%m-%d')
    order by date_format(createdAt, '%Y-%m-%d') desc
    limit 0,30
  `;
  return Sequelize.query(sql).then(data => {

    return Promise.resolve(data[0]);
  });
};

/**
 * 是否跟投
 * @param server
 * @param username
 * @param followUserId
 */
exports.isFollowInvest = (server, username, leaderId) => {

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];
  const FollowInvest = DB.getModel('followInvest');

  //查询是否关注过
  return FollowInvest.count({where: {username, leaderId, status: 0}}).then(data => {
    return Promise.resolve(data ? true : false);
  });
};

/**
 * 跟投--处理跟投结束状态
 * @param server
 * @param followInvestId
 */
exports.handelFinishStatus = (server, followInvestId) => {

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];
  const Master_register = DB.getModel('master_register');
  const FollowInvest = DB.getModel('followInvest');
  const Orderlist_bid = DB.getModel('orderlist_bid');
  const Fund_in_out = DB.getModel('fund_in_out');

  let followInvest;

  //查询跟投
  return FollowInvest.findOne({where: {followInvestId: followInvestId}}).then(data => {
    if (!data) return Promise.resolve();
    followInvest = data;

    if (followInvest.status != 1) return Promise.resolve();

    //查询没有成交的跟投单
    return Orderlist_bid.count({
      where: {
        borrowid: followInvestId,
        moneyfrom: 'f',
        status: 0
      }
    }).then(data => {
      if (data > 0) return Promise.resolve();

      //该订单对应的定投已经没有未成交的订单

      //事务
      return Sequelize.transaction(t => {

        //改变跟投状态
        return FollowInvest.update({status: 2}, {where: {followInvestId, status: 1}, transaction: t}).then(data => {
          if (data[0] != 1) throw new Error('跟投状态修改失败');

          //跟投人投人数减少，增加余额
          return Master_register.update({
            fansInvestCount: Sequelize.literal(`cast(followInvestCount - 1 as decimal(11))`),
            rmb_balance: Sequelize.literal(`cast(rmb_balance + ${followInvest.rmb_balance} as decimal(11, 2))`)
          }, {
            where: {username: followInvest.username},
            transaction: t
          });
        }).then(data => {

          //获取流水
          return util_IDGenerator.gets('fund_in_out', 2, 0);
        }).then(array_transNumber => {

          //我的钱包流水
          const fundDocForMaster = {
            transNumber: array_transNumber[0],
            username: followInvest.username,
            orderid: followInvest.followInvestId,
            fundmoneystatus: 'followinvestout',
            curr_type: 0,
            addorminus: 'add',
            actiondate: moment().format('YYYYMMDD'),
            paymode: 'w',
            borrowid: 0,
            price: 0,
            quantity: 0,
            money: followInvest.rmb_balance
          };

          //跟投钱包流水
          const fundDocForFollow = {
            transNumber: array_transNumber[1],
            username: followInvest.username,
            orderid: followInvest.followInvestId,
            fundmoneystatus: 'followinvestout',
            curr_type: 0,
            addorminus: 'minus',
            actiondate: moment().format('YYYYMMDD'),
            paymode: 'f',
            borrowid: 0,
            price: 0,
            quantity: 0,
            money: followInvest.rmb_balance
          };
          //流水记录
          return Fund_in_out.bulkCreate([fundDocForMaster, fundDocForFollow], {transaction: t});
        });
      });
    });
  }).then(() => {
    return FollowInvest.findOne({where: {followInvestId: followInvestId}});
  });
};

/**
 * 跟投--查询投资总额
 * @param server
 * @param username
 */
exports.queryInvestAmount = (server, username) => {

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];
  const FollowInvest = DB.getModel('followInvest');

  return FollowInvest.findOne({
    raw: true,
    attributes: [
      [Sequelize.literal('cast(sum(rmb_balance + rmb_balance_f) as decimal(11, 2))'), 'total']
    ],
    where: {username, status: [0, 1]},
    group: 'username'
  }).then(data => {
    return Promise.resolve(data ? data.total : 0);
  });
};
