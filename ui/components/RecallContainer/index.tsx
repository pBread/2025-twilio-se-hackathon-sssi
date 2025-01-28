import { selectCallById } from "@/state/calls";
import { useAppSelector } from "@/state/hooks";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { HoverCard, Table } from "@mantine/core";
import { useRouter } from "next/router";
import { useState } from "react";

export function RecallContainer() {
  const router = useRouter();
  const callSid = router.query.callSid as string;

  const call = useAppSelector((state) => selectCallById(state, callSid));

  const [parent, enableAnimations] = useAutoAnimate({});

  const [del, setDel] = useState(0);

  return (
    <Table verticalSpacing={2} stickyHeader>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Call Summary</Table.Th>
          <Table.Th>Score</Table.Th>
          <Table.Th>Notes</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody ref={parent}>
        {call?.callContext?.similarCalls?.map((item) => (
          <RecallRow
            key={`rr29-${item.id}-${callSid}`}
            callSid={item.callSid}
            score={item.score}
            title={item.title}
          />
        ))}
      </Table.Tbody>
    </Table>
  );
}

function RecallRow({
  callSid,
  score,
  title,
}: {
  callSid: string;
  score: number;
  title: string;
}) {
  const call = useAppSelector((state) => selectCallById(state, callSid));

  return (
    <Table.Tr>
      <Table.Td>{call?.summary.title ?? title}</Table.Td>
      <Table.Td>{`${Math.round(score * 100)}%`}</Table.Td>
      <Table.Td>
        <HoverCard width={"500px"} position="left">
          <HoverCard.Target>
            <div style={{ display: "flex", justifyContent: "space-around" }}>
              <a style={{ color: "blue", cursor: "pointer" }}>
                {call?.feedback.length ?? 0}
              </a>
            </div>
          </HoverCard.Target>
          <HoverCard.Dropdown>
            <ul>
              {call?.feedback.map((item) => (
                <li key={`${callSid}-${item.id}-d92`}>{item.comment}</li>
              ))}
            </ul>
          </HoverCard.Dropdown>
        </HoverCard>
      </Table.Td>
    </Table.Tr>
  );
}
