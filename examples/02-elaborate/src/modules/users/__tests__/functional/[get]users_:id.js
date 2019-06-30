const got = require('got');
const test = require('ava');
const theOwl = require('the-owl');

const { users } = require('../../__fixtures__');
const { closeApiOpenedOnRandomPort, startApiOnRandomPort } = require('../../../__helpers__');
const { $ERROR_USER_NOT_FOUND } = require('../../errors');

const getEndpoint = (t, userId) => t.context.endpointBaseUrl.replace(':id', userId);
test.before('start server', async t => {
  t.context.endpointOriginalPath = `/users/:id`;
  await startApiOnRandomPort(t);
});
test.after('create api docs', t => theOwl.createDocs());
test.after.always('close server', t => closeApiOpenedOnRandomPort(t));

test('(200) returns the given user if it exists', async t => {
  const [ user ] = users;
  const response = await got(getEndpoint(t, user.id), {
    headers: {
      'your-custom-header': 'Notice how he appears on the generated doc but "theOwl" headers doesn\'t!',

      // Option 1: use the utility function to build the headers.
      ...theOwl.buildHeaders(t.title, t.context.endpointOriginalPath),
    },
    json: true,
    retry: { retries: 0 },
  });

  t.deepEqual(response.body, user);
});

test('(500) returns an error if the given user doesnt exist', async t => {
  const userId = 999;
  await got(getEndpoint(t, userId), {
    headers: {
      // Option 2: you set the headers manually.
      'x-test-name': t.title,
      'x-req-original-path': t.context.endpointOriginalPath,
    },
    json: true,
    retry: { retries: 0 },
  }).catch(err => {
    const error = $ERROR_USER_NOT_FOUND(userId);
    t.deepEqual(err.response.body, error);
  });
});
