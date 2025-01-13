import { configureStore, Middleware } from "@reduxjs/toolkit";
import { messagesSlice } from "./messages";
import { createLogger } from "redux-logger";
import { syncSlice } from "./sync";

const middleware: Middleware[] = [];
if (process.env.NODE_ENV === "development") middleware.push(createLogger());

export const makeStore = () => {
  return configureStore({
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(createLogger()),

    reducer: {
      [messagesSlice.name]: messagesSlice.reducer,
      [syncSlice.name]: syncSlice.reducer,
    },
  });
};

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>;
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
