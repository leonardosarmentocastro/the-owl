import test from 'ava';
import uuidv4 from 'uuid/v4';

import { store } from '../../redux';
import {
  createDoc,
  collectRequestInformation,
  collectResponseInformation } from '../../redux/ducks/docs';
import createDocFiles from '../create-doc-files';

test.before(t => {
  const id = uuidv4();
  const testName = '(200) returns the given user if it exists';
  store.dispatch(createDoc(id, testName));

  const req = {
    method: 'get',
    path: '/users/1',
    headers: {
      'x-request-header': 1
    },
  };
  store.dispatch(collectRequestInformation(id, req));

  const res = {
    body: { id: 1, name: 'Leonardo' },
    headers: null,
    statusCode: 200,
  };
  store.dispatch(collectResponseInformation(id, res));
});

// TODO: test the actual doc creation, not markdown writing (this test was being used for development)
test('must create a doc', t => {
  const state = store.getState();
  const docs = Object.values(state.docs.byId);

  const markdown = createDocFiles(docs);
  console.log('### markdown\r\n', markdown);

  t.pass();
});
