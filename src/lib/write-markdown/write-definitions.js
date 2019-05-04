const { writeCurl } = require('./write-curl');
const { writeRequestDefinitions } = require('./write-request-definitions');
const { writeResponseDefinitions } = require('./write-response-definitions');

const emoji = ':chicken:';
const _writeHeading = (doc) => `### ${emoji} \`${doc.testName}\` <a name="${doc.id}"></a>\r\n`;
exports.writeDefinitions = (docs) =>
  docs.map(doc => [
    _writeHeading(doc),
    `${writeCurl(doc)}\r\n`,
    `${writeRequestDefinitions(doc)}\r\n`,
    `${writeResponseDefinitions(doc)}\r\n`
  ].join('\r\n'));
