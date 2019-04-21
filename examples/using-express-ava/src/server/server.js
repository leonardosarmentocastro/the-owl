const express = require('express');

const connect = require('./connect');
const {
  getErrorMessageForServerStatup,
  getSuccessMessageForServerClose,
  getSuccessMessageForServerStatup,
} = require('./messages');

const server = {
  close(api) {
    return new Promise((resolve) => {
      if (!api.listening) return resolve();

      api.close(() => {
        const successMessage = getSuccessMessageForServerClose();
        console.info(successMessage);

        resolve();
      });
    });
  },

  listen(app) {
    const options = {
      port: process.env.PORT,
      environment: process.env.NODE_ENV,
    };

    return new Promise((resolve, reject) => {
      app.listen(options, function() {
        const successMessage = getSuccessMessageForServerStatup(options);
        console.info(successMessage);

        const api = this; // The context of the anonymous callback function is the node server instance.
        return resolve(api);
      }).on('error', (err) => {
        const errorMessage = getErrorMessageForServerStatup(err, options);
        return reject(errorMessage);
      });
    });
  },

  async start() {
    const app = express();
    connect(app);

    const api = await this.listen(app);
    return api;
  },
};

module.exports = server;
