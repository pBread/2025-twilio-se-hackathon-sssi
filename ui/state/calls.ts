import { createEntityAdapter, createSlice } from "@reduxjs/toolkit";
import { CallRecord } from "@shared/entities";
import type { RootState } from "./store";

const SLICE_NAME = "calls";

const adapter = createEntityAdapter<CallRecord>({
  sortComparer: (a, b) => {
    let aa: string;
    let bb: string;

    try {
      aa = new Date(a?.createdAt)?.toISOString();
      bb = new Date(b?.createdAt)?.toISOString();
      return bb.localeCompare(aa);
    } catch (error) {
      return 0;
    }
  },
});

export const callsSlice = createSlice({
  name: SLICE_NAME,
  initialState: adapter.getInitialState(),
  reducers: {
    addManyCalls: adapter.addMany,
    addOneCall: adapter.addOne,
    removeAllCalls: adapter.removeAll,
    removeManyCalls: adapter.removeMany,
    removeOneCall: adapter.removeOne,
    setAllCalls: adapter.setAll,
    setManyCalls: adapter.setMany,
    setOneCall: adapter.setOne,
    updateManyCalls: adapter.updateMany,
    updateOneCall: adapter.updateOne,
    upsertManyCalls: adapter.upsertMany,
    upsertOneCall: adapter.upsertOne,
  },
});

/****************************************************
 Selectors
****************************************************/
function getSlice(state: RootState) {
  return state[SLICE_NAME];
}

export const {
  selectAll: selectAllCalls,
  selectById: selectCallById,
  selectIds: selectCallIds,
  selectEntities: selectCallEntities,
  selectTotal: selectCallTotal,
} = adapter.getSelectors(getSlice);

/****************************************************
 Actions
****************************************************/
export const {
  addManyCalls,
  addOneCall,
  removeAllCalls,
  removeManyCalls,
  removeOneCall,
  setAllCalls,
  setManyCalls,
  setOneCall,
  updateManyCalls,
  updateOneCall,
  upsertManyCalls,
  upsertOneCall,
} = callsSlice.actions;
