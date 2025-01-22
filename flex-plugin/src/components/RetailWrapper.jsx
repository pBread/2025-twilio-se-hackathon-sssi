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

function RetailWrapper({ conf, task, ...props }) {
  const sync = useSyncClient(conf);
  console.debug("RetailWrapper props", { conf, task, ...props });

  return (
    <div style={{ padding: "20px", width: "100%" }}>
      {task ? <RetailView sync={sync} /> : <NoActiveTask />}
    </div>
  );
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
  return fetch(url)
    .then((res) => res.json())
    .then((data) => data.token);
}

export default withTaskContext(RetailWrapper);
