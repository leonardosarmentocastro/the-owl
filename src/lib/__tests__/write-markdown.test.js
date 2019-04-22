import test from 'ava';

import { store } from '../../redux';
import { createDocForTests } from '../../redux/ducks/docs';
import { writeMarkdown } from '../write-markdown';

test.before('creating a "doc" object on store', t => {
  // Specify our own "doc" object instead of using the DEFAULT provided by
  // the helper function, in order to make snapshot testing deterministic.
  const doc = {
    id: '1b42d891-41d1-4066-b458-61d1d901adcb',
    testName: '(500) returns an error if the given user doesnt exist',
    req: {
      method: 'get',
      path: '/users/999',
      headers: null,
      originalPath: '/users/:id',
      query: {
        sort: 'desc',
        page: 1,
      },
    },
    res: {
      body: { code: 'USER_NOT_FOUND', message: `User "1b42d891-41d1-4066-b458-61d1d901adcb" not found!` },
      headers: {
        'x-response-header': 'not important value',
      },
      statusCode: 500,
    }
  };

  createDocForTests(doc);
});

test('generated markdown must match snapshot', t => {
  const state = store.getState();
  const docs = Object.values(state.docs.byId);
  const markdown = writeMarkdown(docs);

  t.snapshot(markdown);
});
