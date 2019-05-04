const test = require('ava');
const revisionHash = require('rev-hash');

const docsTypes = require('../types');
const { collectRequestInformation, collectResponseInformation } = require('../actions');
const { filterHeaders, getUrl } = require('../helpers');
const { _doc, _req, _res } = require('../__fixtures__');

test('(collectRequestInformation) must create an action', t => {
  const { testName } = _doc;
  const { _originalPath } = _req;
  const req = { ..._req };
  const action = collectRequestInformation(testName, req, { _originalPath });

  t.deepEqual(action, {
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
});

test('(collectResponseInformation) must create an action', t => {
  const { testName } = _doc;
  const normalizedRes = { ..._res };
  const action = collectResponseInformation(testName, normalizedRes);

  t.deepEqual(action, {
    type: docsTypes.COLLECT_RESPONSE_INFORMATION,
    payload: {
      id: revisionHash(testName),
      response: {
        body: normalizedRes.body,
        headers: filterHeaders(normalizedRes.headers),
        statusCode: normalizedRes.statusCode,
      },
    },
  });
});
