const usersController = require('./controller');

const usersRouter = {
  connect(app) {
    app.get('/users/:id', usersController.findById);
    app.post('/users', usersController.createUser);
  }
};

module.exports = usersRouter;
