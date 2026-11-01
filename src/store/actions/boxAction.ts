import {
  SET_OPEN_BOXES,
  SET_BOX_DETAILS,
  INVALIDATE_BOX,
} from '../types';

export const existingBalanceBox = (payload) => ({ type: 'EXISTING_BALANCE_BOX', payload });
export const paymentBox = (payload) => ({ type: 'PAYMENT_BOX', payload });
export const withdrawBox = (payload) => ({ type: 'WITHDRAW_BOX', payload });
export const setOpenBoxesAction = (payload) => ({ type: SET_OPEN_BOXES, payload });
export const setBoxDetailsAction = (payload) => ({ type: SET_BOX_DETAILS, payload });
export const invalidateBoxAction = (boxId) => ({ type: INVALIDATE_BOX, payload: { boxId } });
