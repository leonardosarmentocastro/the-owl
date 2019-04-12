const usersController = {
  get(req, res) {
    const user = { id: 1 };
    return res.status(200).json(user);
  }
};

module.exports = usersController;

