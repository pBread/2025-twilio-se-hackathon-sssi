import { selectCallById } from "@/state/calls";
import { useAppSelector } from "@/state/hooks";
import { getCallLogs } from "@/state/logs";
import { getCallMessages } from "@/state/messages";
import { Paper, Title } from "@mantine/core";
import { useRouter } from "next/router";

export default function LiveCall() {
  const router = useRouter();
  const callSid = router.query.callSid as string;

  return (
    <div style={{ display: "flex", gap: "8px" }}>
      <div style={{ flex: 2 }}>
        <Conscious />
      </div>
      <div style={{ flex: 1 }}>
        <Subconsciousness />
      </div>
    </div>
  );
}

function Conscious() {
  return (
    <Paper>
      <Title order={3}>Conscious Bot</Title>

      <MessagesList />
      <LogsList />
    </Paper>
  );
}

function MessagesList() {
  const router = useRouter();
  const callSid = router.query.callSid as string;

  const call = useAppSelector((state) => selectCallById(state, callSid));
  const msgs = useAppSelector((state) => getCallMessages(state, callSid));

  return (
    <div style={{ paddingLeft: "5px" }}>
      Messages
      {msgs.map((msg) => (
        <li key={`${msg.id}-938jd`}>
          {msg.role} - {msg.id} - {msg._index}
        </li>
      ))}
    </div>
  );
}

function LogsList() {
  const router = useRouter();
  const callSid = router.query.callSid as string;

  const call = useAppSelector((state) => selectCallById(state, callSid));
  const logs = useAppSelector((state) => getCallLogs(state, callSid));

  return (
    <div style={{ paddingLeft: "5px" }}>
      Logs
      {logs
        .map((item) => ({
          ...item,
          createdAt: new Date(item.createdAt).toLocaleString(),
        }))
        .map((item) => (
          <li key={`${item.id}-938jd`}>
            {item._index} - {item.createdAt}
          </li>
        ))}
    </div>
  );
}

function Subconsciousness() {
  return (
    <Paper>
      <Title order={3}>Subconscious Bot</Title>
    </Paper>
  );
}
