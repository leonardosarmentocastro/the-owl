const { writeBody } = require('./write-body');
const { writeKeyValueTable } = require('./write-key-value-table');

const _writeHeaders = (headers) =>
  writeKeyValueTable(headers);

const _writeQueryParameters = (queryParameters) =>
  writeKeyValueTable(queryParameters);

const emoji = ':egg:';
exports.writeRequestDefinitions = (doc) =>
  [
    `**Request** ${emoji}\r\n`,
    `Path: \`${doc.request.path}\`\r\n`,
    `Query parameters: ${_writeQueryParameters(doc.request.queryParameters)}\r\n`,
    `Headers: ${_writeHeaders(doc.request.headers)}\r\n`,
    `Body: ${writeBody(doc.request.body)}`,
  ].join('\r\n');
