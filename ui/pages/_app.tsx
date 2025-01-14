import { Header } from "@/components/Header";
import { Helmet } from "@/components/Helmet";
import { type AppStore, makeStore } from "@/state/store";
import { initSync, useAddCallListeners } from "@/state/sync";
import "@/styles/globals.css";
import { isServer } from "@/util/env";
import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import type { AppProps } from "next/app";
import { useRef } from "react";
import { Provider } from "react-redux";

export default function App({ Component, pageProps }: AppProps) {
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
          <Main Component={Component} {...pageProps} />
        </Provider>
      </MantineProvider>
    </>
  );
}

function Main({ Component, pageProps }: AppProps) {
  useAddCallListeners();

  return (
    <>
      <Header />
      <main>
        <Component {...pageProps} />
      </main>
    </>
  );
}
