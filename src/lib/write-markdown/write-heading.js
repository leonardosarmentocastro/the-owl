const writeHeading = (docs) => {
  const [ doc ] = docs;
  const { method, originalPath } = doc.request;

  return `# [${method.toLowerCase()}] ${originalPath}`;
}

export default writeHeading;
