import test from 'ava';
import { isEmpty } from 'lodash/lang';

import { setupRequestMiddleware } from './_helper';
import { requestMiddleware } from '../request-middleware';
import { fn as responseMiddleware } from '../response-middleware';
import { store } from '../../../redux';
import { _req, _res } from '../../../redux/ducks/docs/__fixtures__';

const simulateResponseMiddlewareUsage = (t) => {
  setupRequestMiddleware(t);
  requestMiddleware(t.context.req, t.context.res, () => null);
  responseMiddleware(t.context.res.body, t.context.req, t.context.res);
}

const getDocs = () => {
  const state = store.getState();
  const docs = Object.values(state.docs.byId);

  return docs;
}

test.serial('must not fill the store with response data when information must not be collected', t => {
  const req = { ..._req };
  const res = { ..._res };
  responseMiddleware(res.body, req, res);

  const docs = getDocs();
  t.assert(docs.length === 0);
});

test.serial('must fill the store with response data when information must be collected', t => {
  simulateResponseMiddlewareUsage(t);
  const [ doc ] = getDocs();

  t.falsy(isEmpty(doc));
  t.falsy(isEmpty(doc.response));
});
