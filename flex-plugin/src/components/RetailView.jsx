import { Column, Grid } from "@twilio-paste/core/grid";
import { Separator } from "@twilio-paste/separator";
import { Tab, TabList, TabPanel, TabPanels, Tabs } from "@twilio-paste/tabs";
import { withTaskContext } from "@twilio/flex-ui";
import ContactCard from "./ContactCard";
import ConversationSummary from "./ConversationSummary";
import HandoffReason from "./HandoffReason";
import { OrderTable } from "./OrderTable";

const styles = {
  tableWrapper: { width: "100%" },
  adjust: { width: "100%" },
  convSummary: { width: "100%", marginBottom: 20 },
  table: { border: "1px solid #ededed" },
};

function RetailView({ conf, sync, task }) {
  const userId = task?.attributes?.customerData?.userId;

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
          </TabPanel>

          {/* Orders here */}
          <TabPanel>
            <Grid gutter="space30">
              <Column span={14}>
                <h1 style={styles.orderHeading}>User</h1>
              </Column>
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
