const initialState = { showAdd: false, showWitdraw: false };

export default function modalReducer(state = initialState, action) {
  switch (action.type) {
    case 'SHOW_ADD_CASH':
      return { ...state, showAdd: !state.showAdd };
    case 'SHOW_WITHDRAW_CASH':
      return { ...state, showWitdraw: !state.showWitdraw };
    default:
      return state;
  }
}
