import { Helmet } from "@/components/Helmet";
import "@/styles/globals.css";
import type { AppProps } from "next/app";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Helmet />
      <Main Component={Component} {...pageProps} />
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
