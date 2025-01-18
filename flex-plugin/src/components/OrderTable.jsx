import { Table, TBody, Td, Th, THead, Tr } from "@twilio-paste/core/table";
import { useEffect, useState } from "react";

const styles = {
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

export function OrderTable({ conf, sync, userId }) {
  const orders =
    useOrders(sync)?.filter((order) => order.userId === userId) ?? [];

  return (
    <Table style={{ width: "100%" }}>
      <THead>
        <Th style={styles.orderItemCell}>Event ID</Th>
        <Th style={styles.orderItemCell}>Event Date</Th>
        <Th style={styles.orderItemCell}>Event Name</Th>
        <Th style={styles.orderItemCell}>Event Description</Th>
        <Th style={styles.orderItemCell}>City</Th>
        <Th style={styles.orderItemCell}>Quantity</Th>
        <Th style={styles.orderItemCell}>Total Price</Th>
        <Th style={styles.orderItemCell}>Category</Th>
        <Th style={styles.orderItemCell}>Venue</Th>
      </THead>
      <TBody>
        {orders?.map((order) => (
          <Tr key={`${userId}-49d-${order.id}`} style={styles.orderItemRow}>
            <Td style={styles.orderItemCell}>{order.eventId}</Td>
            <Td style={styles.orderItemCell}>{order.eventDate}</Td>
            <Td style={styles.orderItemCell}>{order.eventName}</Td>
            <Td style={styles.orderItemCell}>{order.eventDescription}</Td>
            <Td style={styles.orderItemCell}>{order.city}</Td>
            <Td style={styles.orderItemCell}>{order.quantity}</Td>
            <Td style={styles.orderItemCell}>{order.totalPrice}</Td>
            <Td style={styles.orderItemCell}>{order.category}</Td>
            <Td style={styles.orderItemCell}>{order.venue}</Td>
          </Tr>
        ))}
      </TBody>
    </Table>
  );
}

function useOrders(sync) {
  const [status, setStatus] = useState();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (status) return;
    if (!sync.client) return;
    if (sync.status !== "connected") return;

    setStatus("fetching");
    sync.client.map("orders").then(async (map) => {
      const result = await map.getItems();

      setOrders(result.items.map((item) => item.data));
      setStatus("complete");
    });
  }, [status, sync]);

  return orders;
}
