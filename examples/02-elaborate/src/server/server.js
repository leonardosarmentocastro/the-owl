const express = require('express');

const connect = require('./connect');
const {
  getErrorMessageForServerStartup,
  getSuccessMessageForServerClose,
  getSuccessMessageForServerStartup,
} = require('./messages');

exports.server = {
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

  listen(app, port) {
    const environment = process.env.NODE_ENV;
    const options = { environment, port };

    return new Promise((resolve, reject) => {
      app.listen(options, function() {
        const successMessage = getSuccessMessageForServerStartup(options);
        console.info(successMessage);

        const api = this; // The context of the anonymous callback function is the node server instance.
        return resolve(api);
      }).on('error', (err) => {
        const errorMessage = getErrorMessageForServerStartup(err, options);
        return reject(errorMessage);
      });
    });
  },

  async start(port = process.env.PORT) {
    const app = express();
    connect(app);

    const api = await this.listen(app, port);
    return api;
  },
};
