const test = require('ava');

const { filterHeaders, getUrl, IGNORED_HEADERS } = require('../helpers');
const { TEST_NAME_HEADER, REQ_ORIGINAL_PATH_HEADER } = require('../../../../lib/middlewares/headers');

test('(filterHeaders) must not include any entry from "ignored headers" list', t => {
  // Build "headers" object like express's request.
  // E.g.: `{ 'content-type': 'application/json' }`
  const headers = IGNORED_HEADERS.reduce((accumulator, ignoredHeader, index) => ({
    ...accumulator,
    [ignoredHeader]: 'ignoredHeader',
    [`headers-${index}`]: 'After filtering headers, these must be the only ones left.'
  }), {});

  const filteredHeaders = filterHeaders(headers);
  Object.keys(filteredHeaders)
    .forEach(header => {
      t.assert(!IGNORED_HEADERS.includes(header));
    });
});

test('(filterHeaders) must not include any entry from "the owl headers"', t => {
  const MUST_NOT_BE_FILTERED = 'must-not-be-filtered';
  const headers = {
    [TEST_NAME_HEADER]: '(200) must return the user',
    [REQ_ORIGINAL_PATH_HEADER]: '/users/:id',
    [MUST_NOT_BE_FILTERED]: 'this header must not be filtered!',
  };

  const THE_OWL_HEADERS = [ TEST_NAME_HEADER, REQ_ORIGINAL_PATH_HEADER ];
  const filteredHeaders = filterHeaders(headers);
  Object.keys(filteredHeaders)
    .forEach(header => {
      t.assert(!THE_OWL_HEADERS.includes(header));
    });

  const headerWasNotFiltered = !!filteredHeaders[MUST_NOT_BE_FILTERED];
  t.truthy(headerWasNotFiltered);
});

test('(filterHeaders) must return an empty object when filtering null/undefined/empty object', t => {
  t.deepEqual(filterHeaders(null), {});
  t.deepEqual(filterHeaders(undefined), {});
  t.deepEqual(filterHeaders({}), {});
});

test('(getUrl) must return the full request url', t => {
  const req = {
    protocol: 'http',
    get: (key) => (key === 'host' ? 'localhost' : ''),
    originalUrl: '/users/1',
  };

  t.snapshot(getUrl(req));
});
