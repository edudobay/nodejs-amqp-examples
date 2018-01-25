import amqp from 'amqplib'

function finalizer (conn) {
  return () => {
    conn.close()
    process.exit(0)
  }
}

amqp.connect('amqp://localhost')
  .then(conn => {
    const ch = conn.createChannel()
    setTimeout(finalizer(conn), 500)
    return ch
  })
  .then(ch => {
    const EXCHANGE = 'logs'
    const msg = process.argv.slice(2).join(' ') || 'Hello world!'
    const payload = {message: msg, timestamp: Date.now()}

    ch.assertExchange(EXCHANGE, 'fanout', {durable: false})
    ch.publish(EXCHANGE, '',
      new Buffer(JSON.stringify(payload)),
      {contentType: 'application/json'}
    )

    console.log(` [x] Sent ${msg}`)
  })
