const mung = require('express-mung');

const { collectResponseInformation, store } = require('../../redux');
const { TEST_NAME_HEADER } = require('./headers');
const { mustCollectInformation } = require('./must-collect-information');

const options = { mungError: true };
const fn = (body, req, res) => {
  if (!mustCollectInformation(req)) return body;
  const testName = res.getHeader(TEST_NAME_HEADER);
  const normalizedRes = {
    body,
    headers: res.getHeaders(),
    statusCode: res.statusCode,
  };
  store.dispatch(collectResponseInformation(testName, normalizedRes));

  return body;
};
const responseMiddleware = mung.json(fn, options);

module.exports = { fn, responseMiddleware };
