const test = require('ava');
const { isEmpty } = require('lodash/lang');

const { _req, _res, store } = require('../../../redux');
const { TEST_NAME_HEADER } = require('../headers');
const { requestMiddleware } = require('../request-middleware');
const { setupRequestMiddleware } = require('../__helpers__');

const simulateRequestMiddlewareUsage = t => {
  setupRequestMiddleware(t);
  requestMiddleware(t.context.req, t.context.res, () => null);
};

const getDocs = () => {
  const state = store.getState();
  const docs = Object.values(state.docs.byId);

  return docs;
}

test.serial('must not fill the store with request data when information must not be collected', t => {
  const req = { ..._req };
  const res = { ..._res };
  requestMiddleware(req, res, () => null);

  const docs = getDocs();
  t.assert(docs.length === 0);
});

test.serial('must fill the store with request data when information must be collected', t => {
  simulateRequestMiddlewareUsage(t);
  const [ doc ] = getDocs();

  t.falsy(isEmpty(doc));
  t.falsy(isEmpty(doc.request));
});

test.serial(`must set "${TEST_NAME_HEADER}" on response, so we can collect the response information later on`, t => {
  simulateRequestMiddlewareUsage(t);
  const [ , doc ] = getDocs();
  const { res } = t.context; // Passed through and modified by "requestMiddleware".

  t.assert(res.headers[TEST_NAME_HEADER] === doc.testName);
});
