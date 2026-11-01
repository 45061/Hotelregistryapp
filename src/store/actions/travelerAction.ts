import { SET_TRAVELERS, INVALIDATE_TRAVELERS } from "../types";

export const setTravelersAction = (payload: any[]) => ({
  type: SET_TRAVELERS,
  payload,
});

export const invalidateTravelersAction = () => ({
  type: INVALIDATE_TRAVELERS,
});
