import test from 'ava';
import { isEmpty } from 'lodash/lang';

import { setupRequestMiddleware } from './_helper';
import { requestMiddleware } from '../request-middleware';
import { fn as responseMiddleware } from '../response-middleware';
import { store } from '../../../redux';

test.beforeEach('Setup the request middleware', t => {
  setupRequestMiddleware(t);
  requestMiddleware(t.context.req, t.context.res, () => null);
});

test.beforeEach(`Simulate the usage of "requestMiddleware/responseMiddleware" for each test case,
where a request middleware happens first to collect data which will be later refered on "responseMiddleware"
through headers`, t => {
  responseMiddleware(t.context.res.body, t.context.req, t.context.res);
});

test.beforeEach('Save the result on store, in order to assert it later', t => {
  const state = store.getState();
  t.context.docs = Object.values(state.docs.byId);
});

test('must fill the store with response data when information must be collected', t => {
  const [ doc ] = t.context.docs; // Doc created by first set of "beforeEach" invocations.

  t.falsy(isEmpty(doc));
  t.falsy(isEmpty(doc.response));
});
