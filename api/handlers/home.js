const MessageService = require('../../lib/messageservice-api')

module.exports.hello = {
  handler: function (request, reply) {
    // let db = request.server.plugins['hapi-sequelize'].bitkuang
    // let userModel = db.getModel('users')
    let db = request.server.app.dbconn
    let userModel = db.models['users']
    userModel.findAll().then(result => {
      console.log('-----------------------')
      result.forEach(e => {
        console.log('user mobile', e.mobile)
      })
      console.log('-----------------------')
    })
    return reply({ result: 'Hello hapi! 3' + Date.now() });
  }
};

module.exports.restricted = {
  auth: 'jwt',
  handler: function (request, reply) {
    return reply({ result: 'Restricted!' });
  }
};

module.exports.notFound = {
  handler: function (request, reply) {
    return reply({ result: 'Oops, 404 Page!' }).code(404);
  }
};

module.exports.enqueue = {
  handler: function (request, reply) {
    let testMQ = new MessageService(process.env.QUEUE_TESTQUEUE)
    let messageHistory = {error:0, msg: ''}
    messageHistory.content = `just from test`
    let delays = 0
    let priority = 8
    return testMQ.enQueue(messageHistory, priority, delays).then(result => {
      reply(result);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) {
        err = Boom.wrap(err, 400)
      }
      return reply(err)
    })
  }
};

module.exports.dequeue = {
  handler: function (request, reply) {
    let testMQ = new MessageService(process.env.QUEUE_TESTQUEUE)
    let delays = 0
    let priority = 8
    return testMQ.deQueue().then(result => {
      reply(result);
    }).catch(err => {
      if (!err.isBoom && err instanceof Error) {
        err = Boom.wrap(err, 400)
      }
      return reply(err)
    })
  }
};
