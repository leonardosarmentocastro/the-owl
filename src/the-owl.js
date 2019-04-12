import { requestMiddleware, responseMiddleware } from './middlewares';

const theOwl = {
  connect(app) {
    app.use(requestMiddleware);
    app.use(responseMiddleware);
  },
};

module.exports = theOwl;
