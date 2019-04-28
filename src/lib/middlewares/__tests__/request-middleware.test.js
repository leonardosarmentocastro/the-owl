import test from 'ava';
import { isEmpty } from 'lodash/lang';

import { TEST_ID_HEADER } from '../headers';
import { requestMiddleware } from '../request-middleware';
import { setupRequestMiddleware } from './_helper';
import { store } from '../../../redux';
import { _req, _res } from '../../../redux/ducks/docs/__fixtures__';

test.beforeEach('Simulate the usage of "requestMiddleware" for each test case', t => {
  setupRequestMiddleware(t);
  requestMiddleware(t.context.req, t.context.res, () => null);
});

test.beforeEach('Save the result on store, in order to assert it later', t => {
  const state = store.getState();
  t.context.docs = Object.values(state.docs.byId);
});

test('must fill the store with request data when information must be collected', t => {
  const [ doc ] = t.context.docs; // Doc created by first "beforeEach" invocation.

  t.falsy(isEmpty(doc));
  t.falsy(isEmpty(doc.request));
});

test('must set "test id header" on response, so we can collect the response information later on', t => {
  const [ , doc ] = t.context.docs; // Doc created by second "beforeEach" invocation.
  const { res } = t.context;

  t.assert(res.headers[TEST_ID_HEADER] === doc.id);
});
