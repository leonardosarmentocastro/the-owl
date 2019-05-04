const {
  _doc,
  collectResponseInformation, collectRequestInformation,
  store,
} = require('../redux');

exports.createDocForTests = (doc = { ..._doc }) => {
  const { testName, req, res } = doc;
  const { _originalPath } = req;

  store.dispatch(collectRequestInformation(testName, req, { _originalPath }));
  store.dispatch(collectResponseInformation(testName, res));
};
