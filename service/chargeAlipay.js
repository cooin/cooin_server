const moment = require('moment-timezone');
const config = require('../config/config');
const util_IDGenerator = require('../lib/IDGenerator');
const util_weChat = require('../lib/weChat');

/***
 * 支付宝充值处理
 *
 * 查询充值订单
 * 有相应充值订单
 *    改变充值记录状态（已处理）
 *    改变充值订单状态
 *    修改钱包金额
 *    添加资金变动记录
 * 没有相应充值订单
 *    改变充值记录状态（处理失败）
 *
 * 发送充值到账消息
 *
 * @param server
 * @param doc 支付宝充值记录
 */
exports.handle = (server, doc) => {

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];

  const ChargeAlipay = DB.getModel('chargeAlipay');
  const Orderlist = DB.getModel('orderlist');
  const Master_register = DB.getModel('master_register');
  const Fund_in_out = DB.getModel('fund_in_out');

  let orderlist;

  //查询充值订单
  return Orderlist.findOne({
    where: {
      fundinstatus: 'wait',
      paymode: 'alipay',
      currencytype: 0,
      // depositsource: doc.otherAccountEmail,
      codea: doc.transMemo,
      total: doc.tradeAmount
    }
  }).then(data => {

    orderlist = data;

    /*
     *没有相应充值订单
     *改变充值记录状态（处理失败）
     */
    if (!orderlist) {
      return ChargeAlipay.update({
        status: 2
      }, {
        where: {
          id: doc.id
        }
      });
    }

    /*
     * 有相应充值订单
     *    改变充值记录状态（已处理）
     *    改变充值订单状态
     *    修改钱包金额
     *    添加资金变动记录
     */
    return Sequelize.transaction(t => {
      //改变充值记录状态（已处理）
      return ChargeAlipay.update({
        status: 1,
        chargeRecordId: orderlist.orderid
      }, {
        where: {
          id: doc.id,
          status: 0
        },
        transaction: t
      }).then(data => {
        if (data[0] != 1) throw new Error('充值失败');
        //改变充值订单状态
        return Orderlist.update({
          fundinstatus: 'succ'
        }, {
          where: {
            id: orderlist.id,
            fundinstatus: 'wait'
          },
          transaction: t
        });

      }).then(data => {
        if (data[0] != 1) throw new Error('充值失败');
        //修改钱包金额
        return Master_register.update({
          rmb_balance: Sequelize.literal(`cast(rmb_balance + ${doc.tradeAmount} as decimal(11, 2))`)
        }, {
          where: {
            username: orderlist.username
          },
          transaction: t
        });

      }).then(data => {
        if (data[0] != 1) throw new Error('充值失败');

        //获取流水号
        return util_IDGenerator.get('fund_in_out', orderlist.currencytype);
      }).then(id => {

        //添加资金变动记录
        let fund_in_outDoc = {
          transNumber: id,
          username: orderlist.username,
          orderid: doc.id,
          fundmoneystatus: 'in',
          curr_type: orderlist.currencytype,
          addorminus: 'add',
          actiondate: moment().format('YYYYMMDD'),
          paymode: 'w',
          borrowid: 0,
          price: 0,
          quantity: 0,
          money: doc.tradeAmount
        };
        return Fund_in_out.create(fund_in_outDoc, {transaction: t});
      })

    }).then(data => {
      //事务成功

      //发送充值到账消息
      this.sendTemplateMsgForChargeSuccess(server, doc, orderlist.orderid).catch(err => logger.error(err));

      return ChargeAlipay.findOne({
        where: {id: doc.id}
      });
    });
  })
};

/***
 * 支付宝充值处理（处理系统标记失败的）
 *
 * 查询充值订单
 * 有相应充值订单
 *    改变充值记录状态（已处理）
 *    改变充值订单状态
 *    修改钱包金额
 *    添加资金变动记录
 *
 * @param server
 * @param doc 支付宝充值记录
 * @param orderid 充值订单号
 * @param orderid 备注
 */
