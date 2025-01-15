import { selectCallById } from "@/state/calls";
import { useAppSelector } from "@/state/hooks";
import { getCallLogs } from "@/state/logs";
import { getCallMessages, getMessageById } from "@/state/messages";
import { Button, Modal, Paper, Table, Title } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { BotMessage, HumanMessage, LogActions } from "@shared/entities";
import Link from "next/link";
import { useRouter } from "next/router";
import { Badge } from "@mantine/core";

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
          <TurnsTable />
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

function TurnsTable() {
  const router = useRouter();
  const callSid = router.query.callSid as string;

  const msgs = useAppSelector((state) => getCallMessages(state, callSid));

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
          <span> {isInterrupted && <span>Interrupted</span>}</span>
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
        <Title order={6}>5 Most Similar Conversations</Title>
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
  const callSid = router.query.callSid;

  const items = [
    {
      summary:
        "Donec et fermentum ipsum. Maecenas et finibus augue, ut convallis tellus. Morbi cursus magna non sapien ultricies, eu aliquam nibh commodo. Aliquam et congue dolor. Fusce elit lacus, fermentum eu leo ac, vestibulum bibendum justo. Integer nec sodales diam. Pellentesque magna ipsum, consequat non euismod at, semper vitae justo. Nulla sollicitudin pretium erat, bibendum cursus nibh sollicitudin at. Praesent ac purus in ante tincidunt molestie.",
      similarity: 0.98,
      annotations: 3,
      id: "2n32sdf",
    },
    {
      summary:
        "Fusce efficitur neque dolor, eu porta leo tempor id. Etiam elementum, risus a venenatis consequat, tortor purus sodales diam, sed scelerisque erat sem vel nibh. Suspendisse potenti. Morbi sit amet lacus id mi volutpat feugiat sed eu tellus. Nulla eu tristique neque. Morbi quis egestas ex, vitae dignissim nulla. Suspendisse nec purus vel augue viverra tempor.",
      similarity: 0.98,
      annotations: 3,
      id: "128dn84",
    },
    {
      summary:
        "vel vulputate dui feugiat eget. Nunc blandit est a elementum imperdiet. Sed fringilla, massa et viverra fringilla, nulla est consectetur risus, quis tincidunt elit tellus nec justo. ",
      similarity: 0.75,
      annotations: 3,
      id: "dkw830",
    },
    {
      summary: "User inquires about the time of an upcoming event.",
      similarity: 0.65,
      annotations: 3,
      id: "82jd92",
    },
    {
      summary: "User inquires about the time of an upcoming event.",
      similarity: 0.22,
      annotations: 3,
      id: "dk39j",
    },
  ];

  return (
    <Table verticalSpacing={2}>
      <Table.Thead>
        <Table.Tr>
          <Table.Td>Summary</Table.Td>
          <Table.Td>Similarity</Table.Td>
          <Table.Td>Annotations</Table.Td>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody style={{ fontSize: "12px" }}>
        {items.map((item) => (
          <Table.Tr key={`834j-${item.id}`}>
            <Table.Td>
              <Link href={`/calls/${callSid}`}>{item.summary}</Link>
            </Table.Td>
            <Table.Td>
              <Link href={`/calls/${callSid}`}>{item.similarity}</Link>
            </Table.Td>
            <Table.Td>
              <Link href={`/calls/${callSid}`}>{item.annotations}</Link>
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}
