import { TurnsTable } from "@/components/TurnsTable";
import { selectCallById } from "@/state/calls";
import { useAppSelector } from "@/state/hooks";
import { Modal, Table, Text, Title } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useRouter } from "next/router";

export function RecallContainer() {
  const router = useRouter();
  const callSid = router.query.callSid as string;

  const call = useAppSelector((state) => selectCallById(state, callSid));

  return (
    <Table verticalSpacing={2}>
      <Table.Thead>
        <Table.Tr>
          <Table.Td>Call Summary</Table.Td>
          <Table.Td>Score</Table.Td>
          <Table.Td>Annotations</Table.Td>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {call?.callContext.similarCalls.map((item) => (
          <RecallRow
            key={`rr29-${item.id}-${callSid}`}
            callSid={item.callSid}
            score={item.score}
          />
        ))}
      </Table.Tbody>
    </Table>
  );
}

function RecallRow({ callSid, score }: { callSid: string; score: number }) {
  const [opened, { open, close, toggle }] = useDisclosure(false);

  const call = useAppSelector((state) => selectCallById(state, callSid));

  return (
    <Table.Tr>
      <Table.Td>{call.summary.title}</Table.Td>
      <Table.Td>{`${Math.round(score * 100)}%`}</Table.Td>
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
              <Text> {call?.summary.title}</Text>
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
                showSystem={false}
                targets={call.feedback.flatMap((feedback) => feedback.targets)}
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
