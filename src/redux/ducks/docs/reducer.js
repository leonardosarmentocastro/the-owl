import * as docsTypes from './types';

// const stateShape = {
//   docs: {
//     byId: {
//       '123': {
//         id: '123',
//         testTitle: '(200) The actual test name',
//         request: {
//           method: 'get',
//           path: '/users/:id',
//         },
//         response: {
//           body: { /* ... */ },
//           headers: { /* ... */ },
//           statusCode: 200,
//         }
//       }
//     }
//   },
// };

export const collectRequestInformation = (state, action) => {
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

export const collectResponseInformation = (state, action) => {
  const { response } = action.payload;
  const [ lastId ] = state.allIds.slice(-1);

  return {
    ...state,
    byId: {
      ...state.byId,
      [lastId]: {
        ...state.byId[lastId],
        response,
      },
    },
  };
};

export const createDoc = (state, action) => {
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
export default function reducer(state = defaultState, action) {
  switch(action.type) {
    case docsTypes.COLLECT_REQUEST_INFORMATION: return collectRequestInformation(state, action);
    case docsTypes.COLLECT_RESPONSE_INFORMATION: return collectResponseInformation(state, action);
    case docsTypes.CREATE_DOC: return createDoc(state, action);
    default: {
      return state;
    };
  }
};
