import Twilio from "twilio";
import {
  TWILIO_ACCOUNT_SID,
  TWILIO_API_KEY,
  TWILIO_API_SECRET,
  TWILIO_SYNC_SVC_SID,
} from "../env";
import { pRateLimit } from "p-ratelimit";

const CALL_MAP_NAME = "calls";

const limit = pRateLimit({
  interval: 1000, // 1000 ms == 1 second
  rate: 30, // 30 API calls per interval
  concurrency: 10, // no more than 10 running at once
  maxDelay: 2000, // an API call delayed > 2 sec is rejected
});

const twilio = Twilio(TWILIO_API_KEY, TWILIO_API_SECRET, {
  accountSid: TWILIO_ACCOUNT_SID,
});

export class SyncManager {
  constructor(private callSid: string) {}

  init = async () => {
    const call = { callSid: this.callSid };

    await twilio.sync.v1
      .services(TWILIO_SYNC_SVC_SID)
      .syncMaps(CALL_MAP_NAME)
      .syncMapItems.create({
        key: this.callSid,
        data: call,
      });
  };
}

export async function setupSync() {
  console.log("checking sync setup");
  try {
    await twilio.sync.v1
      .services(TWILIO_SYNC_SVC_SID)
      .syncMaps.create({ uniqueName: CALL_MAP_NAME });
    console.log("sync", "created SyncMap to store Twilio call state");
  } catch (error) {}
}

export function createSyncToken(identity: string) {
  const AccessToken = Twilio.jwt.AccessToken;
  const SyncGrant = AccessToken.SyncGrant;

  const token = new AccessToken(
    TWILIO_ACCOUNT_SID,
    TWILIO_API_KEY,
    TWILIO_API_SECRET,
    { identity }
  );

  token.addGrant(new SyncGrant({ serviceSid: TWILIO_SYNC_SVC_SID }));

  return { identity, token: token.toJwt() };
}
