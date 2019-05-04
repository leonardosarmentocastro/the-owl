// NOTE: Fixtures are not shipped on distribution code.
const fixtures = (() => {
  try { return require('./__fixtures__'); }
  catch(err) { return {}; }
})();

module.exports = {
  // CONVENTION: reducer exports functions with same name as actions, so export reducer first.
  ...require('./reducer'),
  ...require('./actions'),
  ...fixtures,
};
