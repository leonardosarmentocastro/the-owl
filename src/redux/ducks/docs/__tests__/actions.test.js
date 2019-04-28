import test from 'ava';
import uuidv4 from 'uuid/v4';

import * as docsTypes from '../types';
import { filterHeaders, getUrl } from '../helpers';
import { _doc, _req, _res } from '../__fixtures__';
import {
  collectRequestInformation,
  collectResponseInformation,
  createDoc
} from '../actions';

test('(collectRequestInformation) must create an action', t => {
  const id = uuidv4();
  const req = { ..._req };
  const action = collectRequestInformation(id, req);

  t.deepEqual(action, {
    type: docsTypes.COLLECT_REQUEST_INFORMATION,
    payload: {
      id,
      request: {
        body: req.body,
        headers: filterHeaders(req.headers),
        originalPath: req.originalPath,
        method: req.method,
        path: req.path,
        queryParameters: req.query,
        url: getUrl(req),
      },
    },
  });
});

test('(collectResponseInformation) must create an action', t => {
  const id = uuidv4();
  const response = { ..._res };
  const action = collectResponseInformation(id, response);

  t.deepEqual(action, {
    type: docsTypes.COLLECT_RESPONSE_INFORMATION,
    payload: {
      id,
      response: {
        body: response.body,
        headers: filterHeaders(response.headers),
        statusCode: response.statusCode,
      },
    },
  });
});

test('(createDoc) must create an action', t => {
  const id = uuidv4();
  const { testName } = _doc;
  const action = createDoc(id, testName);

  t.deepEqual(action, {
    type: docsTypes.CREATE_DOC,
    payload: {
      id,
      testName,
    },
  });
});