exports.handleFailed = (server, doc, orderid, remarks) => {

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];

  const ChargeAlipay = DB.getModel('chargeAlipay');
  const Orderlist = DB.getModel('orderlist');
  const Master_register = DB.getModel('master_register');
  const Fund_in_out = DB.getModel('fund_in_out');

  let orderlist;

  //查询充值订单（等待处理中）
  return Orderlist.findOne({
    where: {
      orderid: orderid,
      fundinstatus: 'wait'
    }
  }).then(data => {
    orderlist = data;
    if (!orderlist) throw new Error('充值订单不是待处理状态');

    /*
     * 有相应充值订单
     *    改变充值记录状态（已处理）
     *    改变充值订单状态
     *    修改钱包金额
     *    添加资金变动记录
     */
    return Sequelize.transaction(t => {
      //改变充值记录状态（已处理），从失败状态
      return ChargeAlipay.update({
        status: 1,
        chargeRecordId: orderlist.orderid
      }, {
        where: {
          id: doc.id,
          status: 2
        },
        transaction: t
      }).then(data => {
        if (data[0] != 1) throw new Error('充值失败');
        //改变充值订单状态
        return Orderlist.update({
          fundinstatus: 'succ',
          admintxt: remarks
        }, {
          where: {
            id: orderlist.id,
            fundinstatus: 'wait'
          },
          transaction: t
        });

      }).then(data => {
        if (data[0] != 1) throw new Error('充值失败');
        //修改钱包金额
        return Master_register.update({
          rmb_balance: Sequelize.literal(`cast(rmb_balance + ${doc.tradeAmount} as decimal(11, 2))`)
        }, {
          where: {
            username: orderlist.username
          },
          transaction: t
        });

      }).then(data => {
        if (data[0] != 1) throw new Error('充值失败');

        //获取流水号
        return util_IDGenerator.get('fund_in_out', orderlist.currencytype);
      }).then(id => {

        //添加资金变动记录
        let fund_in_outDoc = {
          transNumber: id,
          username: orderlist.username,
          orderid: doc.id,
          fundmoneystatus: 'in',
          curr_type: orderlist.currencytype,
          addorminus: 'add',
          actiondate: moment().format('YYYYMMDD'),
          paymode: 'w',
          borrowid: 0,
          price: 0,
          quantity: 0,
          money: doc.tradeAmount
        };
        return Fund_in_out.create(fund_in_outDoc, {transaction: t});
      })

    }).then(data => {
      //事务成功

      //发送充值到账消息
      this.sendTemplateMsgForChargeSuccess(server, doc, orderlist.orderid).catch(err => logger.error(err));

      return ChargeAlipay.findOne({
        where: {id: doc.id}
      });
    });
  })
};

/**
 * 充值到账通知
 * @param server
 * @param doc 支付宝充值记录
 * @param orderid
 * @returns {*}
 */
exports.sendTemplateMsgForChargeSuccess = (server, doc, orderid) => {

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];

  const Orderlist = DB.getModel('orderlist');
  const Master_register = DB.getModel('master_register');

  let orderlist, master_register;

  //查询充值订单（等待处理中）
  return Orderlist.findOne({
    where: {
      orderid: orderid
    }
  }).then(data => {
    orderlist = data;
    //查询充值账户
    return Master_register.findOne({
      where: {username: orderlist.username}
    });
  }).then(data => {
    master_register = data;
    //用户未关注
    if (master_register.subscribe == 0) return Promise.reject(new Error('用户未关注'));

    //发送消息
    return util_weChat.sendTemplateMsgForChargeSuccess(
      config.weChat.bitekuang.name,
      master_register.openid,
      master_register.username,
      doc.tradeTime,
      doc.tradeAmount,
      master_register.rmb_balance
    );
  });
};
