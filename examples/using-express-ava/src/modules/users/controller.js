const { users } = require('./fixtures');

const usersController = {
  createUser(req, res) {
    const user = req.body;
    if (user && !user.name) {
      return res.status(500)
        .json({ code: 'USER_IS_INVALID', message: 'User must contain "name".' });
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
      return res.status(500)
        .json({ code: 'USER_NOT_FOUND', message: `User "${userId}" not found!` });
    }

    return res.status(200).json(user);
  },
};

module.exports = usersController;

