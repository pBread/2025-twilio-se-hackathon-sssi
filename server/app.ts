import * as env from "./env";

import express from "express";
import ExpressWs from "express-ws";
import log from "./logger";
import {
  clearSyncData,
  populateSampleData,
  setupSync,
} from "./services/sync-service";

const {
  DEFAULT_FROM_NUMBER,
  ENABLE_GOVERNANCE,
  ENABLE_RECALL,
  HOSTNAME,
  PORT,
  RECORD_CALL,
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_FN_BASE_URL,
} = env;

const { app } = ExpressWs(express());
app.use(express.urlencoded({ extended: true })).use(express.json());

const syncSetupPromise = setupSync(); // ensure the sync collections are created

/****************************************************
 Twilio Voice Webhooks
****************************************************/
// handles inbound calls and connects conversation-relay call leg during outbound calls
app.post("/call-handler", async (req, res) => {
  await syncSetupPromise;

  const { CallSid, From, To } = req.body;

  try {
  } catch (error) {}
});

// handles call status updates
app.post("/call-status", async (req, res) => {
  const callSid = req.body.CallSid;
  const status = req.body.CallStatus;

  log.info(
    "/call-status",
    `call status updated to ${status}, CallSid ${callSid}`
  );

  res.status(200).send();
});

/****************************************************
 Conversation Relay Websocket
****************************************************/
app.ws("/convo-relay/:callSid", async (ws, req) => {});

/****************************************************
 User Interface
****************************************************/
app.get("/api/reset", async (req, res) => {
  await setupSync();
  await clearSyncData();
  await populateSampleData();

  res.send("complete");
});

/****************************************************
 Start Server
****************************************************/
app.listen(PORT, () => {
  console.log(`server running on http://localhost:${PORT}`);
  console.log(`public base URL https://${HOSTNAME}`);
});
