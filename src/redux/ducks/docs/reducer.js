const docsTypes = require('./types');

const collectRequestInformation = (state, action) => {
  const { id, request } = action.payload;

  return {
    ...state,
    byId: {
      ...state.byId,
      [id]: {
        ...state.byId[id],
        request,
      },
    },
  };
};

const collectResponseInformation = (state, action) => {
  const { id, response } = action.payload;

  return {
    ...state,
    byId: {
      ...state.byId,
      [id]: {
        ...state.byId[id],
        response,
      },
    },
  };
};

const createDoc = (state, action) => {
  const { id, testName } = action.payload;

  return {
    byId: {
      ...state.byId,
      [id]: { id, testName },
    },
    allIds: [...state.allIds, id],
  };
};

const defaultState = {
  byId: {},
  allIds: [],
};
function reducer(state = defaultState, action) {
  switch(action.type) {
    case docsTypes.COLLECT_REQUEST_INFORMATION: return collectRequestInformation(state, action);
    case docsTypes.COLLECT_RESPONSE_INFORMATION: return collectResponseInformation(state, action);
    case docsTypes.CREATE_DOC: return createDoc(state, action);
    default: {
      return state;
    };
  }
};

module.exports = {
  collectRequestInformation,
  collectResponseInformation,
  createDoc,
  defaultState,
  reducer,
};
