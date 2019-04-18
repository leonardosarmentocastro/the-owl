const test = require('ava');
const theOwl = require('the-owl').default; // TODO: export the package properly

test('(200) returns the given user if it exists', t => {
  t.pass();
});

test('(500) returns an error if the given user doesnt exist', t => {
  t.pass();
});

test.after('log', t => {
  // TODO: perform api integration
  theOwl.createDocs();
});
