const usersController = require('./controller');

const usersRouter = {
  connect(app) {
    app.get('/users', usersController.get);
  }
};

module.exports = usersRouter;
