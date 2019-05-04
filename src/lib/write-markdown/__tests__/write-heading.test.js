const test = require('ava');

const { store } = require('../../../redux');
const { createDocForTests } = require('../../../__helpers__');
const { writeHeading } = require('../write-heading');

test.before(t => createDocForTests());

test('(snapshot) must use the first "doc" entry to write the request method/originalPath as the document heading', t => {
    const state = store.getState();
    const docs = Object.values(state.docs.byId);

    t.snapshot(writeHeading(docs));
});
