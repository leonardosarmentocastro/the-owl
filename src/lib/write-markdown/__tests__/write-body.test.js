import test from 'ava';

import writeBody from '../write-body';

test('(snapshot) must render empty when receiving an empty object', t => {
  const body = {};
  t.snapshot(writeBody(body));
});

test('(snapshot) must render formatted json as code block when receiving a filled object', t => {
  const body = { content: 'non empty object' };
  t.snapshot(writeBody(body));
});

test('(snapshot) must render text as code block when receiving non empty body of scalar type', t => {
  t.snapshot(writeBody('string is a scalar type'));
  t.snapshot(writeBody(123));
  t.snapshot(writeBody(true));
});

test('(snapshot) must render empty when receiving an empty non object body', t => {
  t.snapshot(writeBody(undefined));
  t.snapshot(writeBody(''));
});
