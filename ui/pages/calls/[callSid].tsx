import { TurnsTable } from "@/components/TurnsTable";
import { selectCallById } from "@/state/calls";
import { useAppSelector } from "@/state/hooks";
import { getCallLogs } from "@/state/logs";
import { Badge, Button, Modal, Paper, Table, Text, Title } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { LogActions } from "@shared/entities";
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

const paperStyle = { padding: "6px" };

function Conscious() {
  const router = useRouter();
  const callSid = router.query.callSid as string;

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
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <BotConfigModal />
        </div>
      </Paper>

      <Paper style={{ ...paperStyle }}>
        <Title order={4}>Turns</Title>
        <div style={{ height: "400px", overflow: "scroll" }}>
          <TurnsTable callSid={callSid} />
        </div>
      </Paper>

      <Paper style={{ ...paperStyle }}>
        <Title order={4}>Calibrations and Directives</Title>
        <div style={{ height: "400px", overflow: "scroll" }}>
          <DirectivesContainer />
        </div>
      </Paper>
    </div>
  );
}

function DirectivesContainer() {
  const router = useRouter();
  const callSid = router.query.callSid as string;

  const call = useAppSelector((state) => selectCallById(state, callSid));

  const logs = useAppSelector((state) => getCallLogs(state, callSid));

  return (
    <Table stickyHeader>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Source</Table.Th>
          <Table.Th>Description</Table.Th>
          <Table.Th>Actions</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {logs.map((item) => (
          <Table.Tr key={`sw4-${item.id}`}>
            <Table.Td>{item.source}</Table.Td>
            <Table.Td>{item.description}</Table.Td>
            <Table.Td>
              {[...item.actions]
                .sort((a, b) => a.localeCompare(b))
                .map((action) => (
                  <ActionBadge
                    action={action}
                    key={`s28-${item.id}-${action}`}
                  />
                ))}
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}

function ActionBadge({ action }: { action: LogActions }) {
  let color = ""; // https://mantine.dev/core/badge/

  if (action === "Approval") color = "green";
  if (action === "Rejection") color = "red";
  // if (action === "Added System Message") color = "indigo";
  // if (action === "Updated Context") color = "teal";
  if (action === "Updated Instructions") color = "gray";

  return <Badge color={color}>{action} </Badge>;
}

function BotConfigModal() {
  const [opened, { open, close, toggle }] = useDisclosure(false);

  const router = useRouter();
  const callSid = router.query.callSid as string;

  const call = useAppSelector((state) => selectCallById(state, callSid));

  return (
    <>
      <Modal
        opened={opened}
        onClose={close}
        title="Bot Configuration"
        size="100%"
      >
        <div>{call?.config.conscious.instructions}</div>;
      </Modal>
      <Button variant="default" onClick={toggle}>
        Bot Configuration
      </Button>
    </>
  );
}

function Subconsciousness() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <Paper style={paperStyle}>
        <Title order={3}>Subconscious Bots</Title>
      </Paper>
      <Paper style={paperStyle}>
        <Title order={4}>Recall</Title>
        <Title order={6}>Most Similar Conversations</Title>
        <RecallContainer />
      </Paper>
      <Paper style={paperStyle}>
        <Title order={4}>Governance</Title>
      </Paper>
    </div>
  );
}

function RecallContainer() {
  const router = useRouter();
  const callSid = router.query.callSid as string;

  const call = useAppSelector((state) => selectCallById(state, callSid));

  return (
    <Table verticalSpacing={2}>
      <Table.Thead>
        <Table.Tr>
          <Table.Td>Call Summary</Table.Td>
          <Table.Td>Similarity</Table.Td>
          <Table.Td>Annotations</Table.Td>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {call?.callContext.similarCalls.map((item) => (
          <RecallRow
            key={`rr29-${item.id}-${callSid}`}
            callSid={item.callSid}
            similarity={item.similarity}
          />
        ))}
      </Table.Tbody>
    </Table>
  );
}

function RecallRow({
  callSid,
  similarity,
}: {
  callSid: string;
  similarity: number;
}) {
  const [opened, { open, close, toggle }] = useDisclosure(false);

  const call = useAppSelector((state) => selectCallById(state, callSid));

  return (
    <Table.Tr>
      <Table.Td>{call.summary}</Table.Td>
      <Table.Td>{similarity}</Table.Td>
      <Table.Td>
        <Modal opened={opened} onClose={close} title="Recall Summary" size="xl">
          <div
            style={{
              padding: "12px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            <div>
              <Title order={5}>Call Summary</Title>
              <Text> {call?.summary}</Text>
            </div>
            <div>
              <Title order={5}>Annotations</Title>
              <Text>
                {call?.feedback.map((item) => (
                  <div key={`d302-${item.id}`}>{item.comment}</div>
                ))}
              </Text>
            </div>
            <div>
              <Title order={5}>Turns</Title>
              <TurnsTable
                callSid={callSid}
                targetStart={call.feedback.reduce(
                  (acc, cur) => Math.min(acc, cur.target[0]),
                  call?.feedback[0]?.target[0] ?? Infinity
                )}
                targetEnd={call.feedback.reduce(
                  (acc, cur) => Math.max(acc, cur.target[1]),
                  call?.feedback[1]?.target[1] ?? 0
                )}
              />
            </div>
          </div>
        </Modal>

        <a onClick={toggle} style={{ color: "blue", cursor: "pointer" }}>
          {call.feedback.length}
        </a>
      </Table.Td>
    </Table.Tr>
  );
}
