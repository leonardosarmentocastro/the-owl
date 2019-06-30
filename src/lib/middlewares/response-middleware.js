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

// Resource: https://github.com/alykoshin/express-end/blob/master/index.js
const monkeypatchMethodApply = (unpatchedMethod, { req, res }) => function () {
  collectInformation(null, req, res);
  return unpatchedMethod.apply(this, arguments);
};

// Resource: https://github.com/richardschneider/express-mung/blob/master/index.js
const monkeypatchMethodCall = (unpatchedMethod, { req, res }) => function (body) {
  collectInformation(body, req, res);
  return unpatchedMethod.call(this, body);
};

const responseMiddleware = function (req, res, next) {
  // NOTE: Calling "res.json" always triggers "res.end".
  // The collect response reducer has the intelligence to avoid information overriding.
  const unpatchedEnd = res.end;
  res.end = monkeypatchMethodApply(unpatchedEnd, { req, res });

  const unpatchedJson = res.json;
  res.json = monkeypatchMethodCall(unpatchedJson, { req, res });

  // Note: treating "body" type-blindly may raise errors when receiving "Buffers".
  const unpatchedSend = res.send;
  res.send = monkeypatchMethodCall(unpatchedSend, { req, res });

  next();
};

module.exports = {
  collectInformation,
  monkeypatchMethodApply,
  monkeypatchMethodCall,
  responseMiddleware,
};
