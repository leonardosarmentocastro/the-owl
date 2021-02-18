const test = require('ava');

const { writeCurl } = require('../write-curl');

test.before(t => {
  t.context.doc = {
    request: {
      body: { id: 1, name: 'Leonardo' },
      headers: { "content-type": 'text/json' },
      method: 'get',
      url: 'http://localhost:8080/users/1',
    },
  };
});

test('(snapshot) must render "-d" option as formatted json when receiving body of type object', t => {
  const doc = {
    request: {
      ...t.context.doc.request,
      body: { id: 2, name: 'Diogo' },
    },
  };

  t.snapshot(writeCurl(doc));
});

test('(snapshot) must render "-d" option as text when receiving body of scalar type', t => {
  const doc = {
    request: {
      ...t.context.doc.request,
      body: 'string is a scalar type',
    },
  };

  t.snapshot(writeCurl(doc));
});

test('(snapshot) must not render "-d" option when receiving empty body', t => {
  t.snapshot(writeCurl({
    request: {
      ...t.context.doc.request,
      body: null,
    },
  }));

  t.snapshot(writeCurl({
    request: {
      ...t.context.doc.request,
      body: '',
    },
  }));

  t.snapshot(writeCurl({
    request: {
      ...t.context.doc.request,
      body: {},
    },
  }));
});

test('(snapshot) must render "-H" option for each header entry, adding a "\" while its not the last header entry', t => {
  const doc = {
    request: {
      ...t.context.doc.request,
      headers: {
        header1: 'must create an entry',
        header2: 'must create another entry',
      }
    },
  };

  t.snapshot(writeCurl(doc));
});

test('(snapshot) must not render "-H" option when receiving empty headers', t => {
  t.snapshot(writeCurl({
    request: {
      ...t.context.doc.request,
      headers: {},
    },
  }));

  t.snapshot(writeCurl({
    request: {
      ...t.context.doc.request,
      headers: null,
    },
  }));
});

test('(snapshot) must escape each instruction line of the generated curl, but not the last line', t => {
  const { doc } = t.context;
  t.snapshot(writeCurl(doc));
});
