import { createStore, combineReducers } from 'redux';

import * as reducers from './ducks';

const rootReducer = combineReducers(reducers);
const store = createStore(rootReducer);

export default store;
