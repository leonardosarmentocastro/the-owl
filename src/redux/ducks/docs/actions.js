import * as docsTypes from './types';
import { filterHeaders } from './utils';

// TODO: test
export const collectRequestInformation = (id, req) => ({
  type: docsTypes.COLLECT_REQUEST_INFORMATION,
  payload: {
    id,
    request: {
      body: req.body,
      headers: filterHeaders(req.headers),
      method: req.method,
      path: req.path,
    },
  },
});

// TODO: test
export const collectResponseInformation = (id, response) => ({
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

// TODO: test
export const createDoc = (id, testName) => ({
  type: docsTypes.CREATE_DOC,
  payload: {
    id,
    testName,
  },
});
