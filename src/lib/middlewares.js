import chalk from 'chalk';
import mung from 'express-mung';
import uuidv4 from 'uuid/v4';

import { store } from '../redux';
import {
  collectRequestInformation,
  collectResponseInformation,
  createDoc,
} from '../redux/ducks/docs';

export const TEST_ID_HEADER = 'x-test-id';
export const TEST_NAME_HEADER = 'x-test-name';
export const REQ_ORIGINAL_PATH_HEADER = 'x-req-original-path';
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

const mustCollectInformation = (req) => (!!req.header(TEST_NAME_HEADER) && !!req.header(REQ_ORIGINAL_PATH_HEADER));
export const requestMiddleware = (req, res, next) => {
  if (!mustCollectInformation(req)) {
    if (process.env.THE_OWL_LOG_MESSAGES) console.log(WARN_TO_PROVIDE_HEADERS);
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
