import { writeMarkdown } from './write-markdown';

export const createDocFiles = (docs) => {
  return writeMarkdown(docs); // TODO: create the file
};

export default createDocFiles;
