import {
  createDocFiles,
  requestMiddleware,
  responseMiddleware,
  TEST_NAME_HEADER,
  REQ_ORIGINAL_PATH_HEADER,
} from './lib';
import { store } from './redux';

export const theOwl = {
  connect(app) {
    app.use(requestMiddleware);
    app.use(responseMiddleware);
  },

  createDocs() {
    if (process.env.THE_OWL_DISABLE) return; // Flag to optionally disable doc creation when running tests on "watch" mode.

    const state = store.getState();
    const docs = Object.values(state.docs.byId);
    if (docs.length === 0) return null; // Idempotent: no need to generate docs if there are no registries.

    createDocFiles(docs);
  },

  buildHeaders: (testName, reqOriginalPath) => ({
    [TEST_NAME_HEADER]: testName,
    [REQ_ORIGINAL_PATH_HEADER]: reqOriginalPath,
  }),
};
