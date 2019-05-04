exports.writeHeading = (docs) => {
  const [ doc ] = docs;
  const { method, _originalPath } = doc.request;

  return `# [${method.toLowerCase()}] ${_originalPath}`;
}
