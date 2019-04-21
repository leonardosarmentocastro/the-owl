const axios = require('axios');
const test = require('ava');
const theOwl = require('the-owl');

const { users } = require('../../_fixtures');
const { server } = require('../../../../server');

const PATH = `/users`; // TODO: fix file name generation
const ENDPOINT = `http://localhost:${process.env.PORT}/${PATH}`;
test.before('setup', async t => {
  t.context.api = await server.start();
});

test('(200) returns the given user if it exists', async t => {
  const [ user ] = users;
  const response = await axios.get(`${ENDPOINT}/${user.id}`, {
    headers: { 'x-test-name': t.title },
  });

  t.deepEqual(response.data, user);
});

test('(500) returns an error if the given user doesnt exist', async t => {
  const userId = 999;
  await axios.get(`${ENDPOINT}/${userId}`, {
    headers: { 'x-test-name': t.title },
  }).catch(err => {
    const error = { code: 'USER_NOT_FOUND', message: `User "${userId}" not found!` };
    t.deepEqual(err.response.data, error);
  });
});

test.after.always('log', async t => {
  await server.close(t.context.api);
  theOwl.createDocs();
});
