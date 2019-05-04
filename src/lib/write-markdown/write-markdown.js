const { writeHeading } = require('./write-heading');
const { writeSummary } = require('./write-summary');
const { writeDefinitions } = require('./write-definitions');

exports.writeMarkdown = (docs) =>
  [
    `${writeHeading(docs)}\r\n`,
    `${writeSummary(docs).join('\r\n')}\r\n`,
    '---\r\n',
    writeDefinitions(docs).join('\r\n')
  ].join('\r\n');
