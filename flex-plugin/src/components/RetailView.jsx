import { Column, Grid } from "@twilio-paste/core/grid";
import { Table, TBody, Td, Th, THead, Tr } from "@twilio-paste/core/table";
import { Separator } from "@twilio-paste/separator";
import { Tab, TabList, TabPanel, TabPanels, Tabs } from "@twilio-paste/tabs";
import { withTaskContext } from "@twilio/flex-ui";
import ContactCard from "./ContactCard";
import ConversationSummary from "./ConversationSummary";
import HandoffReason from "./HandoffReason";

const styles = {
  tableWrapper: { width: "100%" },
  adjust: { width: "75%" },
  convSummary: { width: "100%", marginBottom: 20 },
  table: { border: "1px solid #ededed" },
  orderRow: { border: "1px solid #ededed", height: 30 },
  orderCell: { width: "25%", border: "1px solid #ededed", padding: 10 },
  orderHeading: { fontSize: 24 },
  orderTitle: { fontSize: 14 },
  orderItemRow: { border: "1px solid #ededed", height: 30 },
  orderItemCell: {
    width: "20%",
    border: "1px solid #ededed",
    padding: 10,
    textAlign: "left",
  },
  orderItemHeading: { fontSize: 24 },
};

function RetailView(props) {
  const [orders, setOrders] = useState([]);

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
                {orders?.map((order) => (
                  <Table key={`${order.id}-table`} style={{ width: "100%" }}>
                    <TBody>
                      <Tr style={styles.orderRow} key={`${order.id}-94j`}>
                        <Td style={styles.orderCell} width={100}>
                          User ID:{" "}
                        </Td>
                        <Td style={styles.orderCell}>{order.userId}</Td>
                      </Tr>
                      <Tr style={styles.orderRow}>
                        <Td colSpan={6}>&nbsp;</Td>
                      </Tr>
                      <Tr style={styles.orderRow}>
                        <Td colSpan={10}>
                          <Table width={"100%"}>
                            <THead>
                              <Th style={styles.orderItemCell}>Event ID</Th>
                              <Th style={styles.orderItemCell}>Event Date</Th>
                              <Th style={styles.orderItemCell}>Event Name</Th>
                              <Th style={styles.orderItemCell}>
                                Event Description
                              </Th>
                              <Th style={styles.orderItemCell}>City</Th>
                              <Th style={styles.orderItemCell}>Quantity</Th>
                              <Th style={styles.orderItemCell}>Total Price</Th>
                              <Th style={styles.orderItemCell}>Category</Th>
                              <Th style={styles.orderItemCell}>Venue</Th>
                            </THead>
                            <TBody>
                              <Tr
                                style={styles.orderItemRow}
                                key={`${order.id}-du4`}
                              >
                                <Td style={styles.orderItemCell}>
                                  {order.eventId}
                                </Td>
                                <Td style={styles.orderItemCell}>
                                  {order.eventDate}
                                </Td>
                                <Td style={styles.orderItemCell}>
                                  {order.eventName}
                                </Td>
                                <Td style={styles.orderItemCell}>
                                  {order.eventDescription}
                                </Td>
                                <Td style={styles.orderItemCell}>
                                  {order.city}
                                </Td>
                                <Td style={styles.orderItemCell}>
                                  {order.quantity}
                                </Td>
                                <Td style={styles.orderItemCell}>
                                  {order.totalPrice}
                                </Td>
                                <Td style={styles.orderItemCell}>
                                  {order.category}
                                </Td>
                                <Td style={styles.orderItemCell}>
                                  {order.venue}
                                </Td>
                              </Tr>

                              <Tr style={styles.orderItemRow}>
                                <Td></Td>
                              </Tr>
                            </TBody>
                          </Table>
                        </Td>
                      </Tr>
                    </TBody>
                  </Table>
                ))}
              </div>
            </Grid>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  );
}

export default withTaskContext(RetailView);
