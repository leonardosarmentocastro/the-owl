import test from 'ava';

import { store } from '../../../redux';
import { createDocForTests } from '../../../redux/ducks/docs';
import writeHeading from '../write-heading';

test.before(t => createDocForTests());

test('(snapshot) must use the first "doc" entry to write the request method/originalPath as the document heading', t => {
    const state = store.getState();
    const docs = Object.values(state.docs.byId);

    t.snapshot(writeHeading(docs));
});
