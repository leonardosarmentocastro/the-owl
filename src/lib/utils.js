import fs from 'fs';

export const createFile = async (fileName, content) => {
  return new Promise((resolve) => {
    fs.writeFile(fileName, content, (err) => {
      if (err) return resolve(err);
      return resolve(null); // File was created.
    });
  });
};

export const createDirectory = (folderPath) => {
  return new Promise((resolve) => {
    fs.mkdir(folderPath, (err) => {
      if (err) {
        // Idempotent: Folder already exists, no need to create it.
        const doesDirectoryAlreadyExists = !!(err.code === 'EEXIST');
        if (doesDirectoryAlreadyExists) return resolve(null);

        return resolve(err);
      }

      return resolve(null);
    });
  });
};

export const formatEndpoint = (endpoint) =>
  endpoint// "/users/sign-up"
    .replace(/\//, '') // "users/sign-up"
    .replace(/\//g, '_'); // "users_sign-up"
