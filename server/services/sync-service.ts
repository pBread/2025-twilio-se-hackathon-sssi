import { pRateLimit } from "p-ratelimit";
import Twilio from "twilio";
import { SYNC_CALL_MAP_NAME, SYNC_DEMO_CONFIG } from "../../shared/constants";
import type { StoreMessage, CallData } from "../../shared/entities";
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

export async function addSyncCall(call: CallData) {
  return limit(async () => {
    await twilio.sync.v1
      .services(TWILIO_SYNC_SVC_SID)
      .syncMaps(SYNC_CALL_MAP_NAME)
      .syncMapItems.create({
        key: call.callSid,
        data: call,
      });

    await twilio.sync.v1
      .services(TWILIO_SYNC_SVC_SID)
      .syncMaps.create({ uniqueName: call.callSid });
  });
}

export async function updateSyncCall(call: CallData) {
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

export async function setupSync() {
  console.log("checking sync setup");
  try {
    await limit(() =>
      twilio.sync.v1.services(TWILIO_SYNC_SVC_SID).documents.create({
        uniqueName: SYNC_DEMO_CONFIG,
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
    const calls = await limit(() =>
      twilio.sync.v1
        .services(TWILIO_SYNC_SVC_SID)
        .syncMaps(SYNC_CALL_MAP_NAME)
        .syncMapItems.list()
    );

    console.log(`cleaning up ${calls.length} calls`);

    await Promise.all(
      calls.map(async (call) =>
        limit(async () => {
          await twilio.sync.v1
            .services(TWILIO_SYNC_SVC_SID)
            .syncMaps(SYNC_CALL_MAP_NAME)
            .syncMapItems(call.key as string)
            .remove();

          await twilio.sync.v1
            .services(TWILIO_SYNC_SVC_SID)
            .syncMaps(call.data.callSid)
            .syncMapItems(call.data.id as string)
            .remove();
        })
      )
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
        .documents(SYNC_DEMO_CONFIG)
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
            console.log("failed to create sync call ", call);
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
  } catch (error) {}
}
