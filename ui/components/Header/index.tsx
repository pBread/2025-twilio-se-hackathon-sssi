import { selectCallById } from "@/state/calls";
import { useAppSelector } from "@/state/hooks";
import { getConnectionState } from "@/state/sync";
import { Button, Loader, Text } from "@mantine/core";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";

export function Header({ callSid }: { callSid?: string }) {
  const connectionState = useAppSelector(getConnectionState);
  const isConnected = connectionState === "connected";

  return (
    <header>
      <Link href="/">
        <img className="header-logo" alt="logo" src={"/logo.png"} />
      </Link>
      <div></div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {isConnected || <Connection />}
        {isConnected && callSid && <CallDetails callSid={callSid} />}
        {isConnected && callSid && <CallViewNav callSid={callSid} />}
        {isConnected && <QuestionNavButton />}
      </div>
    </header>
  );
}

function QuestionNavButton() {
  const router = useRouter();

  if (router.route.includes("tasks")) return;

  return (
    <Link href="/tasks">
      <Button variant="default" style={{ overflow: "visible" }}>
        AI Questions
      </Button>
    </Link>
  );
}

function CallViewNav({ callSid }: { callSid: string }) {
  const router = useRouter();
  const isLive = router?.route?.startsWith("/live");

  return (
    <div style={{ display: "flex", gap: "4px", flexDirection: "column" }}>
      <Text size="sm">
        {isLive && (
          <Link href={`/feedback/${callSid}`}>
            <Button variant="default" style={{ overflow: "visible" }}>
              Add Feedback
            </Button>
          </Link>
        )}
        {!isLive && (
          <Link href={`/live/${callSid}`}>
            <Button variant="default" style={{ overflow: "visible" }}>
              View Call
            </Button>
          </Link>
        )}
      </Text>
    </div>
  );
}

function CallDetails({ callSid }: { callSid?: string }) {
  const from =
    useAppSelector((state) => selectCallById(state, callSid)?.from) ??
    "+•••••••••••";
  const to =
    useAppSelector((state) => selectCallById(state, callSid)?.to) ??
    "+•••••••••••";

  const [showFrom, setShowFrom] = useState(false);

  return (
    <div
      style={{
        display: "flex",
        gap: "4px",
        flexDirection: "column",
        width: "max-content",
      }}
    >
      <Text
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        <span>From:</span>
        {showFrom && (
          <span
            onClick={() => setShowFrom(!showFrom)}
            style={{ cursor: "pointer" }}
          >
            {from}
          </span>
        )}
        {!showFrom && (
          <span
            onClick={() => setShowFrom(!showFrom)}
            style={{ cursor: "pointer", fontFamily: "monospace" }}
          >
            {from?.replace(/\d/g, "•")}
          </span>
        )}
      </Text>
      <Text
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "6px",
        }}
      >
        <span>To:</span>
        <span>{to}</span>
      </Text>
    </div>
  );
}

function Connection() {
  const connectionState = useAppSelector(getConnectionState);

  if (connectionState === "connected") return;

  return <Loader size="sm" />;
}
