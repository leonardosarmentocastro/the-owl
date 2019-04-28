import {
  createDoc,
  collectResponseInformation,
  collectRequestInformation,
} from './actions';
import store from '../../store';
import { _doc } from './__fixtures__/_doc.fixture';

const DEFAULT = {
  doc: { ..._doc },
};
export const createDocForTests = (doc = DEFAULT.doc) => {
  const { id, testName, req, res } = doc;

  store.dispatch(createDoc(id, testName));
  store.dispatch(collectRequestInformation(id, req));
  store.dispatch(collectResponseInformation(id, res));
};
