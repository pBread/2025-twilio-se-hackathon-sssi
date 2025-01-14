import { selectCallById } from "@/state/calls";
import { useAppSelector } from "@/state/hooks";
import { getCallMessages } from "@/state/messages";
import { useAddCallListeners } from "@/state/sync";
import { Paper, Title } from "@mantine/core";
import { useRouter } from "next/router";

export default function LiveCall() {
  const router = useRouter();
  const callSid = router.query.callSid as string;
  useAddCallListeners(callSid);

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

      <Messages />
    </Paper>
  );
}

function Messages() {
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
      ))}{" "}
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
