import { pRateLimit } from "p-ratelimit";
import Twilio from "twilio";
import { SyncClient } from "twilio-sync";
import type {
  CallRecord,
  DemoConfiguration,
  LogRecord,
  StoreMessage,
} from "../../shared/entities";
import { mockHistory } from "../../shared/mock-history";
import {
  callMapItemName,
  isLogListName,
  isMsgMapName,
  logListName,
  msgMapName,
  SYNC_CALL_MAP_NAME,
  SYNC_CONFIG_NAME,
} from "../../shared/sync";
import {
  ENABLE_GOVERNANCE,
  ENABLE_RECALL,
  TWILIO_ACCOUNT_SID,
  TWILIO_API_KEY,
  TWILIO_API_SECRET,
  TWILIO_SYNC_SVC_SID,
} from "../env";
import log from "../logger";
import diff from "deep-diff";
import { relayConfig } from "../bot/relay-config";
import bot from "../bot/conscious";
import governanceBot from "../bot/subconscious/governance";

const limit = pRateLimit({
  interval: 1000, // 1000 ms == 1 second
  rate: 30, // 30 API calls per interval
  concurrency: 10, // no more than 10 running at once
  maxDelay: 2000, // an API call delayed > 2 sec is rejected
});

const twilio = Twilio(TWILIO_API_KEY, TWILIO_API_SECRET, {
  accountSid: TWILIO_ACCOUNT_SID,
});

let syncWsClient: SyncClient | undefined;

const sync = twilio.sync.v1.services(TWILIO_SYNC_SVC_SID);
const syncDemoConfigApi = sync.documents(SYNC_CONFIG_NAME);
const syncCallMapApi = sync.syncMaps(SYNC_CALL_MAP_NAME);

const defaultDemoConfig: DemoConfiguration = {
  ...mockHistory.config,
  relayConfig,
  conscious: {
    instructions: bot.getInstructions(mockHistory.calls[0].callContext),
    tools: bot.tools,
    model: bot.model,
  },
  subconscious: {
    isGovernanceEnabled: ENABLE_GOVERNANCE,
    isRecallEnabled: ENABLE_RECALL,
    governanceInstructions: governanceBot.getInstructions(
      mockHistory.calls[0].callContext
    ),
  },
};

export let demoConfig: DemoConfiguration = JSON.parse(
  JSON.stringify(defaultDemoConfig)
); // to do: update with data from demo

/****************************************************
 Setup Sync
****************************************************/
export async function setupSync() {
  console.log("setting up sync");

  try {
    await limit(() =>
      sync.documents.create({
        uniqueName: SYNC_CONFIG_NAME,
        data: demoConfig,
      })
    );

    console.log("created sync document for demo config");
  } catch (error) {}

  try {
    await limit(() => sync.syncMaps.create({ uniqueName: SYNC_CALL_MAP_NAME }));
    console.log("created sync map to store call details");
  } catch (error) {}

  try {
    console.log("sync websocket client initializing");
    await initSyncClient();
    console.log("sync websocket client connected");
  } catch (error) {}
}

async function initSyncClient() {
  const identity =
    "server-" +
    Math.floor(Math.random() * 9999)
      .toString()
      .padStart(4, "0");

  const token = createSyncToken(identity);

  syncWsClient = new SyncClient(token.token);

  syncWsClient.on("tokenAboutToExpire", () =>
    syncWsClient?.updateToken(createSyncToken(identity).token)
  );

  await syncWsClient
    .document(SYNC_CONFIG_NAME)
    .then((doc) => {
      demoConfig = doc.data as DemoConfiguration;

      doc.on("updated", (ev) => {
        const delta = diff(demoConfig, ev.data);
        const kind = {
          A: "array change",
          D: "deleted",
          E: "edited",
          N: "New",
        };

        if (delta)
          log.info(
            "sync",
            `demo configuration updated:`,
            delta
              .map((item) => `(${kind[item.kind]} ${item.path?.join(".")})`)
              .join(",")
          );

        demoConfig = ev.data;
      });
    })
    .catch();

  syncWsClient?.on("connectionStateChanged", (state) => {
    log.info("sync", `sync websocket client status: ${state}`);
  });
}

function createSyncToken(identity: string) {
  const AccessToken = Twilio.jwt.AccessToken;
  const SyncGrant = AccessToken.SyncGrant;

  const token = new AccessToken(
    TWILIO_ACCOUNT_SID,
    TWILIO_API_KEY,
    TWILIO_API_SECRET,
    { identity }
  );

  token.addGrant(
    new SyncGrant({ serviceSid: process.env.TWILIO_SYNC_SVC_SID })
  );

  return { identity, token: token.toJwt() };
}

/****************************************************
 Higher Level
****************************************************/
export async function initCall(call: CallRecord) {
  console.log("init call", call.callSid);
  await createSyncLogList(call.callSid)
    .then(() => console.log("createSyncLogList success"))
    .catch((err) => console.error("createSyncLogList error", err));

  await createSyncMsgMap(call.callSid)
    .then(() => console.log("createSyncMsgMap success"))
    .catch((err) => console.error("createSyncMsgMap error", err));

  await addSyncCallItem(call)
    .then(() => console.log("addSyncCallItem success"))
    .catch((err) => console.error("addSyncCallItem error", err));
}

