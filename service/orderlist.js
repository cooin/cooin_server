const moment = require('moment-timezone');
const config = require('../config/config');
const util_IDGenerator = require('../lib/IDGenerator');
const util_weChat = require('../lib/weChat');
const service_bankaccount = require('./bankaccount');


/**
 * 查询--附带银行卡
 *
 * @param server
 * @param doc
 * @returns {Promise.<T>}
 */
exports.queryAttachBank = (server, query) => {

  const self = this;

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];

  const Orderlist = DB.getModel('orderlist');

  let data_orderlist;
  let data_bankaccount;

  query.raw = true;

  return Orderlist.findAndCountAll(query).then(data => {
    data_orderlist = data;
    //查询银行
    let array_id = [];
    data_orderlist.rows.forEach(item => {
      if (item.paymode == 'bank') array_id.push(item.depositsource);
    });
    return service_bankaccount.queryAttachUser(server, {
      where: {id: array_id}
    });
  }).then(data => {
    data_bankaccount = data;
    data_orderlist.rows.forEach(orderlist => {
      data_bankaccount.rows.forEach(bankaccount => {
        if (orderlist.depositsource == bankaccount.id) orderlist.bank = bankaccount;
      });
    });
    return Promise.resolve(data_orderlist);
  });

};

/***
 * 用户充值处理
 *
 * 仅在系统自动处理充值失败（自动查询出错）时，给管理人员手动调用
 *
 *   改变充值订单状态
 *   修改钱包金额
 *   添加资金变动记录
 *   发送充值到账消息
 *
 * @param server
 * @param doc 用户充值记录
 */
exports.handle = (server, doc) => {

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];

  const Orderlist = DB.getModel('orderlist');
  const Master_register = DB.getModel('master_register');
  const Fund_in_out = DB.getModel('fund_in_out');

  /*
   * 有相应充值订单
   *    改变充值记录状态（已处理）
   *    改变充值订单状态
   *    修改钱包金额
   *    添加资金变动记录
   */
  return Sequelize.transaction(t => {
    //改变充值订单状态
    return Orderlist.update({
      fundinstatus: 'succ'
    }, {
      where: {
        id: doc.id,
        fundinstatus: 'wait'
      },
      transaction: t
    }).then(data => {
      if (data[0] != 1) throw new Error('充值失败');
      //修改钱包金额
      return Master_register.update({
        rmb_balance: Sequelize.literal(`cast(rmb_balance + ${doc.total} as decimal(11, 2))`)
      }, {
        where: {
          username: doc.username
        },
        transaction: t
      });

    }).then(data => {
      if (data[0] != 1) throw new Error('充值失败');

      //获取流水号
      return util_IDGenerator.get('fund_in_out', doc.currencytype);
    }).then(id => {

      //添加资金变动记录
      let fund_in_outDoc = {
        transNumber: id,
        username: doc.username,
        orderid: doc.id,
        fundmoneystatus: 'in',
        curr_type: doc.currencytype,
        addorminus: 'add',
        actiondate: moment().format('YYYYMMDD'),
        paymode: 'w',
        borrowid: 0,
        price: 0,
        quantity: 0,
        money: doc.total
      };
      return Fund_in_out.create(fund_in_outDoc, {transaction: t});
    })

  }).then(data => {
    //事务成功

    //发送充值到账消息
    this.sendTemplateMsgForChargeSuccess(server, doc).catch(err => logger.error(err));

    return Orderlist.findOne({
      where: {id: doc.id}
    });
  });
};

/**
 * 充值到账通知
 * @param server
 * @param doc 用户充值记录
 * @returns {*}
 */
exports.sendTemplateMsgForChargeSuccess = (server, doc) => {

  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];

  const Master_register = DB.getModel('master_register');

  let master_register;


  //查询充值账户
  return Master_register.findOne({
    where: {username: doc.username}
  }).then(data => {
    master_register = data;
    //用户未关注
    if (master_register.subscribe == 0) return Promise.reject(new Error('用户未关注'));

    //发送消息
    return util_weChat.sendTemplateMsgForChargeSuccess(
      config.weChat.bitekuang.name,
      master_register.openid,
      master_register.username,
      new Date(),
      doc.total,
      master_register.rmb_balance
    );
  });
};
