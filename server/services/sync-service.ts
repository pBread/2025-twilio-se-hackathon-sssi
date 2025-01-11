import Twilio from "twilio";
import {
  TWILIO_ACCOUNT_SID,
  TWILIO_API_KEY,
  TWILIO_API_SECRET,
  TWILIO_SYNC_SVC_SID,
} from "../env";

const CALL_MAP_NAME = "calls";

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
