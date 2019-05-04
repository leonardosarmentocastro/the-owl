const { TEST_NAME_HEADER, REQ_ORIGINAL_PATH_HEADER } = require('./headers');

exports.mustCollectInformation = (req) =>
  (!!req.header(TEST_NAME_HEADER) && !!req.header(REQ_ORIGINAL_PATH_HEADER));
