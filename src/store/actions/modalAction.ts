import {
  SHOW_PROMO,
  HIDDE_REGISTER_FORM,
  SHOW_REGISTER_FORM,
  SHOW_LOGIN_FORM,
  HIDDE_LOGIN_FORM,
  SHOW_FORM,
  SHOW_RECOVER_PASSWORD,
  HIDDE_RECOVER_PASSWORD,
  SHOW_BOOKINGADMIN,
  SHOW_BOOKING_DATA,
  SHOW_TEXTAREA_DATA,
  SHOW_ROOMPICK_UPLOAD,
  SHOW_BOX_CREATED,
  SHOW_SELECT_BOX,
  SHOW_ADD_CASH,
  SHOW_WITHDRAW_CASH,
} from "../types";

const actionBody = (type, payload = null) => ({ type, payload });

export const showRegisterForm = () => actionBody(SHOW_REGISTER_FORM);
export const hiddeRegisterForm = () => actionBody(HIDDE_REGISTER_FORM);
export const showLoginForm = () => actionBody(SHOW_LOGIN_FORM);
export const hiddeLoginForm = () => actionBody(HIDDE_LOGIN_FORM);
export const showFormAction = () => actionBody(SHOW_FORM);
export const showPromoAction = () => actionBody(SHOW_PROMO);
export const showRecoverPassword = () => actionBody(SHOW_RECOVER_PASSWORD);
export const hiddeRecoverPassword = () => actionBody(HIDDE_RECOVER_PASSWORD);
export const showBookingAdminAction = () => actionBody(SHOW_BOOKINGADMIN);
export const showBookingDataAction = () => actionBody(SHOW_BOOKING_DATA);
export const showTextAreaAction = () => actionBody(SHOW_TEXTAREA_DATA);
export const showRoomPickAction = () => actionBody(SHOW_ROOMPICK_UPLOAD);
export const showBoxCreatedAction = () => actionBody(SHOW_BOX_CREATED);
export const showBoxSelectAction = () => actionBody(SHOW_SELECT_BOX);
export const showAddCashAction = () => actionBody(SHOW_ADD_CASH);
export const showWithdrawCashAction = () => actionBody(SHOW_WITHDRAW_CASH);

// export const showFormAction = () => async (dispatch) => {
//   dispatch({
//     type: SHOW_FORM,
//     payload: null,
//   });
// };
