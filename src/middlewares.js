import uuidv4 from 'uuid/v4';
import mung from 'express-mung';

import { store } from './redux';
import {
  collectRequestInformation,
  collectResponseInformation,
  createDoc,
} from './redux/ducks/docs';

const TRACK_INFORMATION_HEADER = 'x-the-owl';
export const requestMiddleware = (req, res, next) => {
  const testName = req.header(TRACK_INFORMATION_HEADER);
  const mustCollectInformation = !!testName;
  if (!mustCollectInformation) return next();

  const id = uuidv4();
  store.dispatch(createDoc(id, testName));
  store.dispatch(collectRequestInformation(id, req));
  // todo: maybe set the id as a header here, so we can use it on the "responseMiddleware".

  return next();
};

export const responseMiddleware = mung.json((body, req, res) => {
  // todo: maybe have a problem with concurrence tests, since we are using latest created id to append response to.

  const response = {
    body,
    headers: res.getHeaders(),
    statusCode: res.statusCode,
  };
  store.dispatch(collectResponseInformation(response));

  return body;
});
