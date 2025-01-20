import { useAppSelector } from "@/state/hooks";
import { getCallMessages, getMessageById } from "@/state/messages";
import { useFetchCallData } from "@/state/sync";
import { Badge, Table } from "@mantine/core";
import type { BotMessage, HumanMessage } from "@shared/entities";

export function TurnsTable({
  callSid,
  targets,
  showSystem,
}: {
  callSid: string;
  targets?: number[];
  showSystem: boolean;
}) {
  const msgs = useAppSelector((state) => getCallMessages(state, callSid));
  useFetchCallData(callSid);

  return (
    <Table stickyHeader>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Role</Table.Th>
          <Table.Th>Type</Table.Th>
          <Table.Th>Content</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {msgs
          .filter((msg) => msg?.flag !== "no-display")
          .map((msg) => (
            <Table.Tr
              key={`di8-${msg.id}`}
              bg={
                targets?.includes(msg._index)
                  ? "var(--mantine-color-blue-light)"
                  : ""
              }
            >
              {msg.role === "bot" && <BotRow msgId={msg.id} />}
              {msg.role === "human" && <HumanRow msgId={msg.id} />}
              {msg.role === "system" && showSystem && (
                <SystemRow msgId={msg.id} />
              )}
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
  let isInterrupted = false;

  if (msg.type === "tool") {
    const tool = msg.tool_calls[0];
    content = `${tool.function.name}(${JSON.stringify(
      tool.function.arguments
    )})`.replaceAll("\\", "");
  } else {
    content = msg.content;
    isInterrupted = !!msg.interrupted;
  }

  return (
    <>
      <Table.Td>{msg.role}</Table.Td>
      <Table.Td>{msg.type}</Table.Td>
      <Table.Td>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "2px",
          }}
        >
          <span style={{ flex: 1 }}> {content}</span>
          <span>
            {isInterrupted && <Badge color="yellow">Interrupted</Badge>}
          </span>
        </div>
      </Table.Td>
    </>
  );
}

function SystemRow({ msgId }: { msgId: string }) {
  const msg = useAppSelector((state) =>
    getMessageById(state, msgId)
  ) as HumanMessage;

  return (
    <>
      <Table.Td> {msg.role}</Table.Td>
      <Table.Td> {msg.type}</Table.Td>
      <Table.Td> {msg.content}</Table.Td>
    </>
  );
}

function HumanRow({ msgId }: { msgId: string }) {
  const msg = useAppSelector((state) =>
    getMessageById(state, msgId)
  ) as HumanMessage;

  return (
    <>
      <Table.Td> {msg.role}</Table.Td>
      <Table.Td> {msg.type}</Table.Td>
      <Table.Td> {msg.content}</Table.Td>
    </>
  );
}
