const chalk = require('chalk');

const { createFile, createDirectory, formatRequestPath } = require('./utils');
const { writeMarkdown } = require('./write-markdown');

const _getSuccessMessage = (fileName) =>
  `${chalk.white.bgHex('#046824')('\r\n SUCCESS ')} Doc created on "${chalk.gray(fileName)}" path.`;

const buildFileName = (folderPath, request) =>
  `${folderPath}/[${request.method.toLowerCase()}]${formatRequestPath(request.originalPath)}.md`

const createDocFiles = (docs) => {
  let err = null;

  const folderPath = `${process.cwd()}/docs`;
  err = createDirectory(folderPath);
  if (err) return err;

  const [ doc ] = docs;
  const fileName = buildFileName(folderPath, doc.request);
  const content = writeMarkdown(docs);
  err = createFile(fileName, content);
  if (err) return err;

  if (process.env.LOG_MESSAGES) console.info(_getSuccessMessage(fileName));

  return null;
};

module.exports = { buildFileName, createDocFiles };
