import { createSlice } from "@reduxjs/toolkit";
import type { RootState } from "./store";

const SLICE_NAME = "messages";

export const messagesSlice = createSlice({
  name: SLICE_NAME,
  initialState: {},
  reducers: {},
});

/****************************************************
 Actions
****************************************************/
export const {} = messagesSlice.actions;

/****************************************************
 Selectors
****************************************************/
function getSlice(state: RootState) {
  return state[SLICE_NAME];
}
