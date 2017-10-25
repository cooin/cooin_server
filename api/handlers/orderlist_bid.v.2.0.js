'use strict';
const Joi = require('joi');
const Boom = require('boom');


/**
 * 下单
 * 使用行级锁
 * SQL
 */
module.exports.save = {
  validate: {
    payload: {
      walletType: Joi.number().integer().required().valid(1, 2),
      borrowid: Joi.number().integer().when('walletType', {is: 2, then: Joi.required()}),
      coinType: Joi.string().required().valid('btc', 'ltc'),
      bors: Joi.string().required().valid('b', 's'),
      quantity: Joi.number().greater(0).required(),
      bidprice: Joi.number().greater(0).required(),
      dealpassword: Joi.string().min(6).max(20).required(),
      username: Joi.string()//测试参数
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    let payload = request.payload;
    // console.log(payload);

    //下单机器人每次购买数量范围btc
    const ORDER_ROBOT_QUANTITY_BTC = process.env.ORDER_ROBOT_QUANTITY_BTC.split(',');
    //下单机器人每次购买数量范围ltc
    const ORDER_ROBOT_QUANTITY_LTC = process.env.ORDER_ROBOT_QUANTITY_LTC.split(',');

    let DB = request.getDb(process.env.DB_DBNAME);
    let master_registerModel = DB.getModel('master_register');
    let borrowlistModel = DB.getModel('borrowlist');
    let orderlist_bidModel = DB.getModel('orderlist_bid');

    let username = payload.username ? payload.username : "Jack";

    //查询我的钱包、赠金额钱包（没有也查）
    Promise.all([
      //我的钱包
      master_registerModel.findOne({
        attributes: ['id'],
        where: {username: username}
      }),
      //赠金钱包
      borrowlistModel.findOne({
        attributes: ['id'],
        where: {username: username, borrowid: payload.borrowid, status: 2}
      })

    ]).then(datas => {

      return Sequelize.transaction(t => {

        //查询我的钱包、赠金额钱包（没有也查）（行级锁）
        return Promise.all([
          //我的钱包
          master_registerModel.findOne({
            attributes: ['id', 'rmb_balance', 'btc_balance', 'bt2_balance', 'rmb_balance_f', 'btc_balance_f', 'bt2_balance_f', 'dealpassword'],
            where: {id: datas[0].id},
            forUpdate: true,
            transaction: t
          }),
          //赠金钱包
          borrowlistModel.findOne({
            attributes: ['id', 'rmb_balance', 'btc_balance', 'bt2_balance', 'rmb_balance_f', 'btc_balance_f', 'bt2_balance_f'],
            where: {id: datas[1] ? datas[1].id : null},
            forUpdate: true,
            transaction: t
          })

        ]).then(datas => {

          //我的钱包
          let data = datas[0];

          //钱包都不存在
          if (!data) return Promise.reject(Boom.wrap(new Error('NOT FOUND'), 404));

          //查看密码是否正确
          if (data.dealpassword != payload.dealpassword) return Promise.reject(Boom.wrap(new Error('dealpassword wrong'), 400));

          //订单总价
          let total = Number(new Number(payload.quantity * payload.bidprice).toFixed(2));

          //交易方式
          if (payload.walletType == 2) {
            if (!datas[1]) return Promise.reject(Boom.wrap(new Error('NOT FOUND'), 400));
          }

          //如果是买，查看相关货币余额是否满足购买条件
          if (payload.bors == 'b') {
            //钱包余额
            let rmb_balance = payload.walletType == 1 ? data.rmb_balance : datas[1].rmb_balance;
            if (rmb_balance < total) return Promise.reject(Boom.wrap(new Error('balance is not enough'), 400));
          }

          //如果是卖
          if (payload.bors == 's') {
            let coinCount;
            switch (payload.coinType) {
              case 'btc':
                coinCount = data.btc_balance;
                break;
              case 'ltc':
                coinCount = data.bt2_balance;
                break;
            }
            if (coinCount < payload.quantity) return Promise.reject(Boom.wrap(new Error('btc is not enough'), 400));
          }


          let now = new Date();
          //订单
          let order = {
            orderid: new Date().getTime(),
            username: username,
            bors: payload.bors,
            curr_type: payload.coinType == 'btc' ? 1 : 2,
            moneyfrom: payload.walletType == 1 ? 'W' : 'C',
            borrowid: payload.borrowid,
            quantity: payload.quantity,
            bidprice: payload.bidprice,
            total: total,
            orderdate: '' + now.getFullYear() + (now.getMonth() + 1) + now.getDate()
          };
          order.orderdatedetail = order.orderdate + now.getHours() + now.getMinutes();


          //卖出（btc、bt2数量操作）
          if (payload.bors == 's') {

            let sql;

            let decimal;

            switch (payload.coinType) {
              case 'btc':
                decimal = ORDER_ROBOT_QUANTITY_BTC[2];
                sql = `update master_register 
                set 
                  btc_balance = cast(btc_balance - :quantity as decimal(11, ${decimal})), 
                  btc_balance_f = cast(btc_balance_f + :quantity as decimal(11, ${decimal})) 
                where 
                  btc_balance >= :quantity
                  and id = :id`;
                break;
              case 'ltc':
                decimal = ORDER_ROBOT_QUANTITY_LTC[2];
                sql = `update master_register 
                set 
                  bt2_balance = cast(bt2_balance - :quantity as decimal(11, ${decimal})), 
                  bt2_balance_f = cast(bt2_balance_f + :quantity as decimal(11, ${decimal})) 
                where 
                  bt2_balance >= :quantity
                  and id = :id`;
                break;
            }

            return Promise.all([
              Sequelize.query(sql, {
                transaction: t,
                replacements: {
                  quantity: payload.quantity,
                  id: data.id
                }
              }),
              orderlist_bidModel.create(order, {transaction: t})
            ]).catch(err => {
              console.log(err);
            });

          }

          //买入（rmb金额操作）
          if (payload.bors == 'b') {

            let sql;

            let decimal = 2;

            switch (payload.walletType) {
              case 1:
                sql = `update master_register
                set
                  rmb_balance = cast(rmb_balance - :total as decimal(11, ${decimal})),
                  rmb_balance_f = cast(rmb_balance_f + :total as decimal(11, ${decimal}))
                where
                  rmb_balance >= :total
                  and id = :id`;
                break;
              case 2:
                sql = `update borrowlist 
                set 
                  rmb_balance = cast(rmb_balance - :total as decimal(11, ${decimal})),
                  rmb_balance_f = cast(rmb_balance_f + :total as decimal(11, ${decimal}))
                where 
                  rmb_balance >= :total
                  and id = :id`;
                break;
            }
            return Promise.all([
              Sequelize.query(sql, {
                transaction: t,
                replacements: {
                  total: total,
                  id: payload.walletType == 1 ? data.id : datas[1].id
                }
              }),
              orderlist_bidModel.create(order, {transaction: t})
            ]).catch(err => {
              console.log(err);
            });

          }

        }).then(function (data) {
          // Transaction has been committed
          reply(data);
          return;

          /**
           * 推送交易数据
           */
          socketUtil.emit('trans', data);

          /**
           * 推送钱包金额变动消息
           */
          //查询我的钱包、赠金额钱包（没有也查）
          Promise.all([
            //我的钱包
            master_registerModel.findOne({
              attributes: ['rmb_balance', 'btc_balance', 'bt2_balance', 'rmb_balance_f', 'btc_balance_f', 'bt2_balance_f'],
              where: {username: username}
            }),
            //赠金钱包
            borrowlistModel.findOne({
              attributes: ['rmb_balance', 'btc_balance', 'bt2_balance', 'rmb_balance_f', 'btc_balance_f', 'bt2_balance_f', 'borrowid'],
              where: {username: username, borrowid: payload.borrowid, status: 2}
            })

          ]).then(datas => {
            socketUtil.send(username, 'wallet', datas).then(() => {

            }).catch(err => {
              console.log(err);
            });
          });

        });

      });

    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });

  }
};

/**
 * 查询（orderid）
 */
module.exports.queryForCurrentUserByOrderid = {
  validate: {
    params: {
      orderid: Joi.number().integer().required()
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    const params = request.params;
    const DB = request.getDb(process.env.DB_DBNAME);
    const Orderlist_bid = DB.getModel('orderlist_bid');
    const Orderlist_bid_log = DB.getModel('orderlist_bid_log');

    Promise.all([
      //订单
      Orderlist_bid.findOne({
        where: {
          orderid: params.orderid
        }
      }),
      //订单撮合记录
      Orderlist_bid_log.findAll({
        where: {
          $or: [
            {buyOrderId: params.orderid},
            {sellOrderId: params.orderid}
          ]
        }
      })
    ]).then(datas => {
      if (!datas[0]) return Promise.reject(Boom.wrap(new Error('NOT FOUND'), 404));
      datas[0].get().orderlist_bid_log = datas[1];
      reply(datas[0].get());
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) err = Boom.wrap(err, 400);
      reply(err);
    });

  }
};
