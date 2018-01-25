import amqp from 'amqplib'
import {promisify} from 'util'

amqp.connect('amqp://localhost')
  .then(conn => {
    const ch = conn.createChannel()
    setTimeout(() => {
      conn.close()
      process.exit(0)
    }, 500)
    return ch
  })
  .then(ch => {
    const QUEUE_NAME = 'hello'
    ch.assertQueue(QUEUE_NAME, {durable: false})
    ch.sendToQueue(QUEUE_NAME, new Buffer('Hello world!'))
    console.log(" [x] Sent 'Hello world!'")
  })
