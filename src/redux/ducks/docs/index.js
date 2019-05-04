module.exports = {
  // CONVENTION: reducer exports functions with same name as actions, so export reducer first.
  ...require('./reducer'),
  ...require('./actions'),
  ...require('./__fixtures__'),
};
