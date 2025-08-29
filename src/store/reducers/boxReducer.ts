import { PAYMENT_BOX, WITHDRAW_BOX } from '../types';

const initialState = { existingBalance: 0 };

export default function boxReducer(state = initialState, action) {
  switch (action.type) {
    case 'EXISTING_BALANCE_BOX':
      return { ...state, existingBalance: action.payload };
    case PAYMENT_BOX:
      // Here you would typically handle the payment logic, e.g., update existingBalance
      // For now, we'll just return the state as is or log the payload
      console.log('Payment Box Action Payload:', action.payload);
      return state;
    case WITHDRAW_BOX:
      console.log('Withdraw Box Action Payload:', action.payload);
      return state;
    default:
      return state;
  }
}
