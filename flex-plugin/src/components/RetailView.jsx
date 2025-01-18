import { Heading } from "@twilio-paste/core";
import { Column, Grid } from "@twilio-paste/core/grid";
import { Table, TBody, Td, Th, THead, Tr } from "@twilio-paste/core/table";
import { Separator } from "@twilio-paste/separator";
import { Tab, TabList, TabPanel, TabPanels, Tabs } from "@twilio-paste/tabs";
import { withTaskContext } from "@twilio/flex-ui";
import { useEffect, useState } from "react";
import ContactCard from "./ContactCard";
import ConversationSummary from "./ConversationSummary";
import HandoffReason from "./HandoffReason";
import { OrderTable } from "./OrderTable";

const styles = {
  tableWrapper: { width: "100%" },
  adjust: { width: "100%", maxWidth: "60vw" },
  convSummary: { width: "100%", marginBottom: 20 },
  table: { border: "1px solid #ededed" },
};

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

function TranscriptTable({ callSid, conf, sync }) {
  const transcriptMsgs = useTranscripts(sync, callSid)?.filter(
    (msg) => msg.role !== "system"
  );

  console.debug("TranscriptTable transcriptMsgs", transcriptMsgs);
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

function RetailView({ conf, sync, task }) {
  const callSid = task?.attributes?.customerData?.callSid;
  const userId = task?.attributes?.customerData?.userId;

  console.debug("RetaulView task", task);
  return (
    <div style={styles.adjust}>
      <Tabs baseId="retail-tabs">
        <TabList aria-label="details-tab">
          <Tab>Details</Tab>
          <Tab>Orders</Tab>
        </TabList>

        <TabPanels>
          {/* Customer Details Panel Here */}
          <TabPanel>
            <Grid gutter="space30">
              <Column span={6}>
                <ContactCard />
              </Column>
              <Column span={6}>
                <div style={styles.convSummary}>
                  <ConversationSummary />
                </div>
                <div style={styles.convSummary}>
                  <HandoffReason />
                </div>
              </Column>
            </Grid>
            <Separator orientation={"horizontal"} verticalSpacing="space40" />
            <div style={{ maxWidth: "50vw" }}>
              <Heading as="h2" variant="heading30" marginBottom="space0">
                Bot Call Transcript
              </Heading>
              <TranscriptTable conf={conf} sync={sync} callSid={callSid} />
            </div>
          </TabPanel>

          {/* Orders here */}
          <TabPanel>
            <Grid gutter="space30">
              <div style={styles.tableWrapper}>
                <p>&nbsp;</p>
                <OrderTable conf={conf} sync={sync} userId={userId} />
              </div>
            </Grid>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  );
}

export default withTaskContext(RetailView);
