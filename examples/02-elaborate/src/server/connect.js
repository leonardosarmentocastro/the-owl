const bodyParser = require('body-parser');
const theOwl = require('the-owl'); // Outcome from the "build" process.

const { usersRouter } = require('../modules/users');

const middlewares = (app) => ({
  connect() {
    // Executes all functions except "connect".
    Object.keys(this)
      .filter(method => method !== 'connect')
      .forEach(method => this[method]());
  },

  bodyParser() {
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));
  },
  generateApiDocs() {
    if (process.env.NODE_ENV === 'test') { // Optional but recommended.
      theOwl.connect(app);
    }
  },
});

const routes = (app) => ({
  connect() {
    usersRouter.connect(app);
  },
});

const connect = (app) => {
  middlewares(app).connect();
  routes(app).connect();
};

module.exports = connect;
