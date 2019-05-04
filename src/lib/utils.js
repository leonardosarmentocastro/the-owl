const chalk = require('chalk');
const fs = require('fs');

const createFile = (fileName, content) => {
  try {
    fs.writeFileSync(fileName, content, (/* err */) => null);
  } catch(err) {
    return _formatErrorMessage(err, `Failed to create file at "${fileName}"`);
  }
};

const createDirectory = (folderPath) => {
  try {
    fs.mkdirSync(folderPath, (/* err */) => null);
  } catch(err) {
    // Idempotent: Folder already exists, no need to create it.
    const doesDirectoryAlreadyExists = !!(err.code === 'EEXIST');
    if (doesDirectoryAlreadyExists) return null;

    return _formatErrorMessage(err, `Failed to create directory "${folderPath}"`);
  }
};

const formatRequestPath = (path) =>
  path // "/users/sign-up"
    .replace(/\//, '') // "users/sign-up"
    .replace(/\//g, '_'); // "users_sign-up"

const _formatErrorMessage = (err, message) => [
  `${chalk.white.bgHex('#ba1912')('\r\n ERROR ')} ${chalk.gray(message)}`,
  `${chalk.black.bgWhite(' STACKTRACE ')}`,
  `${chalk.gray(JSON.stringify(err, null, 2))}`,
].join('\r\n');

module.exports = {
  createFile,
  createDirectory,
  formatRequestPath,
};
