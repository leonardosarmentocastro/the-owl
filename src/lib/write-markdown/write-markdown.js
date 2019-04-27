import writeHeading from './write-heading';
import writeSummary from './write-summary';
import writeDefinitions from './write-definitions';

const writeMarkdown = (docs) =>
  [
    `${writeHeading(docs)}\r\n`,
    `${writeSummary(docs).join('\r\n')}\r\n`,
    '---\r\n',
    writeDefinitions(docs).join('\r\n')
  ].join('\r\n');

export default writeMarkdown;
