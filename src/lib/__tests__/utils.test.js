import test from 'ava';

import { formatRequestPath } from '../utils';

test('(formatRequestPath) 01. must remove the first slash from path', t => {
  const path = '/users/sign-up';
  const [ firstLetter ] = formatRequestPath(path);

  t.assert(firstLetter !== '/');
});

test('(formatRequestPath) 02. must replace subsequent slashes with underscore', t => {
  const path = '/users/sign-up';
  const [ subsequentSlash ] = formatRequestPath(path)
    .split('users') // [ '', '_sign-up' ]
    .filter(word => !!word) // [ '_sign-up' ]
    .reduce((accumulator, word) => word, ''); // '_sign-up'

  t.assert(subsequentSlash === '_');
});
