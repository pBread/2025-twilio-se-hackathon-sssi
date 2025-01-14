import * as env from "./env";

import express from "express";
import ExpressWs from "express-ws";
import { CallContext, CallRecord } from "../shared/entities";
import { getGreeting } from "./bot/greetings";
import log from "./logger";
import { CallService } from "./services/call-service";
import { ConversationStore } from "./services/conversation-store";
import { DatabaseService } from "./services/database-service";
import {
  clearSyncData,
  demoConfig,
  initCall,
  populateSampleData,
  setupSync,
  updateSyncCallItem,
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
const tempCache = new Map<string, CallRecord>(); // transfers callData between webhook & websocket

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
      annotations: [],
    };

    const db = await dbPromise;
    let user = await db.users.getByChannel(From);
    if (user) ctx.user = user;

    const callData: CallRecord = {
      id: CallSid,
      callSid: CallSid,
      callStatus: "new",
      createdAt: new Date().toLocaleString(),
      from: From,
      to: To,

      callContext: ctx,
      config: demoConfig,
      feedback: [],
    };

    tempCache.set(CallSid, callData);

    await initCall(callData);

    const greeting = getGreeting(ctx);

    const twiml = `\
<Response>
    <Connect action="${TWILIO_FN_BASE_URL}/live-agent-handoff">
        <ConversationRelay url="wss://${HOSTNAME}/convo-relay/${CallSid}" 
          ttsProvider="${demoConfig.relayConfig.ttsProvider}" 
          voice="${demoConfig.relayConfig.ttsVoice}"
          
          transcriptionProvider="${demoConfig.relayConfig.sttProvider}"

          welcomeGreeting="${greeting}"
          welcomeGreetingInterruptible="true"

          dtmfDetection="true"
          interruptByDtmf="true"
          >
              <Parameter name="greeting" value="${greeting}"/>
              <Parameter name="context" value='${JSON.stringify(ctx)}'/>
          </ConversationRelay>
    </Connect>
</Response>`;
    log.info("/call-handler", `responding with twiml\n`, twiml);

    res.status(200).type("text/xml").end(twiml);
  } catch (error) {
    log.error("/call-handler", "unknown error", error);

    res.status(500).json({ status: "error", error });
  }
});

// handles call status updates
app.post("/call-status", async (req, res) => {
  const callSid = req.body.CallSid;
  const callStatus = req.body.CallStatus;

  updateSyncCallItem(callSid, { callStatus }).catch(() => {});

  log.info(
    "/call-status",
    `call status updated to ${callStatus}, CallSid ${callSid}`
  );

  res.status(200).send();
});

/****************************************************
 Conversation Relay Websocket
****************************************************/
app.ws("/convo-relay/:callSid", async (ws, req) => {
  const { callSid } = req.params;

  log.info(`/convo-relay`, `websocket initializing, CallSid ${callSid}`);
  updateSyncCallItem(callSid, { callStatus: "connected" }).catch(() => {});

  const callData = tempCache.get(callSid) as CallRecord;
  tempCache.delete(callSid);

  const call = new CallService(callSid);
  const store = new ConversationStore(callData);

  if (store.call.config.isRecordingEnabled)
    call
      .startRecording()
      .then((res) =>
        res.status === "success"
          ? log.info("call", `started call recording, url: ${res.mediaUrl}`)
          : log.warn("call", `recording failed, code: ${res.call.errorCode}`)
      );
  else log.warn("call", "call is not being recorded");
});

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
