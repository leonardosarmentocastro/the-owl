const test = require('ava');

test.before('before 1', t => {
  console.log('> before 1');
});

test('returns the given user if it exists', t => {
  console.log('### test');
  t.pass();
});

test('returns an error if the given user doesnt exist', t => {
  t.pass();
});

test.after.always('after always 2', t => {
  console.log('> after always 2');
});
