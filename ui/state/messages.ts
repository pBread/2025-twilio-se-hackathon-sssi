import {
  createEntityAdapter,
  createSelector,
  createSlice,
} from "@reduxjs/toolkit";
import { StoreMessage } from "@shared/entities";
import type { RootState } from "./store";
import { useAppSelector } from "./hooks";

const SLICE_NAME = "messages";

const adapter = createEntityAdapter<StoreMessage>({});

export const messagesSlice = createSlice({
  name: SLICE_NAME,
  initialState: adapter.getInitialState(),
  reducers: {
    addManyMessages: adapter.addMany,
    addOneMessage: adapter.addOne,
    removeAllMessages: adapter.removeAll,
    removeManyMessages: adapter.removeMany,
    removeOneMessage: adapter.removeOne,
    setAllMessages: adapter.setAll,
    setManyMessages: adapter.setMany,
    setOneMessage: adapter.setOne,
    updateManyMessages: adapter.updateMany,
    updateOneMessage: adapter.updateOne,
    upsertManyMessages: adapter.upsertMany,
    upsertOneMessage: adapter.upsertOne,
  },
});

/****************************************************
 Selectors
****************************************************/
function getSlice(state: RootState) {
  return state[SLICE_NAME];
}

export const {
  selectAll: selectAllMessages,
  selectById: selectMessageById,
  selectIds: selectMessageIds,
  selectEntities: selectMessageEntities,
  selectTotal: selectMessageTotal,
} = adapter.getSelectors(getSlice);

export const selectMessagesByCallSid = createSelector(
  [selectAllMessages, (_, callSid: string) => callSid],
  (messages, callSid) =>
    messages.filter((message) => message.callSid === callSid)
);

export function useCallMessages(callSid: string) {
  return useAppSelector((state) => selectMessagesByCallSid(state, callSid));
}

/****************************************************
 Actions
****************************************************/
export const {
  addManyMessages,
  addOneMessage,
  removeAllMessages,
  removeManyMessages,
  removeOneMessage,
  setAllMessages,
  setManyMessages,
  setOneMessage,
  updateManyMessages,
  updateOneMessage,
  upsertManyMessages,
  upsertOneMessage,
} = messagesSlice.actions;
