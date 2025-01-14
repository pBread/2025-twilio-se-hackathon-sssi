import {
  createEntityAdapter,
  createSelector,
  createSlice,
  createAsyncThunk,
} from "@reduxjs/toolkit";
import { StoreMessage } from "@shared/entities";
import { useAppSelector } from "./hooks";
import type { RootState } from "./store";

const SLICE_NAME = "messages";

const adapter = createEntityAdapter<StoreMessage>({
  sortComparer: (a, b) => a._index - b._index,
});

interface InitialState {
  loadingStates: Record<string, "loading" | "succeeded" | "failed">;
  loadingErrors: Record<string, string>;
}

export const fetchCallMessages = createAsyncThunk(
  `${SLICE_NAME}/api/calls/[callSid]/messages`,
  async (callSid: string) => {
    const res = await fetch(`/api/calls/${callSid}/messages`);
    if (!res.ok) throw Error("Failed to fetch call messages");

    return (await res.json()) as StoreMessage[];
  },
  {
    condition: (callSid, { getState }) => {
      const loadState = getMsgLoadingStatus(getState() as RootState, callSid);
      return !loadState;
    },
  }
);

export const messagesSlice = createSlice({
  name: SLICE_NAME,
  initialState: adapter.getInitialState({
    loadingStates: {},
    loadingErrors: {},
  } as InitialState),
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

  extraReducers: (builder) => {
    builder
      .addCase(fetchCallMessages.pending, (state, action) => {
        state.loadingStates[action.meta.arg] = "loading";
        state.loadingErrors[action.meta.arg] = undefined;
      })
      .addCase(fetchCallMessages.fulfilled, (state, action) => {
        state.loadingStates[action.meta.arg] = "succeeded";
        adapter.upsertMany(state, action.payload);
      })
      .addCase(fetchCallMessages.rejected, (state, action) => {
        state.loadingStates[action.meta.arg] = "failed";
        state.loadingErrors[action.meta.arg] = action.error.message;
      });
  },
});

/****************************************************
 Selectors
****************************************************/
function getSlice(state: RootState) {
  return state[SLICE_NAME];
}

export function getMsgLoadingStatus(state: RootState, callSid: string) {
  const slice = getSlice(state);
  return slice.loadingStates[callSid];
}

export function getMsgLoadingErrors(state: RootState, callSid: string) {
  const slice = getSlice(state);
  return slice.loadingErrors[callSid];
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
