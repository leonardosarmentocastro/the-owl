const mung = require('express-mung');

const { collectResponseInformation, store } = require('../../redux');
const { TEST_ID_HEADER } = require('./headers');
const { mustCollectInformation } = require('./must-collect-information');

const options = { mungError: true };
const fn = (body, req, res) => {
  if (!mustCollectInformation(req)) return body;
  const id = res.getHeader(TEST_ID_HEADER);
  const response = {
    body,
    headers: res.getHeaders(),
    statusCode: res.statusCode,
  };
  store.dispatch(collectResponseInformation(id, response));

  return body;
};
const responseMiddleware = mung.json(fn, options);

module.exports = { fn, responseMiddleware };
