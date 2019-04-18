import test from 'ava';
import uuidv4 from 'uuid/v4';

import { store } from '../../redux';
import { createDocForTests } from '../../redux/ducks/docs';
import createDocFiles from '../create-doc-files';

test.before('creating a "doc" object on store', t => {
  createDocForTests();
});

test('must create a doc', t => {
  const state = store.getState();
  const docs = Object.values(state.docs.byId);

  // TODO: test the actual doc creation, not markdown writing (this test was being used for development)
  createDocFiles(docs);
  // assert file creation
  t.pass();
});
