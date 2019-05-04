const { _req } = require('./_req.fixture');
const { _res } = require('./_res.fixture');

// Fixture with all the data necessary to create a "doc" on store.
// The "req" and "res" objects are copies of the necessary properties/method from Express.js.
exports._doc = {
  id: 'b72fd729-69c5-4979-900c-dd9dbe2ceb3c',
  testName: '(200) returns the given user if it exists',
  req: { ..._req },
  res: { ..._res },
};
