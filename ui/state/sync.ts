import { InitializeDataResult } from "@/pages/api/initialize-data";
import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import { type ConnectionState, SyncClient } from "twilio-sync";
import {
  addManyCalls,
  removeOneCall,
  setOneCall,
  updateOneCall,
} from "./calls";
import { useAppDispatch, useAppSelector } from "./hooks";
import type { AppDispatch, RootState } from "./store";
import { useEffect } from "react";
import { SYNC_CALL_MAP_NAME, SYNC_DEMO_CONFIG } from "@shared/constants";
import {
  addOneMessage,
  removeOneMessage,
  setOneMessage,
  updateOneMessage,
} from "./messages";

let syncClient: SyncClient | undefined;

const SLICE_NAME = "sync";
const identity =
  "ui-client-" + `${Math.floor(Math.random() * 1000)}`.padStart(4, "0");

interface InitialState {
  connectionState: ConnectionState;
  callMessageListeners: Record<string, "new" | "done">;
}

const initialState: InitialState = {
  connectionState: "unknown",
  callMessageListeners: {},
};

export const syncSlice = createSlice({
  name: SLICE_NAME,
  initialState,
  reducers: {
    setCallMsgListener(
      state,
      { payload }: PayloadAction<{ callSid: string; status: "new" | "done" }>
    ) {
      state.callMessageListeners[payload.callSid] = payload.status;
    },

    setSyncConnectionState(state, { payload }: PayloadAction<ConnectionState>) {
      state.connectionState = payload;
    },
  },
});

/****************************************************
 Actions
****************************************************/
export const { setCallMsgListener, setSyncConnectionState } = syncSlice.actions;

/****************************************************
 Selectors
****************************************************/
function getSlice(state: RootState) {
  return state[SLICE_NAME];
}

export function useSyncSlice() {
  return useAppSelector(getSlice);
}

/****************************************************
 Initialize Data
****************************************************/
export async function initSync(dispatch: AppDispatch) {
  const syncClient = await initSyncClient(dispatch);

  const result = (await fetch("/api/initialize-data").then((res) =>
    res.json()
  )) as InitializeDataResult;

  dispatch(addManyCalls(result.calls));
}

/****************************************************
 Client
****************************************************/
export function useSyncClient() {
  const connectionState = useSyncSlice().connectionState;

  if (connectionState === "unknown") return;

  return syncClient as SyncClient;
}

export function useAddCallMsgListeners(callSid: string) {
  const connectionState = useSyncSlice().connectionState;
  const status = useSyncSlice().callMessageListeners[callSid];
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (connectionState !== "connected") return;
    if (status) return;
    dispatch(setCallMsgListener({ callSid, status: "new" }));

    syncClient
      .map(callSid)
      .then((map) => {
        map.on("itemAdded", (ev) => {
          console.log("call msgs itemAdded", ev);
          dispatch(addOneMessage(ev.item.data));
        });

        map.on("itemUpdated", (ev) => {
          console.log("call msgs itemUpdated", ev);
          dispatch(setOneMessage(ev.item.data));
        });

        map.on("itemRemoved", (ev) => {
          console.log("call msgs itemRemoved", ev);
          dispatch(removeOneMessage(ev.key));
        });
      })
      .then(() => {
        dispatch(setCallMsgListener({ callSid, status: "done" }));
      });
  }, [connectionState, status]);
}

export function useAddCallListeners() {
  const connectionState = useSyncSlice().connectionState;
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (connectionState !== "connected") return;

    syncClient.map(SYNC_CALL_MAP_NAME).then((map) => {
      map.on("itemAdded", (ev) => {
        console.log("SYNC_CALL_MAP_NAME itemAdded", ev);
        dispatch(setOneCall(ev.item.data));
      });

      map.on("itemUpdated", (ev) => {
        console.log("SYNC_CALL_MAP_NAME itemUpdated", ev);
        dispatch(updateOneCall(ev.item.data));
      });

      map.on("itemRemoved", (ev) => {
        console.log("SYNC_CALL_MAP_NAME itemRemoved", ev);
        dispatch(removeOneCall(ev.key));
      });
    });
  }, [connectionState]);
}

async function initSyncClient(dispatch: AppDispatch) {
  let token: string;
  try {
    token = await fetchToken();
  } catch (error) {
    console.error("Error fetching sync token");
    throw error;
  }

  syncClient = new SyncClient(token);

  syncClient.on("tokenAboutToExpire", async () => {
    syncClient.updateToken(await fetchToken());
  });

  syncClient.on("tokenExpired", async () => {
    syncClient.updateToken(await fetchToken());
  });

  syncClient.on("connectionStateChanged", async (state) => {
    console.log("SyncClient connectionStateChanged", state);
    dispatch(setSyncConnectionState(state));
  });

  return syncClient;
}

async function fetchToken() {
  const url = `/api/sync-token?identity=${identity}`;

  try {
    const result = await fetch(url).then((res) => res.json());

    return result.token;
  } catch (error) {
    console.error("Error fetching sync token", error);
    throw error;
  }
}
