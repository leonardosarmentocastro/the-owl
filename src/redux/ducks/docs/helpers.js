import { THE_OWL_HEADERS } from '../../../lib/';

export const IGNORED_HEADERS = [
  ...THE_OWL_HEADERS,
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

export const filterHeaders = (headers) =>
  headers ? (
    Object.keys(headers) // Tranform "headers" object into an array contaning its keys.
      .filter(key => !IGNORED_HEADERS.includes(key)) // Remove all keys that must be ignored.
      .reduce((accumulator, key) => ({ // Transform the "headers" array into an object again.
        ...accumulator,
        [key]: headers[key],
      }), {})
  ) : ({});
