const {
  _doc,
  createDoc, collectResponseInformation, collectRequestInformation,
  store,
} = require('../redux');

const DEFAULT = {
  doc: { ..._doc },
};
exports.createDocForTests = (doc = DEFAULT.doc) => {
  const { id, testName, req, res } = doc;

  store.dispatch(createDoc(id, testName));
  store.dispatch(collectRequestInformation(id, req));
  store.dispatch(collectResponseInformation(id, res));
};
