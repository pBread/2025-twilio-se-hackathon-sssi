import { pRateLimit } from "p-ratelimit";
import Twilio from "twilio";
import type {
  CallRecord,
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
  TWILIO_ACCOUNT_SID,
  TWILIO_API_KEY,
  TWILIO_API_SECRET,
  TWILIO_SYNC_SVC_SID,
} from "../env";

const limit = pRateLimit({
  interval: 1000, // 1000 ms == 1 second
  rate: 30, // 30 API calls per interval
  concurrency: 10, // no more than 10 running at once
  maxDelay: 2000, // an API call delayed > 2 sec is rejected
});

const twilio = Twilio(TWILIO_API_KEY, TWILIO_API_SECRET, {
  accountSid: TWILIO_ACCOUNT_SID,
});

const sync = twilio.sync.v1.services(TWILIO_SYNC_SVC_SID);
const syncConfigApi = sync.documents(SYNC_CONFIG_NAME);
const syncCallMapApi = sync.syncMaps(SYNC_CALL_MAP_NAME);

/****************************************************
 Setup Sync
****************************************************/
export async function setupSync() {
  console.log("setting up sync");
  try {
    await limit(() =>
      sync.documents.create({
        uniqueName: SYNC_CONFIG_NAME,
        data: mockHistory.config, // to do: update with data from demo
      })
    );

    console.log("created sync document for demo config");
  } catch (error) {}

  try {
    await limit(() => sync.syncMaps.create({ uniqueName: SYNC_CALL_MAP_NAME }));
    console.log("created sync map to store call details");
  } catch (error) {}
}

/****************************************************
 Higher Level
****************************************************/
async function initCall(call: CallRecord) {
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
