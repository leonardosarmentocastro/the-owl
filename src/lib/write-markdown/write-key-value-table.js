const { isEmpty } = require('lodash/lang');

exports.writeKeyValueTable = (object) =>
  !isEmpty(object) ? (
    [
      '\r\n',
      '| Key | Value |',
      '| :--- | :--- |',
      Object.entries(object) // Write a table row for each entry.
        .map(object => {
          const [ key, value ] = object;
          return `| ${key} | ${value} |`;
        })
        .join('\r\n')
    ].join('\r\n')
  ) : ('_empty_');
