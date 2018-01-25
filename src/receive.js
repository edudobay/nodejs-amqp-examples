import amqp from 'amqplib'
import Koa from 'koa'

amqp.connect('amqp://localhost')
  .then(conn => conn.createChannel())
  .then(ch => {
    const QUEUE_NAME = 'hello'
    ch.assertQueue(QUEUE_NAME, {durable: false})

    console.log(` [*] Waiting for messages in ${QUEUE_NAME}. To exit press CTRL+C`)

    const onMessage = (msg) => {
      console.log(` [x] Received ${msg.content.toString()}`)
    }

    ch.consume(QUEUE_NAME, onMessage, {noAck: true})
  })

const app = new Koa()
app.use((ctx, next) => {
  ctx.body = 'Nice weather today, isn\'t it?'
  console.log('A nice weather...')
})
app.listen(3000)
