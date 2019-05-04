// Fixture for Express.js "req" object.
exports._req = {
  _originalPath: '/users/:id', // Custom attribute from "theOwl" headers.
  get: (key) => (key === 'host' ? 'localhost' : ''),
  header(key) { return this.headers[key]; },
  headers: {},
  method: 'get',
  originalUrl: '/users/1',
  path: '/users/1',
  protocol: 'http',
  query: {},
  setHeader(key, value) {
    this.headers[key] = value;
  }
};
