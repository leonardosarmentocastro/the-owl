const { users } = require('./__fixtures__');

const { ERROR_USER_IS_INVALID, $ERROR_USER_NOT_FOUND } = require('./errors');

exports.usersController = {
  createUser(req, res) {
    const user = req.body;
    if (user && !user.name) {
      return res.status(500).json(ERROR_USER_IS_INVALID);
    }

    user.id = (users.length + 1);
    users.push(user);

    return res.status(200).json(user);
  },

  findById(req, res) {
    const userId = req.params.id;
    const user = users.find(user => user.id === userId);

    const hasUser = !!user;
    if (!hasUser) {
      return res.status(500).json($ERROR_USER_NOT_FOUND(userId));
    }

    return res.status(200).json(user);
  },
};
