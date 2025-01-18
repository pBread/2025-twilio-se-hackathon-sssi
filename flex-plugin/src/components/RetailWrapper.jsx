import { withTaskContext } from "@twilio/flex-ui";
import NoActiveTask from "./NoActiveTask.jsx";
import RetailView from "./RetailView.jsx";
import { SyncClient } from "twilio-sync";
import { useState, useEffect } from "react";

const identity =
  "flex-agent-" +
  Math.floor(Math.random() * 1000000)
    .toString()
    .padStart(6, 0);

function RetailWrapper({ conf, task }) {
  const sync = useSyncClient(conf);
  const orders = useOrders(sync);
  return (
    <div style={{ margin: 20, width: "75%" }}>
      {task ? <RetailView sync={sync} orders={orders} /> : <NoActiveTask />}
    </div>
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

function useSyncClient(conf) {
  const [status, setStatus] = useState(null);
  const [client, setSync] = useState();

  useEffect(() => {
    if (status !== null) return;

    setStatus("initializing");

    fetchToken(conf).then(async (token) => {
      const sync = new SyncClient(token);
      sync.on("connectionStateChanged", (state) => setStatus(state));
      sync.on("tokenAboutToExpire", async () =>
        sync.updateToken(await fetchToken(conf))
      );

      setSync(sync);
    });
  }, [status]);

  return { client, status };
}

async function fetchToken(conf) {
  const url = `${conf.fnBaseUrl}/sync-token?identity=${identity}`;
  console.debug("fetchToken url", url);
  return fetch(url)
    .then((res) => res.json())
    .then((data) => data.token);
}

export default withTaskContext(RetailWrapper);
