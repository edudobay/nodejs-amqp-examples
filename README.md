# AMQP examples

These examples are based on the [RabbitMQ tutorial](https://www.rabbitmq.com/tutorials/tutorial-one-javascript.html), but I’ve used the Promise style API instead of the callback API.

To run the examples, you can `npm run build` and then run the transpiled scripts from the `dist` directory, or you can `npm run dev <scriptname>` replacing the `<scriptname>` by a `src/XXX.js` path. (This is needed because of ES6 module syntax not being available by default under Node.)

This was developed under Node.js 8.9.4, the latest LTS version at the time of writing.
