import { selectCallById, selectCallIds } from "@/state/calls";
import { useAppSelector } from "@/state/hooks";
import { CopyButton, HoverCard, Table, Text } from "@mantine/core";
import Link from "next/link";

export default function Home() {
  return (
    <div>
      Home
      <div>
        <CallTable />
      </div>
    </div>
  );
}

function CallTable() {
  const callIds = useAppSelector(selectCallIds);

  return (
    <Table>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Title</Table.Th>
          <Table.Th>CallSid</Table.Th>
          <Table.Th>Phones</Table.Th>
          <Table.Th>Status</Table.Th>
          <Table.Th>Created At</Table.Th>
          <Table.Th>Feedback</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {callIds.map((callSid) => (
          <CallRow callSid={callSid} key={`${callSid}-92sj`} />
        ))}
      </Table.Tbody>
    </Table>
  );
}

function CallRow({ callSid }: { callSid: string }) {
  const call = useAppSelector((state) => selectCallById(state, callSid));

  return (
    <Table.Tr>
      <Table.Td>
        <Link href={`/calls/${callSid}`}>
          <Text>{call.summary.title}</Text>
        </Link>
      </Table.Td>
      <Table.Td>
        <CopyButton value={callSid}>
          {({ copied, copy }) => (
            <HoverCard>
              <HoverCard.Target>
                <Text style={{ cursor: "pointer" }} onClick={copy}>
                  {call.callSid.substring(0, 20)}...
                </Text>
              </HoverCard.Target>
              <HoverCard.Dropdown>
                <Text size="sm">{copied ? "Copied" : "Copy"}</Text>
              </HoverCard.Dropdown>
            </HoverCard>
          )}
        </CopyButton>
      </Table.Td>
      <Table.Td>
        <Text>
          {call.from}
          <br />
          {call.to}
        </Text>
      </Table.Td>
      <Table.Td>
        <Text>{call.callStatus}</Text>
      </Table.Td>
      <Table.Td>
        <Text>{call.createdAt.substring(0, 25)}</Text>
      </Table.Td>
      <Table.Td>
        {!!call.feedback.length && (
          <HoverCard width={"500px"} position="left">
            <HoverCard.Target>
              <Link
                href={`/feedback/${callSid}`}
                style={{ textDecoration: "none" }}
              >
                <Text>{call.feedback.length}</Text>
              </Link>
            </HoverCard.Target>
            <HoverCard.Dropdown>
              <ul>
                {call.feedback.map((item) => (
                  <li key={`${callSid}-${item.id}-kf7`}>{item.comment}</li>
                ))}
              </ul>
            </HoverCard.Dropdown>
          </HoverCard>
        )}
        {!call.feedback.length && (
          <Link
            href={`/feedback/${callSid}`}
            style={{ textDecoration: "none" }}
          >
            <Text>{call.feedback.length}</Text>
          </Link>
        )}
      </Table.Td>
    </Table.Tr>
  );
}
