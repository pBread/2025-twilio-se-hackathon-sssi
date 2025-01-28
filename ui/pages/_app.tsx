import { Header } from "@/components/Header";
import { Helmet } from "@/components/Helmet";
import { selectCallById } from "@/state/calls";
import { useAppDispatch, useAppSelector } from "@/state/hooks";
import { type AppStore, makeStore } from "@/state/store";
import {
  getNewCallSid,
  initSync,
  setNewCallId,
  useAddCallListeners,
  useAddCallMapListeners,
  useAddQuestionMapListeners,
  useFetchCallData,
} from "@/state/sync";
import "@/styles/globals.css";
import { theme } from "@/styles/theme";
import { isServer } from "@/util/env";
import {
  Button,
  MantineProvider,
  Notification,
  Title,
  Transition,
  Text,
} from "@mantine/core";
import "@mantine/core/styles.css";
import { IconPhoneCalling } from "@tabler/icons-react";
import type { AppProps } from "next/app";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { Provider } from "react-redux";

export default function App(props: AppProps) {
  const storeRef = useRef<AppStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = makeStore();
    if (!isServer) initSync(storeRef.current.dispatch);
  }

  return (
    <>
      <Helmet />
      <MantineProvider theme={theme}>
        <Provider store={storeRef.current}>
          <Main {...props} />
        </Provider>
      </MantineProvider>
    </>
  );
}

function Main({ Component, pageProps, router }: AppProps) {
  useAddCallMapListeners();
  useAddQuestionMapListeners();

  const callSid = router.query.callSid as string | undefined;
  useAddCallListeners(callSid);
  useFetchCallData(callSid);

  if (router.route.includes("iframe")) return <Component {...pageProps} />;

  return (
    <>
      <Header callSid={router.query.callSid as string | undefined} />
      <main>
        <Component {...pageProps} />
      </main>
      <IncomingCallNotification />
    </>
  );
}

let timer: NodeJS.Timeout;
function IncomingCallNotification() {
  const newCallSid = useAppSelector(getNewCallSid);

  const callerName = useAppSelector((state) => {
    if (!newCallSid) return undefined;

    const call = selectCallById(state, newCallSid);
    if (!call) return "unknown";

    const user = call?.callContext?.user;

    if (!user?.firstName) return call.callContext?.callingFromPhoneNumber;

    return `${user?.firstName} ${user?.lastName}`;
  });

  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!newCallSid) clearInterval(timer);

    timer = setTimeout(() => {
      dispatch(setNewCallId(undefined));
    }, 5000);

    return () => clearTimeout(timer);
  }, [newCallSid]);

  return (
    <div
      style={{
        position: "absolute",
        top: 80 + 12,
        right: `var(--main-padding)`,
      }}
    >
      <Transition
        mounted={!!newCallSid}
        transition="slide-left"
        duration={400}
        timingFunction="ease"
      >
        {(styles) => (
          <Notification
            style={{
              border: "1px solid var(--mantine-color-gray-2);",
              ...styles,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column" }}>
              <Text fw="bold">Incoming Call from {callerName}</Text>

              <div style={{ display: "flex", gap: "10px" }}>
                <Button color="red"> Decline </Button>

                <Link href={`/live/${newCallSid}`}>
                  <Button
                    color="green"
                    onClick={() => {
                      dispatch(setNewCallId(undefined));
                    }}
                  >
                    Answer
                  </Button>
                </Link>
              </div>
            </div>
          </Notification>
        )}
      </Transition>
    </div>
  );
}
