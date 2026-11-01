import {
  PAYMENT_BOX,
  WITHDRAW_BOX,
  SET_OPEN_BOXES,
  SET_BOX_DETAILS,
  INVALIDATE_BOX,
} from '../types';

interface BoxState {
  existingBalance: number;
  openBoxes: any[];
  openBoxesLastFetched: number | null;
  boxDetails: Record<
    string,
    {
      dataBox: any;
      dataPayment: any[];
      dataWithdraw: any[];
      lastFetched: number;
    }
  >;
}

const initialState: BoxState = {
  existingBalance: 0,
  openBoxes: [],
  openBoxesLastFetched: null,
  boxDetails: {},
};

export default function boxReducer(state = initialState, action: any): BoxState {
  switch (action.type) {
    case 'EXISTING_BALANCE_BOX':
      return { ...state, existingBalance: action.payload };
    case SET_OPEN_BOXES:
      return {
        ...state,
        openBoxes: action.payload,
        openBoxesLastFetched: Date.now(),
      };
    case SET_BOX_DETAILS: {
      const { boxId, dataBox, dataPayment, dataWithdraw } = action.payload;
      return {
        ...state,
        boxDetails: {
          ...state.boxDetails,
          [boxId]: {
            dataBox,
            dataPayment,
            dataWithdraw,
            lastFetched: Date.now(),
          },
        },
      };
    }
    case INVALIDATE_BOX: {
      const { boxId } = action.payload;
      const newDetails = { ...state.boxDetails };
      delete newDetails[boxId];
      return {
        ...state,
        boxDetails: newDetails,
      };
    }
    case PAYMENT_BOX:
      console.log('Payment Box Action Payload:', action.payload);
      return state;
    case WITHDRAW_BOX:
      console.log('Withdraw Box Action Payload:', action.payload);
      return state;
    default:
      return state;
  }
}

