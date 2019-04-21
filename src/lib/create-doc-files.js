import { createFile, createDirectory, formatRequestPath } from './utils';
import { writeMarkdown } from './write-markdown';

export const buildFileName = (folderPath, request) =>
  `${folderPath}/[${request.method}]${formatRequestPath(request.path)}.md`

export const createDocFiles = (docs) => {
  let err = null;

  const folderPath = `${process.cwd()}/docs`;
  err = createDirectory(folderPath);
  if (err) return err;

  const [ doc ] = docs;
  const fileName = buildFileName(folderPath, doc.request);
  const content = writeMarkdown(docs);
  err = createFile(fileName, content);
  if (err) return err;

  return null;
};

export default createDocFiles;
