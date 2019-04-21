import chalk from 'chalk';
import { createStore, combineReducers } from 'redux';

import * as reducers from './ducks';

const rootReducer = combineReducers(reducers);
const store = createStore(rootReducer);

// TODO: document it
if (process.env.LOG_MESSAGES) {
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

export default store;
