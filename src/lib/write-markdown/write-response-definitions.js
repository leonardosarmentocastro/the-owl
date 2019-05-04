const { writeBody } = require('./write-body');
const { writeKeyValueTable } = require('./write-key-value-table');

const _writeHeaders = (headers) =>
  writeKeyValueTable(headers);

const emoji = ':hatching_chick:';
exports.writeResponseDefinitions = (doc) =>
  [
    `**Response** ${emoji}\r\n`,
    `Status: ${doc.response.statusCode}\r\n`,
    `Headers: ${_writeHeaders(doc.response.headers)}\r\n`,
    `Body: ${writeBody(doc.response.body)}`,
  ].join('\r\n');
