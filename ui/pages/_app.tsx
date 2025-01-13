import { Helmet } from "@/components/Helmet";
import { increment } from "@/state/messages";
import { type AppStore, makeStore } from "@/state/store";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useRef } from "react";
import { Provider } from "react-redux";

export default function App({ Component, pageProps }: AppProps) {
  const storeRef = useRef<AppStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = makeStore();
    storeRef.current.dispatch(increment());
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
    <main>
      <Component {...pageProps} />
    </main>
  );
}
