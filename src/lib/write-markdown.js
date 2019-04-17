import { isEmpty } from 'lodash/lang';

//// Doc shape:
// # [GET] /users/1

// * [(200) returns the given user if it exists](#585b2045-42a1-47eb-b0a9-e4541c6b2d68)

// ---

// ### :chicken: (200) returns the given user if it exists <a name="585b2045-42a1-47eb-b0a9-e4541c6b2d68"></a>

// :egg: **Request**

// Method: GET

// Headers:

// | Key | Value |
// | :--- | :--- |
// | x-request-header | 1 |

// Body: _empty_

// :hatching_chick: **Response**

// Status: 200

// Headers: _empty_

// Body:

// ```
// {
//   "id": 1,
//   "name": "Leonardo"
// }
// ```

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

export const writeHeaders = (headers) =>
  isEmpty(headers) ? (
    '_empty_'
  ) : (
    [
      '\r\n',
      '| Key | Value |',
      '| :--- | :--- |',
      Object.entries(headers) // Write a table row for each header entry.
        .map(header => {
          const [ key, value ] = header;
          return `| ${key} | ${value} |`;
        })
        .join('\r\n')
    ].join('\r\n')
  );

export const writeHeading = (docs) => {
  const [ doc ] = docs;
  const { method, path } = doc.request;
  return `# [${method.toUpperCase()}] ${path}`;
}

export const writeMarkdown = (docs) =>
  [
    `${writeHeading(docs)}\r\n`,
    `${writeSummary(docs).join('\r\n')}\r\n`,
    '---\r\n',
    writeDefinitions(docs).join('\r\n')
  ].join('\r\n');

const writeSummary = (docs) =>
  docs.map(doc => `* [${doc.testName}](#${doc.id})`);

export const writeDefinitions = (docs) =>
  docs.map(doc => [
    `### :chicken: ${doc.testName} <a name="${doc.id}"></a>\r\n`,
    `${writeRequestDefinitions(doc)}\r\n`,
    `${writeResponseDefinitions(doc)}\r\n`
  ].join('\r\n'));

export const writeRequestDefinitions = (doc) =>
  [
    ':egg: **Request**\r\n',
    `Method: ${doc.request.method.toUpperCase()}\r\n`,
    `Headers: ${writeHeaders(doc.request.headers)}\r\n`,
    `Body: ${writeBody(doc.request.body)}`,
  ].join('\r\n');

export const writeResponseDefinitions = (doc) =>
  [
    ':hatching_chick: **Response**\r\n',
    `Status: ${doc.response.statusCode}\r\n`,
    `Headers: ${writeHeaders(doc.response.headers)}\r\n`,
    `Body: ${writeBody(doc.response.body)}`,
  ].join('\r\n');
