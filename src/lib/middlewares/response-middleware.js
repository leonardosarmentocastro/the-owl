import mung from 'express-mung';

import { TEST_ID_HEADER } from './headers';
import { mustCollectInformation } from './must-collect-information';
import { store } from '../../redux';
import { collectResponseInformation } from '../../redux/ducks/docs';

const options = { mungError: true };
export const fn = (body, req, res) => {
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

export const responseMiddleware = mung.json(fn, options);
