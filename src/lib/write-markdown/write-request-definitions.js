import writeBody from './write-body';
import writeKeyValueTable from './write-key-value-table';

const writeHeaders = (headers) =>
  writeKeyValueTable(headers);

const writeQueryParameters = (queryParameters) =>
  writeKeyValueTable(queryParameters);

const emoji = ':egg:';
const writeRequestDefinitions = (doc) =>
  [
    `**Request** ${emoji}\r\n`,
    `Path: \`${doc.request.path}\`\r\n`,
    `Query parameters: ${writeQueryParameters(doc.request.queryParameters)}\r\n`,
    `Headers: ${writeHeaders(doc.request.headers)}\r\n`,
    `Body: ${writeBody(doc.request.body)}`,
  ].join('\r\n');

export default writeRequestDefinitions;
