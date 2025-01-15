import { selectCallById } from "@/state/calls";
import { useAppSelector } from "@/state/hooks";
import { getCallLogs } from "@/state/logs";
import { getCallMessages, getMessageById } from "@/state/messages";
import { Button, JsonInput, Paper, Table, Title } from "@mantine/core";
import { BotMessage, HumanMessage } from "@shared/entities";
import { useRouter } from "next/router";
import { useState } from "react";

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

const paperStyle = { padding: "6px" };

function Conscious() {
  const [showTurns, setShowTurns] = useState(true);
  const [showSystem, setShowSystem] = useState(true);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <Paper
        style={{
          ...paperStyle,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <Title order={3}>Conscious Bot</Title>
        <div style={{ display: "flex", gap: "10px" }}>
          <Button
            color={showTurns ? "cyan" : "gray"}
            onClick={() => setShowTurns(!showTurns)}
          >
            Turns
          </Button>
          <Button
            color={showSystem ? "cyan" : "gray"}
            onClick={() => setShowSystem(!showSystem)}
          >
            System
          </Button>
        </div>
      </Paper>
      {showTurns && (
        <Paper style={{ ...paperStyle }}>
          <Title order={4}>Turns</Title>
          <div style={{ height: "500px", overflow: "scroll" }}>
            <TurnsTable />
          </div>
        </Paper>
      )}
      {showSystem && (
        <Paper style={{ ...paperStyle }}>
          <Title order={4}>System Messages</Title>
          <div style={{ height: "200px", overflow: "scroll" }}>
            <SystemMessages />
          </div>
        </Paper>
      )}
    </div>
  );
}

function TurnsTable() {
  const router = useRouter();
  const callSid = router.query.callSid as string;

  const msgs = useAppSelector((state) => getCallMessages(state, callSid));

  return (
    <Table stickyHeader>
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

function SystemMessages() {
  const router = useRouter();
  const callSid = router.query.callSid as string;
  const msgs = useAppSelector((state) =>
    getCallMessages(state, callSid)
  ).filter((msg) => msg.role === "system");

  return (
    <Table stickyHeader>
      <Table.Thead>
        <Table.Tr>
          <Table.Td>Role</Table.Td>
          <Table.Td>Content</Table.Td>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {msgs.map((msg) => (
          <Table.Tr key={`sd2-${msg.id}`}>
            <Table.Td>system</Table.Td>
            <Table.Td>{msg.content}</Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
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
    <Paper style={paperStyle}>
      <Title order={3}>Subconscious Bot</Title>
    </Paper>
  );
}
