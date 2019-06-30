const { usersController } = require('./controller');

exports.usersRouter = {
  connect(app) {
    app.get('/users/:id', usersController.findById);
    app.post('/users', usersController.createUser);
  },
};
