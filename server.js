'use strict';

const JWT = require('jsonwebtoken');
const Glue = require('glue');
const manifest = require('./config/manifest.json');
const config = require('./config/config');
const Sequelize = require('sequelize');
const Dotenv = require('dotenv');
Dotenv.config({silent: true});
const fs = require('fs');


if (!process.env.PRODUCTION) {
  manifest.registrations.push({
    "plugin": {
      "register": "blipp",
      "options": {}
    }
  });
}

//配置文件
global.config = config;


Glue.compose(manifest, {
  relativeTo: __dirname,
  //注册插件之前
  preRegister: (server, next) => {

    const sqlconn = new Sequelize(process.env.DB_DBNAME, process.env.DB_USERNAME, process.env.DB_PASSWORD,
      {
        host: process.env.DB_HOST,
        timezone: '+08:00',
        dialect: 'mysql',
        dialectOptions: {
          encrypt: true,
          charset: "utf8mb4",
          collate: "utf8mb4_unicode_ci",
          supportBigNumbers: true,
          bigNumberStrings: true
        },
        define: {
          timestamps: false
        },
        pool: {
          max: 5,
          min: 0,
          idle: 10000
        },
        logging: function(sql) {
          // console.log(sql);
        }
      }
    );

    global.Sequelize = sqlconn;

    const models = [
      './models/users.js',
      './models/borrowlist.js',
      './models/master_register.js',
      './models/orderlist_bid.js',
      './models/orderlist_bid_log.js',
      './models/realtimeprice.js',
      './models/realtimeprice_log.js',
      './models/fund_in_out.js',
      './models/log.js',
      './models/userborrow.js',
      './models/chargeAlipay.js',
      './models/orderlist.js',
      './models/autoInvest.js',
      './models/applywithdraw.js',
      './models/bankaccount.js',
      './models/kLine.js',
      './models/promotion.js',
      './models/transBonusLog.js',
      './models/performance_history.js',
      './models/followee_register.js',
      './models/followinvest.js',
      './models/followee_performance_history.js',
      './models/article.js',
      './models/activity.js',
      './models/guestBook.js',
      './models/guessBorrowlist.js',
      './models/topic.js',
      './models/topicPraiseAndOppose.js',
      './models/followInvest.js',
      './models/trade.js',
      './models/assetsLog.js',
      './models/follow.js',
      './models/profitRate.js',
      './models/leaderRecommend.js',
      './models/exchange.js',
      './models/coin.js',
      './models/riskLog.js',
      './models/riskKLine.js',
      './models/notice.js',
      './models/topicTag.js',
      './models/topicReport.js',
      './models/activityCode.js',

      './models/admin_user.js',
      './models/admin_userOperationLog.js'
    ];

    server.register(
      [
        {
          register: require('hapi-sequelize'),
          options: {
            name: process.env.DB_DBNAME,
            models: models,  // paths/globs to model files
            sequelize: sqlconn,
            sync: false,
            forceSync: false
            // onConnect: function (database) { // Optional
            //   console.log('database connected')
            //   server.app.dbconn = database
            //   let db = server.app.dbconn
            //   let userModel = db.models['users']
            //   userModel.findAll().then(result => {
            //     console.log('++++++++++++++')
            //     result.forEach(e => {
            //       console.log('user mobile', e.mobile)
            //     })
            //     console.log('++++++++++++++')
            //   })
            // }
          }
        },
      ], (err) => {
        if (err) {
          console.error('failed to hapi-sequelize load plugin');
        }

        next();
      }
    );
  }

}, (err, server) => {
  if (err) {
    console.log('server.register err:', err);
  }
  server.start((err) => {
    if (err) console.log('server start err:', err);
  });

  server.ext('onPreResponse', function (request, reply) {

    if (request.response.isBoom) logger.error(request.response);

    reply.continue();

  });
  const DB = server.plugins['hapi-sequelize'][process.env.DB_DBNAME];
  const Admin_userOperationLog = DB.getModel('admin_userOperationLog');

  server.ext({
    type: 'onRequest',
    method: function (request, reply) {
      if (/^\/admin\/.*/.test(request.url.pathname)) {
        const session = JWT.decode(request.headers.authorization, process.env.JWT_SECRET);
        if (session) Admin_userOperationLog.create({
          username: session.username,
          api: request.url.pathname,
          method: request.method,
          query: request.method == 'get' ? JSON.stringify(request.query) : '',
          payload: request.method == 'post' ? request.raw.req._shot ? JSON.stringify(request.raw.req._shot.payload) : '' : ''
        });
      }
      return reply.continue();
    }
  });

  /**
   * 静态资源映射
   */
  server.route({
    method: 'GET',
    path: '/static/{params*}',

    handler: {
      directory: {
        path: 'static'
      }
    }
  });

});
