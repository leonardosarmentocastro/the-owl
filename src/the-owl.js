import {
  createDocFiles,
  requestMiddleware,
  responseMiddleware
} from './lib';
import { store } from './redux';

const theOwl = {
  // TODO: evaluate new version of pattern.
  // get createDocs() { return ...createDocs; },
  // createDocs: { ...createDocs },

  connect(app) {
    app.use(requestMiddleware);
    app.use(responseMiddleware);
  },
  createDocs() {
    const state = store.getState();
    const docs = Object.values(state.docs.byId);
    if (!docs) return null; // Idempotent: no need to generate docs if there are no registries.

    createDocFiles(docs); // TODO: maybe let the user know that the docs were created? (console.log)
  },
};

export default theOwl;

