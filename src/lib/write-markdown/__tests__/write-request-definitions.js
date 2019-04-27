import test from 'ava';

import { store } from '../../../redux';
import { createDocForTests } from '../../../redux/ducks/docs';
import writeRequestDefinitions from '../write-request-definitions';

test.before(t => createDocForTests());

test(`(snapshot) must write, in order:
  1. The text "Request" in bold
  2. The request's path as a simple string
  3. The request's query parameters as a "key value table", or "empty" in italic
  4. The request's headers as a "key value table", or "empty" in italic
  5. The request's body as a code block`, t => {
    const state = store.getState();
    const docs = Object.values(state.docs.byId);
    const [ doc ] = docs;

    t.snapshot(writeRequestDefinitions(doc));
});
