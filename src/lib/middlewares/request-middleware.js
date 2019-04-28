import chalk from 'chalk';
import uuidv4 from 'uuid/v4';

import { TEST_ID_HEADER, TEST_NAME_HEADER, REQ_ORIGINAL_PATH_HEADER } from './headers';
import { mustCollectInformation } from './must-collect-information';
import { store } from '../../redux';
import { collectRequestInformation, createDoc } from '../../redux/ducks/docs';

const WARN_TO_PROVIDE_HEADERS = [
  [
    `\r\n${chalk.black.bgHex('#F5B400')(' WARNING ')}`,
    `${chalk.gray('Docs will not be generated for requests missing the following headers:')}`,
  ].join(' '),
  [
    `${chalk.black.bgWhite(` ${TEST_NAME_HEADER} `)} ${chalk.gray('The test case name for an endpoint (will be printed on generated doc).')}`,
    `${chalk.black.bgWhite(` ${REQ_ORIGINAL_PATH_HEADER} `)} ${chalk.gray('The original path for an endpoint. E.g. "/users/:id" instead of "/users/1" (will be the title of the generated doc).')}`,
    `${chalk.gray('Tip: Use "theOwl.buildHeaders()" method for such.')}`
  ].join('\r\n')
].join('\r\n');

export const requestMiddleware = (req, res, next) => {
  if (!mustCollectInformation(req)) {
    if (process.env.LOG_MESSAGES) console.info(WARN_TO_PROVIDE_HEADERS);
    return next();
  }

  const id = uuidv4();
  const testName = req.header(TEST_NAME_HEADER);
  req.originalPath = req.header(REQ_ORIGINAL_PATH_HEADER);
  store.dispatch(createDoc(id, testName));
  store.dispatch(collectRequestInformation(id, req));

  // Store id on header so we can properly collect response information for this doc.
  res.setHeader(TEST_ID_HEADER, id);

  return next();
};
