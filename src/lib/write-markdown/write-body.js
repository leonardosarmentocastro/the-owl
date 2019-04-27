import { isEmpty } from 'lodash/lang';

const writeCodeBlock = (content) => [
  '\r\n',
  '\`\`\`',
  content,
  '\`\`\`',
].join('\r\n');

const writeBody = (body) => {
  const hasBody = !!body;
  const isObject = (typeof body === 'object');

  if (isObject)
    if (isEmpty(body)) return '_empty_';
    else return writeCodeBlock(JSON.stringify(body, null, 2));
  if (hasBody) return writeCodeBlock(body);
  return '_empty_';
};

export default writeBody;
