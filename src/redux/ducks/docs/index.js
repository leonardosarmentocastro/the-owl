// NOTE: Fixtures are not shipped on distribution code.
const optional = require('optional');
const fixtures = optional('./__fixtures__') || {};

module.exports = {
  // CONVENTION: reducer exports functions with same name as actions, so export reducer first.
  ...require('./reducer'),
  ...require('./actions'),
  ...fixtures,
};
