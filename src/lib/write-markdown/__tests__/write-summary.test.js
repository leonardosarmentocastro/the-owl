import test from 'ava';

import { store } from '../../../redux';
import { createDocForTests } from '../../../redux/ducks/docs';
import writeSummary from '../write-summary';

test.before(t => createDocForTests());

test('(snapshot) must write an "unordered list" entry for each doc entry, composing of its name/id', t => {
    const state = store.getState();
    const docs = Object.values(state.docs.byId);

    t.snapshot(writeSummary(docs));
});
