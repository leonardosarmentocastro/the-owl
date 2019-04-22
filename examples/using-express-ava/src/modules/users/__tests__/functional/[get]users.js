const axios = require('axios');
const test = require('ava');
const theOwl = require('the-owl');

const { users } = require('../../_fixtures');
const { server } = require('../../../../server');

const ORIGINAL_PATH = `/users/:id`;
const URL = `http://localhost:${process.env.PORT}${ORIGINAL_PATH}`;
const getEndpoint = (userId) => URL.replace(':id', userId);
test.before('start server', async t => {
  t.context.api = await server.start();
});

test('(200) returns the given user if it exists', async t => {
  const [ user ] = users;
  const response = await axios.get(getEndpoint(user.id), {
    headers: {
      'your-header': 'your-value',
      ...theOwl.buildHeaders(t.title, ORIGINAL_PATH),
    },
  });

  t.deepEqual(response.data, user);
});

test('(500) returns an error if the given user doesnt exist', async t => {
  const userId = 999;
  await axios.get(getEndpoint(userId), {
    headers: { ...theOwl.buildHeaders(t.title, ORIGINAL_PATH) },
  }).catch(err => {
    const error = { code: 'USER_NOT_FOUND', message: `User "${userId}" not found!` };
    t.deepEqual(err.response.data, error);
  });
});

test.after('create api docs', t => {
  theOwl.createDocs();
});

test.after.always('close server', async t => {
  await server.close(t.context.api);
});
