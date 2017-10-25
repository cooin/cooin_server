'use strict'
const AliMNS = require("ali-mns");



class MessageServiceAPI{
    constructor(queueName) {
       this.mqEndPoint = process.env.MQ_ENDPOINT
       this.mqAccount = new AliMNS.Account(process.env.ALI_ACCOUNT, process.env.ALI_ACCESSKEY, process.env.ALI_ACCESSKEYSECRET);
       //remove GA Tracking
       this.mqAccount.setGA(false)
       // todo: need to check Queue existence before init it
       this.queueName= queueName
       this.mq = new AliMNS.MQ(queueName, this.mqAccount, process.env.ALI_REGION)
       this.mqBatch = new AliMNS.MQBatch(queueName, this.mqAccount, process.env.ALI_REGION)
    }

    enQueue (message, priority = 8, delaySeconds=0) {
      const {mq, mqBatch} = this
      if(typeof message !== 'string') {
        if(Array.isArray(message)) {
          let msgs = []
          message.forEach(e => {
            let msg = new AliMNS.Msg(JSON.stringify(e))
            msgs.push(msg)
          })
          return mqBatch.sendP(msgs, priority, delaySeconds)
        } else {
          message = JSON.stringify(message)
          return mq.sendP(message, priority, delaySeconds)
        }
      } else {
        return mq.sendP(message, priority, delaySeconds)
      }
    }
    empty (queueSize) {
      let batchSize = 16
      let arrReduce = []
      for(let i =0; i <Math.ceil(queueSize/batchSize); i++) {
        arrReduce.push('Batch NO: ' + i)
      }
      const {mqBatch} = this
      let batchDelete = function(previous) {
        if (typeof previous === 'object' && typeof previous.then === 'function') {
          return previous.then(result => {
            return mqBatch.recvP(0, batchSize).then(result => {
              var rhsToDel = []
              if (Array.isArray(result.Messages.Message)) {
                result.Messages.Message.forEach(e => {
                  console.log('e.ReceiptHandle: ', e.ReceiptHandle)
                  rhsToDel.push(e.ReceiptHandle)
                })
              } else {
                if(result.Message && result.Message.ReceiptHandle) {
                  rhsToDel.push(result.Message.ReceiptHandle)
                }
              }
              return rhsToDel
            }).then(rhsToDel => {
              return mqBatch.deleteP(rhsToDel)
            })
          })
        } else {
          return Promise.resolve(previous)
        }
      }
      arrReduce.reduce((pre, cur) => {
        return batchDelete(pre)
      }, Promise.resolve(1))
    }
    deQueue (waitSeconds = 0) {
      const {mq} = this
      if(waitSeconds) {
        return mq.recvP(waitSeconds)
      } else {
        return mq.recvP()
      }
    }
    deQueueBatch (waitSeconds = 0, batchSize =1) {
      const {mqBatch} = this
      return mqBatch.recvP(waitSeconds, batchSize)
    }
    peekQueueBatch (batchSize) {
      const {mqBatch} = this
      return mqBatch.peekP(batchSize)
    }
    peekQueue (waitSeconds = 0) {
      const {mq} = this
      if(waitSeconds) {
        return mq.peekP(waitSeconds)
      } else {
        return mq.peekP()
      }

    }
    info () {
      const {mq} = this
      return mq.getAttrsP()
    }

    // delete (receiptHandle) {
    //   const {mq} = this
    //   return mq.deleteP(receiptHandle)
    // }

    delete (receiptHandle, timeout) {

      return new Promise((resolve, reject) => {

        const {mq} = this

        const start = Date.now();

        let isTimeout = true

        setTimeout(() => {
          if (isTimeout) reject(new Error('删除信息超时'))
        }, timeout)

        mq.deleteP(receiptHandle).then(data => {

          //超时
          if (Date.now() - start > timeout) return

          isTimeout = false

          resolve(data)
        })

      })


    }

    reserve (receiptHandle, timeout) {
      const {mq} = this
      return mq.reserveP(receiptHandle, timeout)
    }
}

module.exports = MessageServiceAPI;
