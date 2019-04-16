const test = require('ava');

test.before('before 2', t => {
  console.log('> before 2');
});

test('pass', t => {
  console.log('### test');
  t.pass();
});

test.after.always('after always 2', t => {
  console.log('> after always 2');
});
