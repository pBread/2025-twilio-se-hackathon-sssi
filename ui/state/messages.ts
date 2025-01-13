import {
  createEntityAdapter,
  createSelector,
  createSlice,
} from "@reduxjs/toolkit";
import { StoreMessage } from "@shared/entities";
import type { AppStore, RootState } from "./store";
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
  selectAll: getAllMessages,
  selectById: getMessageById,
  selectIds: getMessageIds,
  selectEntities: getMessageEntities,
  selectTotal: getMessageTotal,
} = adapter.getSelectors(getSlice);

export const selectCallMessageIds = createSelector(
  [getAllMessages, (_, callSid: string) => callSid],
  (messages, callSid) =>
    messages
      .filter((message) => message.callSid === callSid)
      .map((message) => message.id)
);

export function useCallMessageIds(callSid: string) {
  return useAppSelector((state) => selectCallMessageIds(state, callSid));
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
