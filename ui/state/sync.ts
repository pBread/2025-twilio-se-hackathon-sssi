import { InitializeDataResult } from "@/pages/api/initialize-data";
import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import { DemoConfiguration } from "@shared/entities";
import {
  logListName,
  msgMapName,
  SYNC_CALL_MAP_NAME,
  SYNC_Q_MAP_NAME,
} from "@shared/sync";
import { useEffect } from "react";
import { type ConnectionState, SyncClient } from "twilio-sync";
import { addManyCalls, removeOneCall, setOneCall } from "./calls";
import {
  addManyQuestions,
  removeOneQuestion,
  setOneQuestion,
} from "./questions";
import { useAppDispatch, useAppSelector } from "./hooks";
import { addOneLog, fetchCallLogs } from "./logs";
import {
  addOneMessage,
  fetchCallMessages,
  removeOneMessage,
  setOneMessage,
} from "./messages";
import type { AppDispatch, RootState } from "./store";

let syncClient: SyncClient | undefined;

const SLICE_NAME = "sync";
const identity =
  "ui-client-" + `${Math.floor(Math.random() * 1000)}`.padStart(4, "0");

interface InitialState {
  connectionState: ConnectionState;
  callMessageListeners: Record<string, "new" | "done">;
  demo?: DemoConfiguration;
}

const initialState: InitialState = {
  connectionState: "unknown",
  callMessageListeners: {},
  demo: undefined,
};

export const syncSlice = createSlice({
  name: SLICE_NAME,
  initialState,
  reducers: {
    setDemoConfig(state, { payload }: PayloadAction<DemoConfiguration>) {
      state.demo = payload;
    },

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
export const { setCallMsgListener, setDemoConfig, setSyncConnectionState } =
  syncSlice.actions;

/****************************************************
 Selectors
****************************************************/
function getSlice(state: RootState) {
  return state[SLICE_NAME];
}

export function getConnectionState(state: RootState) {
  return getSlice(state).connectionState;
}

function getListenerStatus(state: RootState, callSid: string) {
  return getSlice(state).callMessageListeners[callSid];
}

/****************************************************
 Initialize Data
****************************************************/
export async function initSync(dispatch: AppDispatch) {
  initSyncClient(dispatch);

  const result = (await fetch("/api/initialize-data").then((res) =>
    res.json()
  )) as InitializeDataResult;

  dispatch(addManyCalls(result.calls));
  dispatch(addManyQuestions(result.questions));
  dispatch(setDemoConfig(result.config));
}

/****************************************************
 Client
****************************************************/
export function useSyncClient() {
  const connectionState = useAppSelector(getConnectionState);

  if (connectionState !== "connected") return;

  return syncClient as SyncClient;
}

export function useFetchCallData(callSid?: string) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!callSid) return;

    dispatch(fetchCallLogs(callSid));
    dispatch(fetchCallMessages(callSid));
  }, [callSid]);
}

export function useAddCallListeners(callSid?: string) {
  const connectionState = useAppSelector(getConnectionState);
  const status = useAppSelector((state) => getListenerStatus(state, callSid));
  const dispatch = useAppDispatch();

  const syncClient = useSyncClient();

  useEffect(() => {
    if (!callSid) return;
    if (connectionState !== "connected") return;
    if (status) return;
    if (!syncClient) return;

    dispatch(setCallMsgListener({ callSid, status: "new" }));

    const addSyncListListeners = async () => {
      const listUniqueName = logListName(callSid);

      const list = await syncClient.list(listUniqueName);

      list.on("itemAdded", (ev) => {
        dispatch(addOneLog(ev.item.data));
      });
    };

    const addSyncMapListeners = async () => {
      const mapUniqueName = msgMapName(callSid);
      const map = await syncClient.map(mapUniqueName);

      map.on("itemAdded", (ev) => {
        console.log("sync store itemAdded", ev);
        dispatch(addOneMessage(ev.item.data));
      });

      map.on("itemUpdated", (ev) => {
        console.log("sync store itemUpdated", ev);

        dispatch(setOneMessage(ev.item.data));
      });

      map.on("itemRemoved", (ev) => {
        console.log("sync store itemRemoved", ev);

        dispatch(removeOneMessage(ev.key));
      });
    };

    Promise.all([addSyncListListeners(), addSyncMapListeners()]).then(() => {
      dispatch(setCallMsgListener({ callSid, status: "done" }));
    });
  }, [callSid, connectionState, syncClient, status]);
}

export function useAddCallMapListeners() {
  const connectionState = useAppSelector(getConnectionState);
  const dispatch = useAppDispatch();

  const syncClient = useSyncClient();

  useEffect(() => {
    if (connectionState !== "connected") return;

    syncClient.map(SYNC_CALL_MAP_NAME).then((map) => {
      map.on("itemAdded", (ev) => {
        dispatch(setOneCall(ev.item.data));
      });

      map.on("itemUpdated", (ev) => {
        dispatch(setOneCall(ev.item.data));
      });

      map.on("itemRemoved", (ev) => {
        dispatch(removeOneCall(ev.previousItemData.callSid));
      });
    });
  }, [connectionState]);
}

export function useAddQuestionMapListeners() {
  const connectionState = useAppSelector(getConnectionState);
  const dispatch = useAppDispatch();

  const syncClient = useSyncClient();

  useEffect(() => {
    if (connectionState !== "connected") return;

    syncClient.map(SYNC_Q_MAP_NAME).then((map) => {
      map.on("itemAdded", (ev) => {
        dispatch(setOneQuestion(ev.item.data));
      });

      map.on("itemUpdated", (ev) => {
        dispatch(setOneQuestion(ev.item.data));
      });

      map.on("itemRemoved", (ev) => {
        dispatch(removeOneQuestion(ev.previousItemData.id));
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
