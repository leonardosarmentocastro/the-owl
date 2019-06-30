const got = require('got');
const test = require('ava');
const theOwl = require('the-owl');

const { closeApiOpenedOnRandomPort, startApiOnRandomPort } = require('../__helpers__');

test.before('start server', async t => {
  t.context.endpointOriginalPath = '/users';
  await startApiOnRandomPort(t);
});
//// STEP 3: Call "createDocs" method after all test cases have runned.
//// Run the script "CREATE_DOCS=true npm test" on terminal;
test.after('create api docs', t => theOwl.createDocs());
test.after.always('close server', t => closeApiOpenedOnRandomPort(t));

test('(200) returns the registered users', async t => {
  const response = await got(t.context.endpointBaseUrl , {
    headers: {
      'your-custom-header': 'Notice how it appears on generated doc but "theOwl" headers doesn\'t!',

      //// STEP 2: Send "theOwl" headers on requests which information must be collected to generate api docs.
      //// NOTE: Information will not be collected if "theOwl" headers are not correctly sent.
      // Option 1: use the utility function to build the headers.
      ...theOwl.buildHeaders(t.title, t.context.endpointOriginalPath),

      // Option 2: you set the headers manually.
      // 'x-test-name': t.title,
      // 'x-req-original-path': t.context.endpointOriginalPath,
    },
    json: true,
    retry: { retries: 0 },
  });

  t.assert(response.statusCode === 200);
  t.deepEqual(response.body, [{ id: 1, name: 'John' }, { id: 2, name: 'Paul' }]);
});
