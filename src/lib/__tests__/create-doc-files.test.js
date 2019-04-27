import test from 'ava';
import fs from 'fs';
import rimraf from 'rimraf';

import { store } from '../../redux';
import { createDocForTests } from '../../redux/ducks/docs';
import {
  buildFileName,
  createDirectory,
  createDocFiles,
  writeMarkdown
} from '../';

test.before('creating a "doc" object on store', t => {
  createDocForTests();

  const state = store.getState();
  t.context.docs = Object.values(state.docs.byId);
});

test('(buildFileName) must be a combination of "folder path" + "request method" + "formatted request path" + ".md extension"', t => {
  const folderPath = process.cwd();
  const request = { originalPath: '/users/sign-up', method: 'get' };

  t.snapshot(buildFileName(folderPath, request));
});

test('(createDocFiles) must create one file under "/docs" with the whole current data for "doc" state', t => {
  try {
    createDocFiles(t.context.docs);

    const path = `${process.cwd()}/docs`;
    const files = fs.readdirSync(path);
    t.assert(files.length === 1);

    const [ createdFileName ] = files;
    const createdFileContent = fs.readFileSync(`${path}/${createdFileName}`, 'utf8');
    t.assert(createdFileContent === writeMarkdown(t.context.docs));
  } catch(err) {
    t.fail(err);
  }
});

test('(createDocFiles) if "/docs" folder already exists, the operation must be idempotent and dont throw errors', t => {
  let err = null;

  const folderPath = `${process.cwd()}/docs`;
  err = createDirectory(folderPath);
  t.assert(err === null);

  err = createDocFiles(t.context.docs);
  t.assert(err === null);
});

test.after.always.cb('cleaning up: deleting "docs/" folder', t => {
  const folderPath = `${process.cwd()}/docs`;
  rimraf(folderPath, t.end);
});
