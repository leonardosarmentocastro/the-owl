const bodyParser = require('body-parser');
const cors = require('cors');
const errorhandler = require('errorhandler');
const morgan = require('morgan');

const usersRouter = require('../modules/users/router');

const middlewares = (app) => ({
  connect() {
    this.bodyParser();
    this.cors();
    this.logErrorsOnConsole();
    this.logRequestsOnConsole();
    this.prettifyJsonOutput();
  },

  bodyParser() {
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));
  },
  cors() {
    app.use(cors());
  },
  logErrorsOnConsole() {
    app.use(errorhandler());
  },
  logRequestsOnConsole() {
    const logFormat = 'dev';
    app.use(morgan(logFormat));
  },
  prettifyJsonOutput() {
    app.set('json spaces', 2);
  }
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
