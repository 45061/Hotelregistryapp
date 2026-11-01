import { combineReducers } from 'redux';
import modalReducer from './reducers/modalReducer';
import dateReducer from './reducers/dateReducer';
import boxReducer from './reducers/boxReducer';
import travelerReducer from './reducers/travelerReducer';

const rootReducer = combineReducers({
  modalReducer,
  dateReducer,
  boxReducer,
  travelerReducer,
});

export default rootReducer;