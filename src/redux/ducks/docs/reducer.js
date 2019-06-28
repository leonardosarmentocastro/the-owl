const docsTypes = require('./types');

const collectRequestInformation = (state, action) => {
  const { id, request, testName } = action.payload;

  return {
    ...state,
    byId: {
      ...state.byId,
      [id]: {
        id,
        request,
        testName,
      },
    },
    allIds: [...state.allIds, id],
  };
};

const collectResponseInformation = (state, action) => {
  const { id, response } = action.payload;

  // Both Express "json" and "end" methods are patched to collect response information.
  // We need to conditionally collect information, since calling ".json()" also triggers ".end()" but
  // the other way around is not true.
  const hasAlreadyCollectedResponseInformation = (state.byId[id] && state.byId[id].response);
  if (hasAlreadyCollectedResponseInformation) return state;

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

const defaultState = {
  byId: {},
  allIds: [],
};
function reducer(state = defaultState, action) {
  switch(action.type) {
    case docsTypes.COLLECT_REQUEST_INFORMATION: return collectRequestInformation(state, action);
    case docsTypes.COLLECT_RESPONSE_INFORMATION: return collectResponseInformation(state, action);
    default: {
      return state;
    };
  }
};

module.exports = {
  collectRequestInformation,
  collectResponseInformation,
  defaultState,
  reducer,
};
