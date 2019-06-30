const bodyParser = require('body-parser');
const express = require('express');
const theOwl = require('the-owl');

exports.server = {
  close(api) {
    return new Promise((resolve) => {
      if (!api.listening) return resolve();

      api.close(() => {
        console.info('Server closed successfully!');
        resolve();
      });
    });
  },

  listen(app, port) {
    const environment = process.env.NODE_ENV;
    const options = { environment, port };

    return new Promise((resolve, reject) => {
      app.listen(options, function() {
        console.info(`Server listening on port ${port} in ${environment} mode.`);

        const api = this; // The context of the anonymous callback function is the node server instance.
        return resolve(api);
      }).on('error', (err) => {
        return reject(`Failed to start server on port ${port} in ${environment} mode. Stacktrace: ${err}`);
      });
    });
  },

  async start(port = process.env.PORT) {
    const app = express();

    //// STEP 1: Connect the Express middleware so request/response information can be collected.
    theOwl.connect(app);

    // middlewares
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));

    // routes
    app.get('/health', (req, res) => res.status(200).send('OK'));
    app.get('/users', (req, res) => res.status(200)
      .json(
        [{ id: 1, name: 'John' }, { id: 2, name: 'Paul' }]
      )
    );

    const api = await this.listen(app, port);
    return api;
  },
};
