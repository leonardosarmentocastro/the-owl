import chalk from 'chalk';
import fs from 'fs';

export const createFile = (fileName, content) => {
  fs.writeFileSync(fileName, content, (err) => {
    if (err) return formatErrorMessage(err, `Failed to create file at "${fileName}"`); // TODO: make sure this works
    return null; // File was created.
  });
};

export const createDirectory = (folderPath) => {
  fs.mkdirSync(folderPath, (err) => {
    if (err) {
      // Idempotent: Folder already exists, no need to create it.
      const doesDirectoryAlreadyExists = !!(err.code === 'EEXIST');
      if (doesDirectoryAlreadyExists) return null;

      return formatErrorMessage(err, `Failed to create directory "${folderPath}"`); // TODO: make sure this works
    }

    return null;
  });
};

// TODO: test
const formatErrorMessage = (err, message) => [
  `${chalk.white.bgHex('#ba1912')('\r\n ERROR ')}`,
  `${chalk.gray(message)}`,
  `${chalk.black.bgWhite('  STACKTRACE  ')}`,
  `${chalk.gray(JSON.stringify(err, null, 2))}`,
].join('\r\n');

// export const createFileAsync = async (fileName, content) => {
//   return new Promise((resolve) => {
//     fs.writeFile(fileName, content, (err) => {
//       if (err) return resolve(err);
//       return resolve(null); // File was created.
//     });
//   });
// };

// export const createDirectoryAsync = (folderPath) => {
//   return new Promise((resolve) => {
//     fs.mkdir(folderPath, (err) => {
//       if (err) {
//         // Idempotent: Folder already exists, no need to create it.
//         const doesDirectoryAlreadyExists = !!(err.code === 'EEXIST');
//         if (doesDirectoryAlreadyExists) return resolve(null);

//         return resolve(err);
//       }

//       return resolve(null);
//     });
//   });
// };

// TODO: tests
export const formatRequestPath = (path) =>
  path // "/users/sign-up"
    .replace(/\//, '') // "users/sign-up"
    .replace(/\//g, '_'); // "users_sign-up"
