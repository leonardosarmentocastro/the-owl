const test = require('ava');

const { isEmpty } = require('../../utils');
const { _req, _res, store } = require('../../../redux');
const { requestMiddleware } = require('../request-middleware');
const {
  collectInformation,
  monkeypatchMethodApply,
  monkeypatchMethodCall,
  responseMiddleware,
} = require('../response-middleware');
const { setupRequestMiddleware } = require('../__helpers__');

// Utility
const getDocs = () => {
  const state = store.getState();
  const docs = Object.values(state.docs.byId);

  return docs;
}

// Setup the collection of request information. Necessary as you can only have a response if you have a request.
const simulateRequestMiddlewareUsage = (t) => {
  setupRequestMiddleware(t);
  requestMiddleware(t.context.req, t.context.res, () => null);
}

// Simulates information collection regardless of "res.json" and "res.send" patched method invokations.
const simulateResponseMiddlewareUsage = (t) => {
  simulateRequestMiddlewareUsage(t);
  collectInformation(t.context.res.body, t.context.req, t.context.res);
}

// DRY
const wasInformationCollectedTestcase = t => {
  const [ doc ] = getDocs();

  t.falsy(isEmpty(doc));
  t.falsy(isEmpty(doc.response));
};

test.serial('(collectInformation) must not fill the store with response data when information must not be collected', t => {
  const req = { ..._req };
  const res = { ..._res };
  collectInformation(res.body, req, res);

  const docs = getDocs();
  t.assert(docs.length === 0);
});

test.serial('(collectInformation) must fill the store with response data when information must be collected', t => {
  simulateResponseMiddlewareUsage(t);
  wasInformationCollectedTestcase(t);
});

test('(monkeypatchMethodApply) must collect information and then execute the original (unpatched) method code', t => {
  simulateRequestMiddlewareUsage(t);

  const unpatchedMethod = (_arg1, _arg2, _arg3) => `${_arg1} ${_arg2} ${_arg3}`;
  const { req, res } = t.context;
  const monkeypatchedMethod = monkeypatchMethodApply(unpatchedMethod, { req, res });

  const arg1 = 'The "res.end()" Express method must be patched slightly different';
  const arg2 = 'as its called internally by the Express framework with a set of arguments, instead';
  const arg3 = 'of being called with only 1 argument as "res.send" and "res.json" does.';
  t.deepEqual(
    monkeypatchedMethod(arg1, arg2, arg3),
    unpatchedMethod(arg1, arg2, arg3)
  );
  wasInformationCollectedTestcase(t);
});

test('(monkeypatchMethodCall) must collect information and then call the original (unpatched) method code', t => {
  simulateRequestMiddlewareUsage(t);

  const unpatchedMethod = (_body) => ({ ..._body, unpatchedMethodWasCalled: true });
  const { req, res } = t.context;
  const monkeypatchedMethod = monkeypatchMethodCall(unpatchedMethod, { req, res });

  const body = {
    payloadReceivedFrom:
    `Express.js "res.send" and "res.json" methods.
    For this test, it must be intercepted and have "unpatchedMethodWasCalled" prop attached.`,
  };
  t.deepEqual(monkeypatchedMethod(body), unpatchedMethod(body));
  wasInformationCollectedTestcase(t);
});

test('(responseMiddleware) must monkeypatch response methods', t => {
  const unpatchedEnd = () => 1;
  const unpatchedJson = () => 2;
  const unpatchedSend = () => 3;

  const req = {};
  const res = {
    end: unpatchedEnd,
    json: unpatchedJson,
    send: unpatchedSend,
  };
  const next = () => null;
  responseMiddleware(req, res, next);

  // Reference: https://stackoverflow.com/questions/9817629/how-do-i-compare-2-functions-in-javascript
  t.is(res.end.toString(), monkeypatchMethodApply(unpatchedEnd, { req, res }).toString());
  t.is(res.json.toString(), monkeypatchMethodCall(unpatchedJson, { req, res }).toString());
  t.is(res.send.toString(), monkeypatchMethodCall(unpatchedSend, { req, res }).toString());
});
