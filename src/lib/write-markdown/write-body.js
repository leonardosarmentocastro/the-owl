const { isEmpty } = require('../utils');

const _writeCodeBlock = (content) => [
  '\r\n',
  '\`\`\`',
  content,
  '\`\`\`',
].join('\r\n');

exports.writeBody = (body) => {
  const hasBody = !!body;
  const isObject = (typeof body === 'object');

  if (isObject)
    if (isEmpty(body)) return '_empty_';
    else return _writeCodeBlock(JSON.stringify(body, null, 2));
  if (hasBody) return _writeCodeBlock(body);
  return '_empty_';
};
