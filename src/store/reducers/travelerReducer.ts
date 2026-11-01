import { SET_TRAVELERS, INVALIDATE_TRAVELERS } from "../types";

interface TravelerState {
  records: any[];
  lastFetched: number | null;
}

const initialState: TravelerState = {
  records: [],
  lastFetched: null,
};

export default function travelerReducer(state = initialState, action: any): TravelerState {
  switch (action.type) {
    case SET_TRAVELERS:
      return {
        ...state,
        records: action.payload,
        lastFetched: Date.now(),
      };
    case INVALIDATE_TRAVELERS:
      return {
        ...state,
        records: [],
        lastFetched: null,
      };
    default:
      return state;
  }
}
