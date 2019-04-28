import test from 'ava';
import { isEmpty } from 'lodash/lang';

import { TEST_ID_HEADER } from '../headers';
import { requestMiddleware } from '../request-middleware';
import { setupRequestMiddleware } from './_helper';
import { store } from '../../../redux';
import { _req, _res } from '../../../redux/ducks/docs/__fixtures__';

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

test.serial('must set "test id header" on response, so we can collect the response information later on', t => {
  simulateRequestMiddlewareUsage(t);
  const [ , doc ] = getDocs();
  const { res } = t.context; // Passed through and modified by "requestMiddleware".

  t.assert(res.headers[TEST_ID_HEADER] === doc.id);
});
