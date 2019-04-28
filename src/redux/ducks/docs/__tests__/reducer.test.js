import test from 'ava';

import * as docsTypes from '../types';
import reducer, { defaultState } from '../reducer';
import {
  collectRequestInformation,
  collectResponseInformation,
  createDoc
} from '../actions';
import { _doc, _req, _res } from '../__fixtures__';

const createDocForTest = (state, payload) =>
  reducer(state, createDoc(payload.id, payload.testName));

const collectRequestInformationForTest = (state, payload) =>
  reducer(state, collectRequestInformation(payload.id, payload.req));

const collectResponseInformationForTest = (state, payload) =>
  reducer(state, collectResponseInformation(payload.id, payload.response));


test('must return the default state for unmapped action types', t => {
  const action = { type: 'unmapped action type' };
  const state = reducer(undefined, action);

  t.assert(state == defaultState);
});

test(`must handle ${docsTypes.COLLECT_REQUEST_INFORMATION} action`, t => {
  const state1 = createDocForTest(undefined, { id: '1', testName: 'test name 1' });
  const state2 = collectRequestInformationForTest(state1, {
    id: '1',
    req: { ..._req }
  });
  t.snapshot(state2);

  const state3 = createDocForTest(state2, { id: '2', testName: 'test name 2' });
  const state4 = collectRequestInformationForTest(state3, {
    id: '2',
    req: { ..._req }
  });
  t.snapshot(state4);
});

test(`must handle ${docsTypes.COLLECT_RESPONSE_INFORMATION} action`, t => {
  const state1 = createDocForTest(undefined, { id: '1', testName: 'test name 1' });
  const state2 = collectResponseInformationForTest(state1, {
    id: '1',
    response: { ..._res }
  });
  t.snapshot(state2);

  const state3 = createDocForTest(state2, { id: '2', testName: 'test name 2' });
  const state4 = collectResponseInformationForTest(state3, {
    id: '2',
    response: { ..._res }
  });
  t.snapshot(state4);
});

test(`must handle "${docsTypes.CREATE_DOC}" action`, t => {
  const state1 = createDocForTest(undefined, { id: '1', testName: 'test name 1' });
  t.snapshot(state1);

  const state2 = createDocForTest(state1, { id: '2', testName: 'test name 2' });
  t.snapshot(state2);
});
