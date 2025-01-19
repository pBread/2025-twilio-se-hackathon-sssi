import { Heading } from "@twilio-paste/core";
import { Column, Grid } from "@twilio-paste/core/grid";
import { Separator } from "@twilio-paste/separator";
import { Tab, TabList, TabPanel, TabPanels, Tabs } from "@twilio-paste/tabs";
import { withTaskContext } from "@twilio/flex-ui";
import ContactCard from "./ContactCard";
import ConversationSummary from "./ConversationSummary";
import HandoffReason from "./HandoffReason";
import { OrderTable } from "./OrderTable";
import { TranscriptTable } from "./TranscriptTable";
import { TaskApprover } from "./TaskApprover";

const styles = {
  tableWrapper: { width: "100%" },
  adjust: { width: "100%", maxWidth: "60vw" },
  convSummary: { width: "100%", marginBottom: 20 },
  table: { border: "1px solid #ededed" },
};

function RetailView({ conf, sync, task }) {
  const callSid = task?.attributes?.customerData?.callSid;
  const userId = task?.attributes?.customerData?.userId;

  console.debug("RetaulView task", task);
  return (
    <div style={styles.adjust}>
      <Tabs baseId="retail-tabs">
        <TabList aria-label="details-tab">
          <Tab>Details</Tab>
          <Tab>Transcripts</Tab>
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
            <div style={{ maxWidth: "60vw" }}>
              <Heading as="h2" variant="heading30" marginBottom="space0">
                AI Questions
              </Heading>
              <TaskApprover callSid={callSid} />
            </div>
          </TabPanel>

          <TabPanel>
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
