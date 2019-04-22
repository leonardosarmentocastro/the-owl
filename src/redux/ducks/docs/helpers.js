import { TEST_ID_HEADER, TEST_NAME_HEADER, REQ_ORIGINAL_PATH_HEADER } from '../../../lib/middlewares';

// NOTE: There is a - strange insane bug - that "TEST_ID_HEADER" is resolved to "undefined" when specified on "IGNORED_HEADERS".
export const IGNORED_HEADERS = [
  'access-control-allow-origin',
  'cache-control',
  'postman-token',
  'user-agent',
  'accept',
  'host',
  'accept-encoding',
  'content-length',
  'connection',
  'x-powered-by',
];

export const filterHeaders = (headers) => {
  if (!headers) return {};

  const THE_OWL_HEADERS = [ TEST_ID_HEADER, TEST_NAME_HEADER, REQ_ORIGINAL_PATH_HEADER ];
  return Object.keys(headers) // Tranform "headers" object into an array contaning its keys.
    .filter(key => !IGNORED_HEADERS.includes(key)) // Remove all keys that must be ignored.
    .filter(key => !THE_OWL_HEADERS.includes(key))
    .reduce((accumulator, key) => ({ // Transform the "headers" array into an object again.
      ...accumulator,
      [key]: headers[key],
    }), {});
}
