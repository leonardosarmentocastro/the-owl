const test = require('ava');

const docsTypes = require('../types');
const { defaultState, reducer } = require('../reducer');
const { collectRequestInformation, collectResponseInformation } = require('../actions');
const { _req, _res } = require('../__fixtures__');


const collectRequestInformationForTest = (state, { testName, req, _originalPath }) =>
  reducer(state, collectRequestInformation(testName, req, { _originalPath }));

const collectResponseInformationForTest = (state, { testName, normalizedRes }) =>
  reducer(state, collectResponseInformation(testName, normalizedRes));


test('must return the default state for unmapped action types', t => {
  const action = { type: 'unmapped action type' };
  const state = reducer(undefined, action);

  t.assert(state == defaultState);
});

test(`must handle "${docsTypes.COLLECT_REQUEST_INFORMATION}" action`, t => {
  const state1 = collectRequestInformationForTest(undefined, {
    _originalPath: '/users/:id',
    testName: 'test name 1',
    req: { ..._req },
  });
  t.snapshot(state1);

  const state2 = collectRequestInformationForTest(state1, {
    _originalPath: '/users/:id',
    testName: 'test name 2',
    req: { ..._req },
  });
  t.snapshot(state2);
});

test(`must handle "${docsTypes.COLLECT_RESPONSE_INFORMATION}" action, creating a new entry for each different "testName"`, t => {
  const state1 = collectResponseInformationForTest(undefined, {
    testName: 'test name 1',
    normalizedRes: { ..._res },
  });
  t.snapshot(state1);

  const state2 = collectResponseInformationForTest(state1, {
    testName: 'test name 2',
    normalizedRes: { ..._res },
  });
  t.snapshot(state2);

  t.assert(Object.keys(state2.byId).length === 2);
  t.notDeepEqual(state1.byId, state2.byId);
});

test(`action "${docsTypes.COLLECT_RESPONSE_INFORMATION}" must not collect information twice for the same "testName"`, t => {
  const testName = 'same test name';

  const state1 = collectResponseInformationForTest(undefined, {
    testName,
    normalizedRes: { ..._res },
  });
  t.snapshot(state1);

  const state2 = collectResponseInformationForTest(state1, {
    testName,
    normalizedRes: { ..._res, statusCode: 9999 },
  });
  t.snapshot(state2);

  t.assert(Object.keys(state2.byId).length === 1);
  t.deepEqual(state1.byId, state2.byId);
});

test(`must handle a real world scenario of interaction:
  * action "${docsTypes.COLLECT_REQUEST_INFORMATION}" + action "${docsTypes.COLLECT_RESPONSE_INFORMATION}" `, t => {
    const testName = 'test name of real world scenario';

    const state1 = collectRequestInformationForTest(undefined, {
      _originalPath: '/users/:id',
      testName,
      req: { ..._req },
    });
    t.snapshot(state1);

    const state2 = collectResponseInformationForTest(state1, {
      testName,
      normalizedRes: { ..._res },
    });
    t.snapshot(state2);
});
