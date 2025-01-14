import { Header } from "@/components/Header";
import { Helmet } from "@/components/Helmet";
import { type AppStore, makeStore } from "@/state/store";
import {
  initSync,
  useAddCallMapListeners,
  useFetchCallData,
} from "@/state/sync";
import "@/styles/globals.css";
import { isServer } from "@/util/env";
import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import type { AppProps } from "next/app";
import { useEffect, useRef } from "react";
import { Provider } from "react-redux";
import { useAddCallListeners } from "@/state/sync";
import { useAppDispatch } from "@/state/hooks";

export default function App(props: AppProps) {
  const storeRef = useRef<AppStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = makeStore();
    if (!isServer) initSync(storeRef.current.dispatch);
  }

  return (
    <>
      <Helmet />
      <MantineProvider>
        <Provider store={storeRef.current}>
          <Main {...props} />
        </Provider>
      </MantineProvider>
    </>
  );
}

function Main({ Component, pageProps, router }: AppProps) {
  useAddCallMapListeners();

  const callSid = router.query.callSid as string | undefined;
  useAddCallListeners(callSid);
  useFetchCallData(callSid);

  return (
    <>
      <Header callSid={router.query.callSid as string | undefined} />
      <main>
        <Component {...pageProps} />
      </main>
    </>
  );
}
