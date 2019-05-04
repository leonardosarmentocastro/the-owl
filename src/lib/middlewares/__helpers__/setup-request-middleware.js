const { TEST_NAME_HEADER, REQ_ORIGINAL_PATH_HEADER } = require('../headers');
const { _req, _res } = require('../../../redux');

exports.setupRequestMiddleware = t => {
  t.context.req = { ..._req };
  t.context.res = { ..._res };

  // Request must have those headers in order to pass the "mustCollectInformation" verification.
  t.context.req.setHeader(TEST_NAME_HEADER, t.title);
  t.context.req.setHeader(REQ_ORIGINAL_PATH_HEADER, t.context.req._originalPath);
};
