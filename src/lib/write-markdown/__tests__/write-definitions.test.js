const test = require('ava');

const { store } = require('../../../redux');
const { createDocForTests } = require('../../../__helpers__');
const { writeDefinitions } = require('../write-definitions');

test.before(t => createDocForTests());

test(`(snapshot) must contain, in order, for each "doc" entry:
  1. The the "testName" + anchor tag as the header
  2. The generated curl for the "doc.request"
  3. The request definitions
  4. The response definitions`, t => {
    const state = store.getState();
    const docs = Object.values(state.docs.byId);

    t.snapshot(writeDefinitions(docs));
});
