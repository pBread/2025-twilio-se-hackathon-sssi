import { Header } from "@/components/Header";
import { Helmet } from "@/components/Helmet";
import { AppDispatch, type AppStore, makeStore } from "@/state/store";
import { initSync } from "@/state/sync";
import "@/styles/globals.css";
import { isServer } from "@/util/env";
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
      <Provider store={storeRef.current}>
        <Main Component={Component} {...pageProps} />
      </Provider>
    </>
  );
}

function Main({ Component, pageProps }: AppProps) {
  return (
    <>
      <Header />
      <main>
        <Component {...pageProps} />
      </main>
    </>
  );
}
