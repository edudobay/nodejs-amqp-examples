import amqp from 'amqplib'
import Koa from 'koa'
import Router from 'koa-router'
import { EventEmitter } from 'events';
import koaBody from 'koa-body'

const control = new EventEmitter()
const components = new Set()

class AmqpApp {
  constructor () {
    this._started = false
  }

  async start () {
    if (this._started) {
      return
    }

    this._started = true

    const conn = await amqp.connect('amqp://localhost')
    const ch = await conn.createChannel()

    const EXCHANGE = 'logs'
    ch.assertExchange(EXCHANGE, 'fanout', {durable: false})

    const q = await ch.assertQueue('', {exclusive: true})

    console.log(` [*] Waiting for messages in ${q.queue}. To exit press CTRL+C`)

    ch.bindQueue(q.queue, EXCHANGE, '')

    const onMessage = (msg) => {
      console.log(` [x] Received ${msg.content.toString()}`, msg.properties)
    }

    ch.consume(q.queue, onMessage, {noAck: true})

    const closed = () => {
      console.log(` [*] Stopped listening to ${q.queue}.`)
      this._started = false
      this._conn = null
    }

    conn.on('close', closed)

    this._conn = conn
  }

  _stopped () {
    this._started = false
    this._conn = null
  }

  async stop () {
    if (!this._started) {
      return
    }

    await this._conn.close()
  }

  static configure({started = true} = {}) {
    components.add('amqp')
    const app = new AmqpApp()

    control.on('start.amqp', () => app.start())
    control.on('stop.amqp', () => app.stop())
    control.on('close', () => app.stop())

    if (started) {
      app.start()
    }
  }

}

class ControlApp {
  constructor ({port = 3200} = {}) {
    this._port = port
  }

  start() {
    const app = new Koa()
    const router = new Router()
    const port = this._port

    const validateComponent = (component, ctx, next) => {
      if (!components.has(component)) {
        return ctx.status = 404
      }
      return next()
    }

    router
    .param('component', validateComponent)
    .post('/components/:component/state', koaBody(), (ctx, next) => {
      const {component} = ctx.params
      const started = parseInt(ctx.request.body.started)
      if (isNaN(started) || (started !== 0 && started !== 1)) {
        return ctx.status = 400
      }
      const action = started ? 'start' : 'stop'
      control.emit(`${action}.${component}`)
      ctx.body = {status: 'ok'}
    })

    router.post('/shutdown', (ctx, next) => {
      setImmediate(() => control.emit('close'))
      ctx.body = {status: 'ok'}
    })

    app.use(router.routes())
    app.use(router.allowedMethods())

    console.log(` [*] Listening to control commands on port ${port}`)
    const server = app.listen(port)

    server.on('close', () => {
      console.log(" [*] Control listener closed.")
    })

    control.on('close', () => {
      server.close()
    })
  }

  static configure (config = {}) {
    const app = new ControlApp(config)
    app.start()
  }
}

ControlApp.configure()
AmqpApp.configure()

process.once('SIGINT', () => {
  control.emit('close')
})
