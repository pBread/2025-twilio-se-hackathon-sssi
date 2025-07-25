import { configureStore, Middleware } from "@reduxjs/toolkit";
import { createLogger } from "redux-logger";
import { callsSlice } from "./calls";
import { logsSlice } from "./logs";
import { messagesSlice } from "./messages";
import { questionsSlice } from "./questions";
import { syncSlice } from "./sync";

const middleware: Middleware[] = [];
if (process.env.NODE_ENV === "development") middleware.push(createLogger());

export const makeStore = () => {
  return configureStore({
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(createLogger()),

    reducer: {
      [callsSlice.name]: callsSlice.reducer,
      [logsSlice.name]: logsSlice.reducer,
      [messagesSlice.name]: messagesSlice.reducer,
      [questionsSlice.name]: questionsSlice.reducer,
      [syncSlice.name]: syncSlice.reducer,
    },
  });
};

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>;
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
