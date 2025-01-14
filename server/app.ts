import * as env from "./env";

import express from "express";
import ExpressWs from "express-ws";
import { CallContext } from "../shared/entities";
import log from "./logger";
import { DatabaseService } from "./services/database-service";
import {
  clearSyncData,
  populateSampleData,
  setupSync,
  demoConfig,
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
const dbPromise = new DatabaseService().init();

/****************************************************
 Twilio Voice Webhooks
****************************************************/
// handles inbound calls and connects conversation-relay call leg during outbound calls
app.post("/call-handler", async (req, res) => {
  await syncSetupPromise;

  const { CallSid, From, To } = req.body;
  log.setCallSid(CallSid); // resets the logger & scoped it to this call

  log.info(
    "/call-handler",
    `handling call from ${From} to ${To}, CallSid ${CallSid}`
  );

  try {
    let ctx: CallContext = {
      callingFromPhoneNumber: From,
      waitTime: Math.floor(Math.random() * 15) + 3,
      today: new Date().toLocaleString(),
    };

    const db = await dbPromise;
    let user = await db.users.getByChannel(From);
    if (user) ctx.user = user;
  } catch (error) {
    log.error("/call-handler", "unknown error", error);

    res.status(500).json({ status: "error", error });
  }
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
 Misc API
****************************************************/
app.get("/api/reset", async (req, res) => {
  await setupSync();
  await clearSyncData();
  await populateSampleData();

  res.send("complete");
});

app.get("/api/clear", async (req, res) => {
  await setupSync();
  await clearSyncData();

  res.send("complete");
});

app.get("/api/populate", async (req, res) => {
  await setupSync();
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
