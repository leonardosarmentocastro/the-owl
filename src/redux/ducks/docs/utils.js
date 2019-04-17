export const ignoredHeaders = [
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
    Object.keys(headers)
      .filter(key => !ignoredHeaders.includes(key))
      .reduce((accumulator, key) => ({
        ...accumulator,
        [key]: headers[key],
      }), {})
  ) : ({});
