import test from 'ava';

import { filterHeaders, ignoredHeaders } from '../utils';

test('(filterHeaders) must not include any entry from "ignored headers" list', t => {
  // Build "headers" object like express's request.
  // E.g.: `{ 'content-type': 'application/json' }`
  const headers = ignoredHeaders.reduce((accumulator, ignoredHeader, index) => ({
    ...accumulator,
    [ignoredHeader]: 'ignoredHeader',
    [`headers-${index}`]: 'After filtering headers, these must be the only ones left.'
  }), {});

  const filteredHeaders = filterHeaders(headers);
  Object.keys(filteredHeaders)
    .forEach(header => {
      t.assert(!ignoredHeaders.includes(header));
    });
});

test('(filterHeaders) must return an empty object when filtering null/undefined/empty object', t => {
  t.deepEqual(filterHeaders(null), {});
  t.deepEqual(filterHeaders(undefined), {});
  t.deepEqual(filterHeaders({}), {});
});
