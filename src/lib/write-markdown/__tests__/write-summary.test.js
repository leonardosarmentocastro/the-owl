const test = require('ava');

const { store } = require('../../../redux');
const { createDocForTests } = require('../../../__helpers__');
const { writeSummary } = require('../write-summary');

test.before(t => createDocForTests());

test('(snapshot) must write an "unordered list" entry for each doc entry, composing of its name/id', t => {
    const state = store.getState();
    const docs = Object.values(state.docs.byId);

    t.snapshot(writeSummary(docs));
});
