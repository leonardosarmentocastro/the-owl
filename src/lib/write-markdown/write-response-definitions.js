import writeBody from './write-body';
import writeKeyValueTable from './write-key-value-table';

const writeHeaders = (headers) =>
  writeKeyValueTable(headers);

const emoji = ':hatching_chick:';
const writeResponseDefinitions = (doc) =>
  [
    `**Response** ${emoji}\r\n`,
    `Status: ${doc.response.statusCode}\r\n`,
    `Headers: ${writeHeaders(doc.response.headers)}\r\n`,
    `Body: ${writeBody(doc.response.body)}`,
  ].join('\r\n');

export default writeResponseDefinitions;
