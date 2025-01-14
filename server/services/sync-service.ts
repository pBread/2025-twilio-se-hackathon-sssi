import { pRateLimit } from "p-ratelimit";
import Twilio from "twilio";
import type { CallRecord, StoreMessage } from "../../shared/entities";
import { mockHistory } from "../../shared/mock-history";
import {
  callMapItemName,
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

/****************************************************
 Call Map Items
****************************************************/
async function addSyncCallItem(call: CallRecord) {
  const key = callMapItemName(call.callSid);
  return syncCallMapApi.syncMapItems.create({
    key,
    data: call,
  });
}

async function updateSyncCallItem(call: CallRecord) {
  const key = callMapItemName(call.callSid);
  return syncCallMapApi.syncMapItems(key).update({ data: call });
}

async function removeSyncCallItem(callSid: string) {
  const key = callMapItemName(callSid);
  return syncCallMapApi.syncMapItems(key).remove();
}

/****************************************************
 Logs
****************************************************/
async function createSyncLogList(callSid: string) {
  const uniqueName = logListName(callSid);
  return sync.syncLists.create({ uniqueName });
}

async function destroySyncLogList(callSid: string) {
  const uniqueName = logListName(callSid);
  return sync.syncLists(uniqueName).remove();
}

async function addSyncLogItem(msg: StoreMessage) {
  const uniqueName = logListName(msg.callSid);
  return sync.syncLists(uniqueName).syncListItems.create({ data: msg });
}

/****************************************************
 Messages
****************************************************/
async function createSyncMsgMap(callSid: string) {
  const uniqueName = msgMapName(callSid);
  return sync.syncMaps.create({ uniqueName });
}

async function destroySyncMsgMap(callSid: string) {
  const uniqueName = msgMapName(callSid);
  return sync.syncMaps(uniqueName).remove();
}

async function addSyncMsgItem(msg: StoreMessage) {
  const uniqueName = msgMapName(msg.callSid);
  return sync
    .syncMaps(uniqueName)
    .syncMapItems.create({ key: msg.id, data: msg });
}

async function updateSyncMsgItem(msg: StoreMessage) {
  const uniqueName = msgMapName(msg.callSid);
  return sync.syncMaps(uniqueName).syncMapItems(msg.id).update({ data: msg });
}

async function removeSyncMsgItem(msg: StoreMessage) {
  const uniqueName = msgMapName(msg.callSid);

  return sync.syncMaps(uniqueName).syncMapItems(msg.id).remove();
}

/****************************************************
 Demo Data Management
****************************************************/
export async function clearSyncData() {}

export async function populateSampleData() {}
