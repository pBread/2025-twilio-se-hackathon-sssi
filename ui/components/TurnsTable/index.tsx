import { useAppSelector } from "@/state/hooks";
import { getCallMessages, getMessageById } from "@/state/messages";
import { useFetchCallData } from "@/state/sync";
import { Badge, Table } from "@mantine/core";
import { BotMessage, HumanMessage } from "@shared/entities";

export function TurnsTable({
  callSid,
  targetStart,
  targetEnd,
}: {
  callSid: string;
  targetStart?: number;
  targetEnd?: number;
}) {
  const msgs = useAppSelector((state) => getCallMessages(state, callSid));
  useFetchCallData(callSid);

  const isHighlighted = targetStart !== undefined || targetEnd !== undefined;

  const targets = [targetStart ?? 0, targetEnd ?? msgs.length];

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
        {msgs.map((msg) => (
          <Table.Tr
            key={`di8-${msg.id}`}
            bg={
              isHighlighted &&
              msg._index + 1 >= targets[0] &&
              msg._index - 1 <= targets[1]
                ? "var(--mantine-color-blue-light)"
                : ""
            }
          >
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
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span> {content}</span>
          <span>
            {isInterrupted && <Badge color="yellow">Interrupted</Badge>}
          </span>
        </div>
      </Table.Td>
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
