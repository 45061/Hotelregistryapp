import { combineReducers } from 'redux';
import modalReducer from './reducers/modalReducer';
import dateReducer from './reducers/dateReducer';
import boxReducer from './reducers/boxReducer';

const rootReducer = combineReducers({
  modalReducer,
  dateReducer,
  boxReducer,
});

export default rootReducer;