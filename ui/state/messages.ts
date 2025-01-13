import { createSlice } from "@reduxjs/toolkit";

const SLICE_NAME = "messages";

export const messagesSlice = createSlice({
  name: SLICE_NAME,
  initialState: { counter: 0 },
  reducers: {
    increment(state) {
      state.counter++;
    },
  },
});

export const { increment } = messagesSlice.actions;
