module.exports = {
  // CONVENTION: First export the store, then ducks.
  ...require('./store'),
  ...require('./ducks/docs'),
};