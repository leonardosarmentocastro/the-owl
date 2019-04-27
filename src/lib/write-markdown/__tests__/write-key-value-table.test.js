import test from 'ava';

import writeKeyValueTable from '../write-key-value-table';

test('(snapshot) must write a table of "key/value" combination for each object entry', t => {
  const object = {
    key1: 'value1',
    key2: 'value2',
    key3: 'value3',
  };

  t.snapshot(writeKeyValueTable(object));
});

test('(snapshot) must return "empty" in italic if a empty object is provided', t => {
  t.snapshot(writeKeyValueTable({}));
});
