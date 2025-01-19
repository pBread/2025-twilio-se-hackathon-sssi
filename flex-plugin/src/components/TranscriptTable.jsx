import { Table, TBody, Td, Th, THead, Tr } from "@twilio-paste/core/table";
import { useEffect, useState } from "react";

function useTranscripts(sync, callSid) {
  const [status, setStatus] = useState();
  const [msgs, setMessages] = useState([]);

  useEffect(() => {
    if (status) return;
    if (!sync.client) return;
    if (sync.status !== "connected") return;

    setStatus("fetching");
    sync.client.map(`msgs-${callSid}`).then(async (map) => {
      const result = await map.getItems();

      setMessages(result.items.map((item) => item.data));
      setStatus("complete");
    });
  }, [status, sync]);

  return msgs;
}

export function TranscriptTable({ callSid, conf, sync }) {
  const transcriptMsgs = useTranscripts(sync, callSid)?.filter(
    (msg) => msg.role !== "system"
  );

  return (
    <Table>
      <THead>
        <Th>Role</Th>
        <Th>Content</Th>
      </THead>
      <TBody>
        {transcriptMsgs.flatMap((msg) =>
          msg.role === "bot" && msg.type === "tool" ? (
            msg.tool_calls.map((tool) => (
              <Tr key={`52g-${msg.id}-${tool.id}`}>
                <Td>{msg.role}</Td>
                <Td>
                  {`${tool.function.name}(${JSON.stringify(
                    tool.function.arguments
                  )})`}
                </Td>
              </Tr>
            ))
          ) : (
            <Tr key={`di2-${msg.id}`}>
              <Td>{msg.role}</Td>
              <Td> {msg.content}</Td>
            </Tr>
          )
        )}
      </TBody>
    </Table>
  );
}
