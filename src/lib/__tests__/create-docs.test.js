import test from 'ava';
import uuidv4 from 'uuid/v4';

import { store } from '../../redux';
import {
  createDoc,
  collectRequestInformation,
  collectResponseInformation } from '../../redux/ducks/docs';
import createDocs from '../create-docs';

test.before(t => {
  const id = uuidv4();
  const testName = '(200) returns the given user if it exists';
  store.dispatch(createDoc(id, testName));

  const req = { method: 'get', path: '/users/1' };
  store.dispatch(collectRequestInformation(id, req));

  const res = {
    body: null,
    headers: { 'x-header': 1 },
    statusCode: 200,
  };
  store.dispatch(collectResponseInformation(id, res));
});

// TODO:
test('must create a doc', t => {
  const doc = createDocs();
  console.log('### doc', doc);

  t.pass();
});
