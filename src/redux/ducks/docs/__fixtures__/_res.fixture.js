// Fixture for Express "res" object.
export const _res = {
  body: {
    id: 1,
    name: 'Leonardo',
  },
  getHeader(key) { return this.headers[key]; },
  getHeaders() { return this.headers; },
  headers: {
    'x-response-header': 'not important value',
  },
  setHeader(key, value) { this.headers[key] = value; },
  statusCode: 200,
};
