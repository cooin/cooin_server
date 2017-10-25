'use strict';
const Joi = require('joi')
const Boom = require('boom')
const sequelize = require('sequelize')
const JWT = require('jsonwebtoken')
const Errno = require('../../models/errno')

module.exports.register = {
  validate: {
    payload: {
      username: Joi.string().min(11).max(11).required(),
      password: Joi.string().min(6).max(25).required()
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {

    let db = request.getDb(process.env.DB_DBNAME)
    let userModel = db.getModel('master_register')
    let payload = request.payload
    let userObj = payload
    // 交易密码自动生成
    userObj.dealpassword = userModel.generatePassword()
    userObj.shibiepass = userModel.generatePassword()
    userObj.lastdealdate = 0
    userObj.howmanydeal = 0
    userObj.frozedata = ''
    let criteria = {username: userObj.username}
    userModel.findOrCreate({where: criteria, defaults: userObj}).spread((user, created) => {
      console.log('user password_login:', user.password_login)
      console.log('user password_safe:', user.get('password_safe'))
      if (created) {
        return reply({result: 'user register'})
      } else {
        return reply({result: 'user already exists'})
      }
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) {
        err = Boom.wrap(err, 400)
      }
      return reply(err)
    })
  }
};

module.exports.login = {
  validate: {
    payload: {
      username: Joi.string().min(11).max(12).required(),
      password: Joi.string().min(6).max(25).required()
    },
    options: {
      allowUnknown: false
    }
  },
  handler: function (request, reply) {
    let db = request.getDb(process.env.DB_DBNAME)
    let userModel = db.getModel('master_register')
    let payload = request.payload
    let findOptions = {}
    findOptions.where = {username: payload.username}
    userModel.findOne(findOptions).then(user => {
      if(user) {
        if(user.password === payload.password) {
          var session = {
            valid: true,
            username: user.username,
            userid: user.id,
            exp: new Date().getTime() + 30 * 60 * 1000 // expires in 30 minutes time
          }
          var token = JWT.sign(session, process.env.JWT_SECRET); // synchronous
          console.log(token);
          return reply({result: 'ok', Authorization: token}).header("Authorization", token);
        } else {
          let err = new Error('password mismatch')
          err.errno = Errno.Passport.passwordMismatch
          throw err
        }
      } else {
        let err = new Error('user not found')
        err.errno = Errno.Passport.userNotFound
        throw err
      }
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) {
        err = Boom.wrap(err, 400)
      }
      return reply(err)
    })

  }
};

module.exports.authByJwt = {
  auth: 'jwt',
  handler: function (request, reply) {
    let token = request.headers.authorization || request.payload.authorization
    var decoded = JWT.decode(token, process.env.JWT_SECRET);
    console.log('decoded:', decoded);
    if(decoded && decoded.valid) {
      return reply(decoded);
    } else {
      return reply({decode: 'error'});
    }

  }
};
