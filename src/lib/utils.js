const chalk = require('chalk');
const fs = require('fs');

const _formatErrorMessage = (err, message) => [
  `${chalk.white.bgHex('#ba1912')('\r\n ERROR ')} ${chalk.gray(message)}`,
  `${chalk.black.bgWhite(' STACKTRACE ')}`,
  `${chalk.gray(JSON.stringify(err, null, 2))}`,
].join('\r\n');

exports.createFile = (fileName, content) => {
  try {
    fs.writeFileSync(fileName, content, (/* err */) => null);
  } catch(err) {
    return _formatErrorMessage(err, `Failed to create file at "${fileName}"`);
  }
};

exports.createDirectory = (folderPath) => {
  try {
    fs.mkdirSync(folderPath, (/* err */) => null);
  } catch(err) {
    // Idempotent: Folder already exists, no need to create it.
    const doesDirectoryAlreadyExists = !!(err.code === 'EEXIST');
    if (doesDirectoryAlreadyExists) return null;

    return _formatErrorMessage(err, `Failed to create directory "${folderPath}"`);
  }
};

exports.formatRequestPath = (path) =>
  path // "/users/sign-up"
    .replace(/\//, '') // "users/sign-up"
    .replace(/\//g, '_'); // "users_sign-up"

// https://github.com/you-dont-need/You-Dont-Need-Lodash-Underscore#_isempty
exports.isEmpty = obj =>
  [Object, Array].includes((obj || {}).constructor) && !Object.entries((obj || {})).length;
