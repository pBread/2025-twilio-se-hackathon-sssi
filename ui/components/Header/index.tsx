import { selectCallById } from "@/state/calls";
import { useAppSelector } from "@/state/hooks";
import { getConnectionState } from "@/state/sync";
import { Loader, Paper, Skeleton, Text } from "@mantine/core";
import Link from "next/link";

export function Header({ callSid }: { callSid?: string }) {
  const connectionState = useAppSelector(getConnectionState);
  const isConnected = connectionState === "connected";

  return (
    <header>
      <Link href="/">
        <img className="header-logo" alt="logo" src={"/logo.png"} />
      </Link>
      <div className="header-section"></div>

      <div className="header-section">
        {isConnected || <Connection />}
        {isConnected && callSid && <CallDetails callSid={callSid} />}
      </div>
    </header>
  );
}

function CallDetails({ callSid }: { callSid?: string }) {
  const call = useAppSelector((state) => selectCallById(state, callSid));

  return (
    <Skeleton visible={!call} style={{ minWidth: "200px" }}>
      <Paper className="section" style={{ display: "flex", gap: "8px" }}>
        <div style={{ display: "flex", gap: "4px", flexDirection: "column" }}>
          <Text size="sm">From: {call?.from}</Text>
          <Text size="sm">
            {"To:".padEnd(6, " ")} {call?.to}
          </Text>
        </div>
        <div style={{ display: "flex", gap: "4px", flexDirection: "column" }}>
          <Text size="sm">
            <Link href={`/calls/${callSid}`}>Call Sid</Link>
          </Text>
          <Text size="sm">Status: {call?.callStatus}</Text>
        </div>
      </Paper>
    </Skeleton>
  );
}

function Connection() {
  const connectionState = useAppSelector(getConnectionState);

  if (connectionState === "connected") return;

  return <Loader size="sm" />;
}
