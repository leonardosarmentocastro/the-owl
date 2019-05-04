const revisionHash = require('rev-hash');

const docsTypes = require('./types');
const { filterHeaders, getUrl } = require('./helpers');

exports.collectRequestInformation = (testName, req, { _originalPath }) => ({
  type: docsTypes.COLLECT_REQUEST_INFORMATION,
  payload: {
    id: revisionHash(testName),
    testName,
    request: {
      _originalPath,
      body: req.body,
      headers: filterHeaders(req.headers),
      method: req.method,
      path: req.path,
      queryParameters: req.query,
      url: getUrl(req),
    },
  },
});

exports.collectResponseInformation = (testName, normalizedRes) => ({
  type: docsTypes.COLLECT_RESPONSE_INFORMATION,
  payload: {
    id: revisionHash(testName),
    response: {
      body: normalizedRes.body,
      headers: filterHeaders(normalizedRes.headers),
      statusCode: normalizedRes.statusCode,
    },
  }
});
