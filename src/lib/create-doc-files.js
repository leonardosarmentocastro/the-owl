import { createFile, createDirectory, formatRequestPath } from './utils';
import { writeMarkdown } from './write-markdown';

export const createDocFiles = (docs) => {
  const folderPath = `${process.cwd()}/docs`;
  createDirectory(folderPath);

  const [ doc ] = docs;
  const { method, path } = doc.request;
  const fileName = `${folderPath}/[${method}]${formatRequestPath(path)}.md`;
  const content = writeMarkdown(docs);
  const err = createFile(fileName, content);

  if (err) throw err; // TODO: how to handle errors on file generation?
  return null; // TODO: maybe the same "err/null" approach?
};

export default createDocFiles;
