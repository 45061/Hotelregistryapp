import { INCREMENT_CHARGE } from '../../store/actions/dateAction';

const initialState = { charge: 0 };

export default function dateReducer(state = initialState, action) {
  switch (action.type) {
    case INCREMENT_CHARGE:
      return {
        ...state,
        charge: state.charge + 1,
      };
    default:
      return state;
  }
}