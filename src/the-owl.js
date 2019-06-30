const { store } = require('./redux');
const {
  createDocFiles,
  requestMiddleware,
  responseMiddleware,
  TEST_NAME_HEADER, REQ_ORIGINAL_PATH_HEADER,
} = require('./lib');

const theOwl = {
  buildHeaders: (testName, reqOriginalPath) => ({
    [TEST_NAME_HEADER]: testName,
    [REQ_ORIGINAL_PATH_HEADER]: reqOriginalPath,
  }),

  connect(app) {
    app.use(requestMiddleware);
    app.use(responseMiddleware);
  },

  createDocs() {
    // Flag to optionally disable doc creation when running tests on "watch" mode.
    if (!process.env.CREATE_DOCS) return;

    const state = store.getState();
    const docs = Object.values(state.docs.byId);
    if (docs.length === 0) return null; // Idempotent: no need to generate docs if there are no registries.

    createDocFiles(docs);
  },
};

module.exports = theOwl;
