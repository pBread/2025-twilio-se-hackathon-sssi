import * as env from "./env";

import express from "express";
import ExpressWs from "express-ws";
import path from "path";
import twilio from "twilio";
import log from "./logger";
import { createSyncToken } from "./services/sync-service";

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

/****************************************************
 Twilio Voice Webhooks
****************************************************/
// handles inbound calls and connects conversation-relay call leg during outbound calls
app.post("/call-handler", async (req, res) => {
  const { CallSid, From, To } = req.body;
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
app.post("/sync-token", async (req, res) => {
  const identity = req.body.identity ?? "anon";

  const token = createSyncToken(identity);
  res.status(200).json(token);
});

/****************************************************
 Start Server
****************************************************/
app.listen(PORT, () => {
  console.log(`server running on http://localhost:${PORT}`);
  console.log(`public base URL https://${HOSTNAME}`);
});
