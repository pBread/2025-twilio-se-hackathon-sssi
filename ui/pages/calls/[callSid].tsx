import { selectCallById } from "@/state/calls";
import { useAppSelector } from "@/state/hooks";
import { getCallLogs } from "@/state/logs";
import { getCallMessages, getMessageById } from "@/state/messages";
import { JsonInput, Paper, Table, Title } from "@mantine/core";
import { BotMessage, HumanMessage } from "@shared/entities";
import { useRouter } from "next/router";

export default function LiveCall() {
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

      <Title order={4}>Turns</Title>
      <MessageTable />
      <MessagesList />
      <LogsList />
    </Paper>
  );
}

function MessageTable() {
  const router = useRouter();
  const callSid = router.query.callSid as string;

  const msgs = useAppSelector((state) => getCallMessages(state, callSid));

  return (
    <Table>
      <Table.Thead>
        <Table.Tr>
          <Table.Td>Role</Table.Td>
          <Table.Td>Type</Table.Td>
          <Table.Td>Content</Table.Td>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {msgs.map((msg) => (
          <Table.Tr key={`di8-${msg.id}`}>
            {msg.role === "bot" && <BotRow msgId={msg.id} />}
            {msg.role === "human" && <HumanRow msgId={msg.id} />}
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}

function BotRow({ msgId }: { msgId: string }) {
  const msg = useAppSelector((state) =>
    getMessageById(state, msgId)
  ) as BotMessage;

  let content = "";

  if (msg.type === "tool") {
    const tool = msg.tool_calls[0];
    content = `${tool.function.name}(${JSON.stringify(
      tool.function.arguments
    )})`.replaceAll("\\", "");
  } else content = msg.content;

  return (
    <>
      <Table.Th> {msg.role}</Table.Th>
      <Table.Th> {msg.type}</Table.Th>
      <Table.Th> {content}</Table.Th>
    </>
  );
}

function HumanRow({ msgId }: { msgId: string }) {
  const msg = useAppSelector((state) =>
    getMessageById(state, msgId)
  ) as HumanMessage;

  return (
    <>
      <Table.Th> {msg.role}</Table.Th>
      <Table.Th> {msg.type}</Table.Th>
      <Table.Th> {msg.content}</Table.Th>
    </>
  );
}

function SystemRow({ msgId }: { msgId: string }) {}

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
          <JsonInput autosize value={JSON.stringify(msg)} />
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
            {item._index} - {item.type} - {item.createdAt}
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
