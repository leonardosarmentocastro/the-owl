import { TEST_NAME_HEADER, REQ_ORIGINAL_PATH_HEADER } from '../headers';
import { _req, _res } from '../../../redux/ducks/docs/__fixtures__';

export const setupRequestMiddleware = t => {
  t.context.req = { ..._req };
  t.context.res = { ..._res };

  // Request must have those headers in order to pass the "mustCollectInformation" verification.
  t.context.req.setHeader(TEST_NAME_HEADER, t.title);
  t.context.req.setHeader(REQ_ORIGINAL_PATH_HEADER, t.context.req.originalPath);
};
