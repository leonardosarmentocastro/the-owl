const { isEmpty } = require('lodash/lang');

const _writeBodyOptions = (body) => {
  const hasBody = !!body;
  const isObject = (typeof body === 'object');

  if (isObject)
    if (isEmpty(body)) return '';
    else return `-d '${JSON.stringify(body, null, 2)}'`;
  if (hasBody) return `-d '${body}'`;
  return '';
};

const _writeHeaderOptions = (headers) =>
  !isEmpty(headers) ? (
    Object.entries(headers)
      .map((header) => {
        const [ key, value ] = header;
        return `-H '${key}: ${value}'`;
      })
      .join('\r\n')
  ) : ('');

exports.writeCurl = (doc) => {
  const { body, headers, method, url } = doc.request;
  const instructions = [
    `curl -X ${method.toUpperCase()}`,
    url,
    _writeBodyOptions(body),
    _writeHeaderOptions(headers),
  ]
  .filter(Boolean) // Remove null, undefined, empty strings (...)
  .reduce((accumulator, currentValue, index, array) => { // Escape each instruction line
    const isLastInstruction = (index === array.length - 1);
    const instruction = (isLastInstruction ? currentValue : `${currentValue} \\`);

    return [...accumulator, instruction];
  }, []);

  return [
    '```sh',
    ...instructions,
    '```',
  ]
  .join('\r\n');
};
