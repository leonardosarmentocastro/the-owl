import { createStore, combineReducers } from 'redux';

import * as reducers from './ducks';

const rootReducer = combineReducers(reducers);
const store = createStore(rootReducer);
store.subscribe(() =>
  console.log(
    JSON.stringify(store.getState(), null, 2)
  )
); // TODO: remove it. Used only for development.

export default store;
