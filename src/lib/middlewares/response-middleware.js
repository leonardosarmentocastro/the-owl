const { collectResponseInformation, store } = require('../../redux');
const { TEST_NAME_HEADER } = require('./headers');
const { mustCollectInformation } = require('./must-collect-information');

const collectInformation = (body, req, res) => {
  if (!mustCollectInformation(req)) return;

  const testName = res.getHeader(TEST_NAME_HEADER);
  const normalizedRes = {
    body,
    headers: res.getHeaders(),
    statusCode: res.statusCode,
  };
  store.dispatch(collectResponseInformation(testName, normalizedRes));
};

const responseMiddleware = function (req, res, next) {
  // Resource: https://github.com/richardschneider/express-mung/blob/master/index.js
  const unpatchedJson = res.json;
  const patchedJson = function(json) {
    collectInformation(json, req, res);
    return unpatchedJson.call(this, json);
  };
  res.json = patchedJson;

  // Resource: https://github.com/alykoshin/express-end/blob/master/index.js
  // NOTE: Calling "res.json" always triggers "res.end".
  // The collect response reducer has the intelligence to avoid information overriding.
  const unpatchedEnd = res.end;
  const patchedEnd = function() {
    collectInformation(null, req, res);
    return unpatchedEnd.apply(this, arguments);
  };
  res.end = patchedEnd;

  // TODO: patch "send".

  next();
};

module.exports = { collectInformation, responseMiddleware };