async function destroyCall(callSid: string) {
  await limit(() =>
    destroySyncLogList(callSid)
      .then(() => console.log(`destroySyncLogList success ${callSid}`))
      .catch((err) => console.error("destroySyncLogList error", err))
  );

  await limit(() =>
    destroySyncMsgMap(callSid)
      .then(() => console.log(`destroySyncMsgMap success ${callSid}`))
      .catch((err) => console.error("destroySyncMsgMap error", err))
  );

  await limit(() =>
    removeSyncCallItem(callSid)
      .then(() => console.log(`removeSyncCallItem success ${callSid}`))
      .catch((err) => console.error("removeSyncCallItem error", err))
  );
}

/****************************************************
 Demo Configuration
****************************************************/
async function updateDemoConfig(config: DemoConfiguration) {
  return limit(() => syncDemoConfigApi.update({ data: config }));
}

/****************************************************
 Call Map Items
****************************************************/
async function addSyncCallItem(call: CallRecord) {
  const key = callMapItemName(call.callSid);
  return limit(() =>
    syncCallMapApi.syncMapItems.create({
      key,
      data: call,
    })
  );
}

async function getAllCallItems() {
  return limit(() =>
    syncCallMapApi.syncMapItems
      .list()
      .then((res) => res.map((item) => item.data) as CallRecord[])
  );
}

async function getCallItem(callSid: string) {
  const key = callMapItemName(callSid);
  return limit(() =>
    syncCallMapApi
      .syncMapItems(key)
      .fetch()
      .then((res) => res.data as CallRecord)
  );
}

async function updateSyncCallItem(call: CallRecord) {
  const key = callMapItemName(call.callSid);
  return limit(() => syncCallMapApi.syncMapItems(key).update({ data: call }));
}

async function removeSyncCallItem(callSid: string) {
  const key = callMapItemName(callSid);
  return limit(() => syncCallMapApi.syncMapItems(key).remove());
}

/****************************************************
 Logs
****************************************************/
async function getAllSyncLogLists() {
  const items = await limit(() => sync.syncLists.list());
  return items.filter((item) => isLogListName(item.uniqueName));
}

export async function getCallLogs(callSid: string) {
  const uniqueName = logListName(callSid);
  return limit(() =>
    sync
      .syncLists(uniqueName)
      .syncListItems.list()
      .then((res) => res.map((item) => item.data) as LogRecord[])
  );
}

async function createSyncLogList(callSid: string) {
  const uniqueName = logListName(callSid);
  return limit(() => sync.syncLists.create({ uniqueName }));
}

async function destroySyncLogList(callSid: string) {
  const uniqueName = logListName(callSid);
  return limit(() => sync.syncLists(uniqueName).remove());
}

async function addSyncLogItem(log: LogRecord) {
  const uniqueName = logListName(log.callSid);
  return limit(() =>
    sync.syncLists(uniqueName).syncListItems.create({ data: log })
  );
}

/****************************************************
 Messages
****************************************************/
async function getAllSyncMsgMaps() {
  const maps = await limit(() => sync.syncMaps.list());
  return maps.filter((item) => isMsgMapName(item.uniqueName));
}

export async function getCallMessages(callSid: string) {
  const uniqueName = msgMapName(callSid);
  return limit(() =>
    sync
      .syncMaps(uniqueName)
      .syncMapItems.list()
      .then((res) => res.map((item) => item.data))
  );
}

async function createSyncMsgMap(callSid: string) {
  const uniqueName = msgMapName(callSid);
  return limit(() => sync.syncMaps.create({ uniqueName }));
}

async function destroySyncMsgMap(callSid: string) {
  const uniqueName = msgMapName(callSid);
  return limit(() => sync.syncMaps(uniqueName).remove());
}

async function addSyncMsgItem(msg: StoreMessage) {
  const uniqueName = msgMapName(msg.callSid);
  return limit(() =>
    sync.syncMaps(uniqueName).syncMapItems.create({ key: msg.id, data: msg })
  );
}

async function updateSyncMsgItem(msg: StoreMessage) {
  const uniqueName = msgMapName(msg.callSid);
  return limit(() =>
    sync.syncMaps(uniqueName).syncMapItems(msg.id).update({ data: msg })
  );
}

async function removeSyncMsgItem(msg: StoreMessage) {
  const uniqueName = msgMapName(msg.callSid);

  return limit(() => sync.syncMaps(uniqueName).syncMapItems(msg.id).remove());
}

/****************************************************
 Demo Data Management
****************************************************/
export async function clearSyncData() {
  console.log("clearSyncData");

  demoConfig = JSON.parse(JSON.stringify(defaultDemoConfig));

  await updateDemoConfig(demoConfig);

  const calls = await getAllCallItems();
  await Promise.all(calls.map((call) => destroyCall(call.callSid)));

  const logLists = await getAllSyncLogLists();
  await Promise.all(
    logLists.map((list) => destroySyncLogList(list.uniqueName))
  );
  const msgMaps = await getAllSyncMsgMaps();
  await Promise.all(msgMaps.map((map) => destroySyncLogList(map.uniqueName)));
}

export async function populateSampleData() {
  console.log("populateSampleData");

  await updateDemoConfig(demoConfig);

  await Promise.all(mockHistory.calls.map(initCall)).then(() =>
    console.log("populated call records")
  );
  await Promise.all(
    Object.values(mockHistory.callLogs).flat().map(addSyncLogItem)
  ).then(() => console.log("populated call logs"));
  await Promise.all(
    Object.values(mockHistory.callMessages).flat().map(addSyncMsgItem)
  ).then(() => console.log("populated messages"));
}
