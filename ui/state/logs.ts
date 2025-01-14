import {
  createAsyncThunk,
  createEntityAdapter,
  createSlice,
} from "@reduxjs/toolkit";
import { LogRecord } from "@shared/entities";
import type { RootState } from "./store";

const SLICE_NAME = "logs";

const adapter = createEntityAdapter<LogRecord>({
  sortComparer: (a, b) => a._index - b._index,
});

interface InitialState {
  loadingStates: Record<string, "loading" | "succeeded" | "failed">;
  loadingErrors: Record<string, string>;
}

export const fetchCallLogs = createAsyncThunk(
  `${SLICE_NAME}/api/calls/[callSid]/logs`,
  async (callSid: string) => {
    const res = await fetch(`/api/calls/${callSid}/logs`);
    if (!res.ok) throw Error("Failed to fetch call logs");

    return (await res.json()) as LogRecord[];
  },
  {
    condition: (callSid, { getState }) => {
      const loadState = getLogLoadingStatus(getState() as RootState, callSid);
      return !loadState;
    },
  }
);

export const logsSlice = createSlice({
  name: SLICE_NAME,
  initialState: adapter.getInitialState({
    loadingStates: {},
    loadingErrors: {},
  } as InitialState),
  reducers: {
    addManyLogs: adapter.addMany,
    addOneLog: adapter.addOne,
    removeAllLogs: adapter.removeAll,
    removeManyLogs: adapter.removeMany,
    removeOneLog: adapter.removeOne,
    setAllLogs: adapter.setAll,
    setManyLogs: adapter.setMany,
    setOneLog: adapter.setOne,
    updateManyLogs: adapter.updateMany,
    updateOneLog: adapter.updateOne,
    upsertManyLogs: adapter.upsertMany,
    upsertOneLog: adapter.upsertOne,
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchCallLogs.pending, (state, action) => {
        state.loadingStates[action.meta.arg] = "loading";
        state.loadingErrors[action.meta.arg] = undefined;
      })
      .addCase(fetchCallLogs.fulfilled, (state, action) => {
        state.loadingStates[action.meta.arg] = "succeeded";
        adapter.upsertMany(state, action.payload);
      })
      .addCase(fetchCallLogs.rejected, (state, action) => {
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

export function getLogLoadingStatus(state: RootState, callSid: string) {
  const slice = getSlice(state);
  return slice.loadingStates[callSid];
}

export function getLogLoadingErrors(state: RootState, callSid: string) {
  const slice = getSlice(state);
  return slice.loadingErrors[callSid];
}

export const {
  selectAll: getAllLogs,
  selectById: getLogById,
  selectIds: getLogIds,
  selectEntities: getLogEntities,
  selectTotal: getLogTotal,
} = adapter.getSelectors(getSlice);

export function getCallLogIds(state: RootState, callSid: string) {
  return getAllLogs(state)
    .filter((log) => log.callSid === callSid)
    .map((log) => log.id);
}

export function getCallLogs(state: RootState, callSid: string) {
  return getAllLogs(state).filter((log) => log.callSid === callSid);
}

/****************************************************
   Actions
  ****************************************************/
export const {
  addManyLogs,
  addOneLog,
  removeAllLogs,
  removeManyLogs,
  removeOneLog,
  setAllLogs,
  setManyLogs,
  setOneLog,
  updateManyLogs,
  updateOneLog,
  upsertManyLogs,
  upsertOneLog,
} = logsSlice.actions;
