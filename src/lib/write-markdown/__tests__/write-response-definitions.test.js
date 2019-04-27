import test from 'ava';

import { store } from '../../../redux';
import { createDocForTests } from '../../../redux/ducks/docs';
import writeResponseDefinitions from '../write-response-definitions';

test.before(t => createDocForTests());

test(`(snapshot) must write, in order:
  1. The text "Response" in bold
  2. The response's status as a simple string
  3. The response's headers as a "key value table", or "empty" in italic
  4. The response's body as code block`, t => {
    const state = store.getState();
    const docs = Object.values(state.docs.byId);
    const [ doc ] = docs;

    t.snapshot(writeResponseDefinitions(doc));
});
