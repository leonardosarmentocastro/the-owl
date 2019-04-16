import {
  createDocs,
  requestMiddleware,
  responseMiddleware
} from './lib';

const theOwl = {
  // TODO: evaluate new version of pattern.
  // get createDocs() { return ...createDocs; },
  // createDocs: { ...createDocs },

  connect(app) {
    app.use(requestMiddleware);
    app.use(responseMiddleware);
  },
  createDocs,
};

module.exports = theOwl;
