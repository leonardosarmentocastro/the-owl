import { isEmpty } from 'lodash/lang';

// NOTE: Document shape can be found on the snapshot test of this file.
export const writeBody = (body) => {
  const hasBody = !!body;
  const isObject = (hasBody && typeof body === 'object');
  const codeBlock = (content) => [
    '\r\n',
    '\`\`\`',
    content,
    '\`\`\`',
  ].join('\r\n');

  if (isObject) return codeBlock(JSON.stringify(body, null, 2));
  if (hasBody) return codeBlock(body);
  return '_empty_';
};

export const writeCurl = (doc) => {
  const { body, headers, method, url } = doc.request;

  const bodyOptions = !isEmpty(body) ? (
    `-d '${JSON.stringify(body, null, 2)}'`
  ) : ('');
  const headerOptions = !isEmpty(headers) ? (
    Object.entries(headers)
      .map((header, index, array) => {
        const [ key, value ] = header;

        const isLastHeader = (index === array.length - 1);
        const hasMoreCommandsToWrite = !!bodyOptions;

        const hasToEscape = (isLastHeader ? hasMoreCommandsToWrite : true);
        const command = `-H '${key}: ${value}' ${hasToEscape ? '\\' : '' }`;

        return command;
      })
      .join('\r\n')
  ) : ('');

  return [
    '```sh',
    `curl -X ${method.toUpperCase()} \\`,
    `${url} ${headerOptions ? '\\' : ''}`.trim(),
    headerOptions.trim(),
    bodyOptions,
    '```',
  ]
  .filter(Boolean) // Remove null, undefined, empty strings...
  .join('\r\n');
};

export const writeDefinitions = (docs) =>
  docs.map(doc => [
    `### :chicken: \`${doc.testName}\` <a name="${doc.id}"></a>\r\n`,
    `${writeCurl(doc)}\r\n`,
    `${writeRequestDefinitions(doc)}\r\n`,
    `${writeResponseDefinitions(doc)}\r\n`
  ].join('\r\n'));

export const writeHeaders = (headers) =>
  writeKeyValueTable(headers);

export const writeHeading = (docs) => {
  const [ doc ] = docs;
  const { method, originalPath } = doc.request;
  return `# [${method.toLowerCase()}] ${originalPath}`;
}

export const writeKeyValueTable = (object) =>
  isEmpty(object) ? (
    '_empty_'
  ) : (
    [
      '\r\n',
      '| Key | Value |',
      '| :--- | :--- |',
      Object.entries(object) // Write a table row for each entry.
        .map(object => {
          const [ key, value ] = object;
          return `| ${key} | ${value} |`;
        })
        .join('\r\n')
    ].join('\r\n')
  );

export const writeMarkdown = (docs) =>
  [
    `${writeHeading(docs)}\r\n`,
    `${writeSummary(docs).join('\r\n')}\r\n`,
    '---\r\n',
    writeDefinitions(docs).join('\r\n')
  ].join('\r\n');

const writeSummary = (docs) =>
  docs.map(doc => `* [${doc.testName}](#${doc.id})`);

export const writeRequestDefinitions = (doc) =>
  [
    '**Request** :egg:\r\n',
    `Path: \`${doc.request.path}\`\r\n`,
    `Query parameters: ${writeQueryParameters(doc.request.queryParameters)}\r\n`,
    `Headers: ${writeHeaders(doc.request.headers)}\r\n`,
    `Body: ${writeBody(doc.request.body)}`,
  ].join('\r\n');

export const writeResponseDefinitions = (doc) =>
  [
    '**Response** :hatching_chick:\r\n',
    `Status: ${doc.response.statusCode}\r\n`,
    `Headers: ${writeHeaders(doc.response.headers)}\r\n`,
    `Body: ${writeBody(doc.response.body)}`,
  ].join('\r\n');

export const writeQueryParameters = (queryParameters) =>
  writeKeyValueTable(queryParameters);
