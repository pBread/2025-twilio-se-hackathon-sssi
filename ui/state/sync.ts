import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import {
  type ConnectionState,
  SyncClient,
  SyncDocument,
  SyncList,
  SyncMap,
} from "twilio-sync";
import { useAppSelector } from "./hooks";
import type { AppDispatch, RootState } from "./store";

let syncClient: SyncClient | undefined;

const SLICE_NAME = "sync";
const identity =
  "ui-client-" + `${Math.floor(Math.random() * 1000)}`.padStart(4, "0");

interface InitialState {
  connectionState: ConnectionState;
}

const initialState: InitialState = {
  connectionState: "unknown",
};

export const syncSlice = createSlice({
  name: SLICE_NAME,
  initialState,
  reducers: {
    setSyncConnectionState(state, { payload }: PayloadAction<ConnectionState>) {
      state.connectionState = payload;
    },
  },
});

/****************************************************
 Actions
****************************************************/
export const { setSyncConnectionState } = syncSlice.actions;

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
  )) as Promise<{ docs: SyncDocument[]; lists: SyncList[]; maps: SyncMap[] }>;
}

/****************************************************
 Client
****************************************************/
export function useSyncClient() {
  const connectionState = useSyncSlice().connectionState;

  if (connectionState === "unknown") return;

  return syncClient as SyncClient;
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
