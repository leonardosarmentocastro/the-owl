import uuidv4 from 'uuid/v4';
import mung from 'express-mung';

import { store } from '../redux';
import {
  collectRequestInformation,
  collectResponseInformation,
  createDoc,
} from '../redux/ducks/docs';

const TEST_NAME_HEADER = 'x-test-name';
const TEST_ID_HEADER = 'x-test-id';

const mustCollectInformation = (req) => !!req.header(TEST_NAME_HEADER);
export const requestMiddleware = (req, res, next) => {
  if (!mustCollectInformation(req)) return next();

  const id = uuidv4();
  const testName = req.header(TEST_NAME_HEADER);
  store.dispatch(createDoc(id, testName));
  store.dispatch(collectRequestInformation(id, req));

  // Store id on header so we can properly collect response information for this doc.
  res.setHeader(TEST_ID_HEADER, id);

  return next();
};

export const responseMiddleware = mung.json((body, req, res) => {
  if (!mustCollectInformation(req)) return body;

  const id = res.getHeader(TEST_ID_HEADER);
  const response = {
    body,
    headers: res.getHeaders(),
    statusCode: res.statusCode,
  };
  store.dispatch(collectResponseInformation(id, response));

  return body;
}, { mungError: true });
