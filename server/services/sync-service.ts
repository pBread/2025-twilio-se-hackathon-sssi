import { pRateLimit } from "p-ratelimit";
import Twilio from "twilio";
import { SYNC_CALL_MAP_NAME, SYNC_CONFIG_NAME } from "../../shared/constants";
import type {
  StoreMessage,
  CallRecord,
  LogRecord,
} from "../../shared/entities";
import { mockHistory } from "../../shared/mock-history";
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

export async function addSyncCall(call: CallRecord) {
  return limit(async () => {
    await twilio.sync.v1
      .services(TWILIO_SYNC_SVC_SID)
      .syncMaps(SYNC_CALL_MAP_NAME)
      .syncMapItems.create({
        key: call.callSid,
        data: call,
      })
      .catch((err) =>
        console.log(`could not create syncCallMapItem: ${call.callSid}`, err)
      );

    await twilio.sync.v1
      .services(TWILIO_SYNC_SVC_SID)
      .syncMaps.create({ uniqueName: call.callSid })
      .catch((err) =>
        console.log(
          `could not create syncMap for messages: ${call.callSid}`,
          err
        )
      );

    await twilio.sync.v1
      .services(TWILIO_SYNC_SVC_SID)
      .syncLists.create({ uniqueName: call.callSid })
      .catch((err) =>
        console.log(`could not create syncList for logs: ${call.callSid}`, err)
      );
  });
}

export async function removeSyncCallItem(callSid: string) {
  try {
    await limit(async () =>
      twilio.sync.v1
        .services(TWILIO_SYNC_SVC_SID)
        .syncMaps(SYNC_CALL_MAP_NAME)
        .syncMapItems(callSid)
        .remove()
    );
  } catch (error) {}
}

export async function obliterateSyncCall(callSid: string) {
  await removeSyncCallItem(callSid);
  await removeSyncCallMsgMap(callSid);
  await removeSyncLogsList(callSid);
}

export async function updateSyncCall(call: CallRecord) {
  return limit(async () =>
    twilio.sync.v1
      .services(TWILIO_SYNC_SVC_SID)
      .syncMaps(SYNC_CALL_MAP_NAME)
      .syncMapItems(call.callSid)
      .update({ data: call })
  );
}

export async function addSyncCallMsg(msg: StoreMessage) {
  return limit(async () =>
    twilio.sync.v1
      .services(TWILIO_SYNC_SVC_SID)
      .syncMaps(msg.callSid)
      .syncMapItems.create({ key: msg.id, data: msg })
  );
}

export async function updateSyncCallMsg(msg: StoreMessage) {
  return limit(async () =>
    twilio.sync.v1
      .services(TWILIO_SYNC_SVC_SID)
      .syncMaps(msg.callSid)
      .syncMapItems(msg.id)
      .update({ data: msg })
  );
}

export async function removeSyncCallMsg(msg: StoreMessage) {
  return limit(async () =>
    twilio.sync.v1
      .services(TWILIO_SYNC_SVC_SID)
      .syncMaps(msg.callSid)
      .syncMapItems(msg.id)
      .remove()
  );
}

export async function removeSyncCallMsgMap(callSid: string) {
  return limit(async () => {
    const msgMap = await twilio.sync.v1
      .services(TWILIO_SYNC_SVC_SID)
      .syncMaps(callSid)
      .fetch();

    await twilio.sync.v1
      .services(TWILIO_SYNC_SVC_SID)
      .syncMaps(msgMap.sid)
      .remove();
  });
}

export async function addSyncLog(log: LogRecord) {
  return limit(async () =>
    twilio.sync.v1
      .services(TWILIO_SYNC_SVC_SID)
      .syncLists(log.callSid)
      .syncListItems.create({ data: log })
  );
}

export async function removeSyncLogsList(callSid: string) {
  return limit(async () => {
    const logList = await twilio.sync.v1
      .services(TWILIO_SYNC_SVC_SID)
      .syncLists(callSid)
      .fetch();

    await twilio.sync.v1
      .services(TWILIO_SYNC_SVC_SID)
      .syncLists(logList.sid)
      .remove();
  });
}

export async function setupSync() {
  console.log("checking sync setup");
  try {
    await limit(() =>
      twilio.sync.v1.services(TWILIO_SYNC_SVC_SID).documents.create({
        uniqueName: SYNC_CONFIG_NAME,
        data: mockHistory.config, // to do: update with data from demo
      })
    );
    console.log("sync", "created Sync Document to store demo config");
  } catch (error) {}

  try {
    await limit(() =>
      twilio.sync.v1
        .services(TWILIO_SYNC_SVC_SID)
        .syncMaps.create({ uniqueName: SYNC_CALL_MAP_NAME })
    );
    console.log("sync", "created SyncMap to store Twilio call state");
  } catch (error) {}
}

export async function clearSyncData() {
  console.log("sync cleanup starting");

  try {
    console.log("delete call map items");
    const calls = await limit(() =>
      twilio.sync.v1
        .services(TWILIO_SYNC_SVC_SID)
        .syncMaps(SYNC_CALL_MAP_NAME)
        .syncMapItems.list()
    );

    await Promise.all(
      calls.map((call) => obliterateSyncCall(call.data.callSid))
    );
  } catch (error) {}

  console.log(`sync cleanup complete`);
}

export async function populateSampleData() {
  try {
    console.log("resetting demo configuration");

    await limit(() =>
      twilio.sync.v1
        .services(TWILIO_SYNC_SVC_SID)
        .documents(SYNC_CONFIG_NAME)
        .update({ data: mockHistory.config })
    );
  } catch (error) {}

  try {
    console.log("populating calls");

    await Promise.all(
      mockHistory.calls.map((call) =>
        limit(async () => {
          try {
            await addSyncCall(call);
          } catch (error) {
            console.log("failed to create sync call ", call.callSid);
            console.error(error);
          }
        })
      )
    );
  } catch (error) {}

  try {
    console.log("populating call messages");
    await Promise.all(
      Object.values(mockHistory.callMessages)
        .flat()
        .map((msg) => addSyncCallMsg(msg))
    );
  } catch (error) {
    console.log("failed to add sync call message ");
    console.error(error);
  }

  try {
    console.log("populating call logs");
    await Promise.all(
      Object.values(mockHistory.callLogs)
        .flat()
        .map((msg) => addSyncLog(msg))
    );
  } catch (error) {
    console.log("failed to add sync call logs ");
    console.error(error);
  }
}
