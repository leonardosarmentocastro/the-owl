import { TEST_NAME_HEADER, REQ_ORIGINAL_PATH_HEADER } from './headers';

export const mustCollectInformation = (req) =>
  (!!req.header(TEST_NAME_HEADER) && !!req.header(REQ_ORIGINAL_PATH_HEADER));
