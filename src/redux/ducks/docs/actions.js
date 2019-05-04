const docsTypes = require('./types');
const { filterHeaders, getUrl } = require('./helpers');

exports.collectRequestInformation = (id, req) => ({
  type: docsTypes.COLLECT_REQUEST_INFORMATION,
  payload: {
    id,
    request: {
      body: req.body,
      headers: filterHeaders(req.headers),
      originalPath: req.originalPath, // Value is set by us.
      method: req.method,
      path: req.path,
      queryParameters: req.query,
      url: getUrl(req),
    },
  },
});

exports.collectResponseInformation = (id, response) => ({
  type: docsTypes.COLLECT_RESPONSE_INFORMATION,
  payload: {
    id,
    response: {
      body: response.body,
      headers: filterHeaders(response.headers),
      statusCode: response.statusCode,
    },
  }
});

exports.createDoc = (id, testName) => ({
  type: docsTypes.CREATE_DOC,
  payload: {
    id,
    testName, // Value is collected from our custom headers.
  },
});
