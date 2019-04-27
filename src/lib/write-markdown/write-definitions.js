import writeCurl from './write-curl';
import writeRequestDefinitions from './write-request-definitions';
import writeResponseDefinitions from './write-response-definitions';

const emoji = ':chicken:';
const writeHeading = (doc) => `### ${emoji} \`${doc.testName}\` <a name="${doc.id}"></a>\r\n`;
const writeDefinitions = (docs) =>
  docs.map(doc => [
    writeHeading(doc),
    `${writeCurl(doc)}\r\n`,
    `${writeRequestDefinitions(doc)}\r\n`,
    `${writeResponseDefinitions(doc)}\r\n`
  ].join('\r\n'));

export default writeDefinitions;
