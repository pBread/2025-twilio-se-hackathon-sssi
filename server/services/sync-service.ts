import Twilio from "twilio";
import {
  TWILIO_ACCOUNT_SID,
  TWILIO_API_KEY,
  TWILIO_API_SECRET,
  TWILIO_SYNC_SVC_SID,
} from "../env";
import { pRateLimit } from "p-ratelimit";
import { SYNC_CALL_MAP_NAME, SYNC_DEMO_CONFIG } from "../../shared/constants";
import type { DemoConfiguration, SyncCallData } from "../../shared/entities";
import { mockHistory } from "../../shared/mock-history";

const limit = pRateLimit({
  interval: 1000, // 1000 ms == 1 second
  rate: 30, // 30 API calls per interval
  concurrency: 10, // no more than 10 running at once
  maxDelay: 2000, // an API call delayed > 2 sec is rejected
});

const twilio = Twilio(TWILIO_API_KEY, TWILIO_API_SECRET, {
  accountSid: TWILIO_ACCOUNT_SID,
});

export async function createSyncCall(call: SyncCallData) {
  return limit(async () =>
    twilio.sync.v1
      .services(TWILIO_SYNC_SVC_SID)
      .syncMaps(SYNC_CALL_MAP_NAME)
      .syncMapItems.create({
        key: `${call.from}_${call.callSid}`,
        data: call,
      })
  );
}

export async function updateSyncCall(call: SyncCallData) {
  return limit(async () =>
    twilio.sync.v1
      .services(TWILIO_SYNC_SVC_SID)
      .syncMaps(SYNC_CALL_MAP_NAME)
      .syncMapItems(`${call.from}_${call.callSid}`)
      .update({ data: call })
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

    console.log(`cleaning up sync calls: ${calls.length} records`);

    await Promise.all(
      calls.map(async (call) =>
        limit(async () => {
          await twilio.sync.v1
            .services(TWILIO_SYNC_SVC_SID)
            .syncMaps(SYNC_CALL_MAP_NAME)
            .syncMapItems(call.key)
            .remove();

          await twilio.sync.v1
            .services(TWILIO_SYNC_SVC_SID)
            .syncMaps(SYNC_CALL_MAP_NAME)
            .syncMapItems(call.data.callSid as string)
            .remove();
        })
      )
    );
  } catch (error) {}

  console.log(`sync cleanup complete`);
}
