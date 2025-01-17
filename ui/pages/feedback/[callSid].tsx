import { useAppSelector } from "@/state/hooks";
import { getCallMessages, getMessageById } from "@/state/messages";
import { Badge, Checkbox, Paper, Table } from "@mantine/core";
import { BotMessage, HumanMessage } from "@shared/entities";
import { useRouter } from "next/router";
import { Dispatch, SetStateAction, useState } from "react";

const paperStyle = { padding: "6px" };

type Targets = [number, number] | null;
type SetTargets = Dispatch<SetStateAction<Targets>>;

export default function CallReview() {
  const [targets, setTargets] = useState<Targets>(null);

  return (
    <div style={{ display: "flex", gap: "8px" }}>
      <div style={{ flex: 2 }}>
        <Paper style={paperStyle}>
          <TurnTable targets={targets} setTargets={setTargets} />
        </Paper>
      </div>
      <div style={{ flex: 1 }}></div>
    </div>
  );
}

function TurnTable({
  setTargets,
  targets,
}: {
  setTargets: SetTargets;
  targets: [number, number];
}) {
  const router = useRouter();
  const callSid = router.query.callSid as string;

  const msgs = useAppSelector((state) =>
    getCallMessages(state, callSid).filter((msg) => msg.role !== "system")
  );

  return (
    <Table stickyHeader>
      <Table.Thead>
        <Table.Tr>
          <Table.Th></Table.Th>
          <Table.Th>Role</Table.Th>
          <Table.Th>Type</Table.Th>
          <Table.Th>Content</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {msgs.map((msg) => (
          <Table.Tr key={`di8-${msg.id}`} bg="">
            <Table.Td>
              <Checkbox
                onClick={(ev) => {
                  console.debug("feedback checkbox", ev);
                }}
              />
            </Table.Td>
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
