import {
  createDoc,
  collectResponseInformation,
  collectRequestInformation,
} from './actions';
import store from '../../store';

const DEFAULT = {
  doc: {
    id: 'b72fd729-69c5-4979-900c-dd9dbe2ceb3c',
    testName: '(200) returns the given user if it exists',
    req: {
      get: (key) => (key === 'host' ? 'localhost' : ''),
      headers: null,
      method: 'get',
      originalPath: '/users/:id',
      originalUrl: '/users/1',
      path: '/users/1',
      protocol: 'http',
      query: {},
    },
    res: {
      body: {
        id: 1,
        name: 'Leonardo',
      },
      headers: {
        'x-response-header': 'not important value',
      },
      statusCode: 200,
    },
  }
};

export const createDocForTests = (doc = DEFAULT.doc) => {
  const { id, testName, req, res } = doc;

  store.dispatch(createDoc(id, testName));
  store.dispatch(collectRequestInformation(id, req));
  store.dispatch(collectResponseInformation(id, res));
};