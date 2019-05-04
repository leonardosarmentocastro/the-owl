const chalk = require('chalk');
const { createStore, combineReducers } = require('redux');

const reducers = require('./ducks');

const rootReducer = combineReducers(reducers);
const store = createStore(rootReducer);
if (process.env.LOG_REDUX) {
  store.subscribe(() => {
    const message = [
      `${chalk.white.bgHex('#764abc')('\r\n REDUX STATE CHANGED ')}`,
      `${chalk.black.bgWhite(
        JSON.stringify(store.getState(), null, 2)
      )}`
    ].join('\r\n');

    console.info(message)
  });
}

module.exports = { store };
