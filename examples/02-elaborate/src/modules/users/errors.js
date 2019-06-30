exports.ERROR_USER_IS_INVALID = {
  code: 'ERROR_USER_IS_INVALID',
  message: 'User must contain "name".'
};

exports.$ERROR_USER_NOT_FOUND = (userId) => ({
  code: 'ERROR_USER_NOT_FOUND',
  message: `User "${userId}" not found!`
});
