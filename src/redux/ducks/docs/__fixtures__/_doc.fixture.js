const { _req } = require('./_req.fixture');
const { _res } = require('./_res.fixture');

// Fixture with all the data necessary to create a "doc" on store.
// The "req" and "res" objects are copies of the necessary properties/method from Express.js.
exports._doc = {
  testName: '(200) returns the given user if it exists',
  req: { ..._req },
  res: { ..._res },
};
