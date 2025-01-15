import * as env from "./env";

import deepmerge from "deepmerge";
import express from "express";
import ExpressWs from "express-ws";
import {
  BotMessage,
  BotText,
  CallContext,
  CallRecord,
  DemoConfiguration,
  UserRecord,
} from "../shared/entities";
import bot from "./bot/conscious";
import { getGreeting } from "./bot/greetings";
import governanceBot from "./bot/subconscious/governance";
import log from "./logger";
import { CallService } from "./services/call-service";
import { ConversationStore } from "./services/conversation-store";
import { DatabaseService } from "./services/database-service";
import { RelayService } from "./services/relay-service";
import {
  clearSyncData,
  demoConfig,
  initCall,
  populateSampleData,
  setupSync,
  updateSyncCallItem,
} from "./services/sync-service";
import { LLMService } from "./services/llm-service";

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
    let user: UserRecord | undefined;

    if (demoConfig.isRecordingEnabled) {
      log.info("/call-handler", `fetching segment profile`);
      user = await db.users.getByChannel(From);
    } else
      log.warn(
        `/call-handler`,
        "did not fetch segment profile because it is disabled"
      );
    if (user) ctx.user = user;

    // update demo configuration with the context of this call
    const config = deepmerge.all([
      demoConfig,
      {
        conscious: { instructions: bot.getInstructions(ctx) },
        subconscious: {
          governanceInstructions: governanceBot.getInstructions(ctx),
        },
      },
    ]) as DemoConfiguration;

    const callData: CallRecord = {
      id: CallSid,
      callSid: CallSid,
      callStatus: "new",
      createdAt: new Date().toLocaleString(),
      from: From,
      to: To,

      callContext: ctx,
      config,
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

  const callData = tempCache.get(callSid) as CallRecord;
  tempCache.delete(callSid);

  const call = new CallService(callSid);
  const db = await dbPromise;
  const relay = new RelayService(callSid, ws);
  const store = new ConversationStore(callData);

  const llm = new LLMService(store, relay, db);

  if (store.call.config.isRecordingEnabled)
    call
      .startRecording()
      .then((res) =>
        res.status === "success"
          ? log.info("call", `started call recording, url: ${res.mediaUrl}`)
          : log.warn("call", `recording failed, code: ${res.call.errorCode}`)
      );
  else log.warn("call", "call is not being recorded");

  relay.onSetup((ev) => {
    store.setCall({ callStatus: "connected" });

    store.addSystemMessage({
      content: store.call.config.conscious.instructions,
      id: "instructions",
    });

    const greeting = ev.customParameters?.greeting;
    if (greeting) store.addBotText({ content: greeting, id: "greeting" });
  });

  relay.onPrompt((ev) => {
    if (!ev.last) return; // do nothing on partial speech

    log.info(`relay.prompt`, `"${ev.voicePrompt}"`);

    store.addHumanText({ content: ev.voicePrompt }); // add a record to the local store with the final transcript
    llm.doCompletion();
  });

  relay.onInterrupt((ev) => {
    log.info(`relay.interrupt`, `human interrupted bot`);

    llm.abort();

    // LLMs generate text responses much faster than the words are spoken to the user. When an interruption occurs, there are messages stored in local state that were not and never will be communicated. These records need to be cleaned up or else the bot will think it said things it did not and the conversation will discombobulate.

    // Step 1: Find the local message record that was interrupted. Convo Relay tells you what chunk of text, typically a sentence or clause, was interrupted. That clause is used to find the interrupted message.
    const interruptedClause = ev.utteranceUntilInterrupt;
    const msgsDecending = store.getMessages().reverse();
    const interruptedMsg = msgsDecending.find(
      (msg) =>
        msg.role === "bot" &&
        msg.type === "text" &&
        msg.content.includes(interruptedClause)
    ) as BotText | undefined;

    // Step 1.5: Ignore short clauses. Using the interruptedClause to find the record that was interrupted is a bit fuzzy. For instance, if the interrupted clause is "Hey.", there could be several messages with the word "Hey." and there is technically no gaurantee that we are redacting the correct message. Hence, short clauses or unmatched clauses are simply not redacted. In practice, this works just fine. Human to human conversations are more confused than this anyhow.
    if (interruptedClause.length < 5 || !interruptedMsg)
      return log.warn(
        "relay.interrupt",
        "unable to find interrupted message",
        ev
      );

    let deletedMsgs: BotMessage[] = []; // used for logging purposes

    // Step 2: Delete messages created after the interrupted message. LLM completions typically happen so quickly that the bot may complete several completions before the first completion is spoken to the user. For instance, the bot may say "Let me lookup your profile. Just one second." and before those two sentences are spoken, it has already fetched the user's profile from the DB and generated the subsequent statement. These records need to be cleaned up.
    msgsDecending
      .filter(
        (msg) =>
          msg.seq > interruptedMsg.seq && // only delete messages after the interrupted messages
          msg.role === "bot" // delete bot messages, both text & tools. note: system messages will not be deleted
      )
      .forEach((msg) => {
        store.deleteMsg(msg.id);
        if (msg.role === "bot") deletedMsgs.push(msg);
      });

    // Step 3: Update the interrupted message to reflect what was actually spoken. Note, sometimes the interruptedClause is very long. The bot may have spoken some or most of it. So, the question is, should the interrupted clause be included or excluded. Here, it is being included but it's a judgement call.
    const curContent = interruptedMsg.content as string;
    const [newContent] = curContent.split(interruptedClause);
    interruptedMsg.content = ` ${newContent} ${interruptedClause}`.trim();

    log.info(
      "relay.interrupt",
      `local state updated to reflect interruption: `,
      [
        `updated ${interruptedMsg.role} ${interruptedMsg.type} to ${interruptedMsg.content}`,
        ...deletedMsgs.map(
          (msg) => `deleted ${msg.role} ${msg.type}, id="${msg.id}"`
        ),
      ].join(". ")
    );
  });
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
