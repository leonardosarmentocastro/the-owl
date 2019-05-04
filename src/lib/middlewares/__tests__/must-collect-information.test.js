const test = require('ava');

const { TEST_NAME_HEADER, REQ_ORIGINAL_PATH_HEADER } = require('../headers');
const { mustCollectInformation } = require('../must-collect-information');

const testName = '(200) must return user';
const reqOriginalPath = '/users/:id';

test('must collect information when both "test name" and "request original path" headers are present', t => {
  t.truthy(mustCollectInformation({
    header: (key) => {
      switch (key) {
        case TEST_NAME_HEADER: return testName;
        case REQ_ORIGINAL_PATH_HEADER: return reqOriginalPath;
        default: null;
      }
    },
  }));
});

test('must not collect information in the absence of "test name" and/or "request original path" headers', t => {
  t.falsy(mustCollectInformation({
    header: (key) => null,
  }));

  t.falsy(mustCollectInformation({
    header: (key) => {
      switch (key) {
        case TEST_NAME_HEADER: return null;
        case REQ_ORIGINAL_PATH_HEADER: return reqOriginalPath;
        default: null;
      }
    },
  }));

  t.falsy(mustCollectInformation({
    header: (key) => {
      switch (key) {
        case TEST_NAME_HEADER: return testName;
        case REQ_ORIGINAL_PATH_HEADER: return null;
        default: null;
      }
    },
  }));
});
