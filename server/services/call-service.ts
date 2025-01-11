import { Twilio } from "twilio";
import type { RecordingListInstanceCreateOptions } from "twilio/lib/rest/api/v2010/account/call/recording";
import * as env from "../env";

const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = env;
const client = new Twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

export class CallService {
  constructor(public callSid: string) {}

  /**
   * Starts recording the call.
   * @param {RecordingListInstanceCreateOptions} [options] - Options for recording creation.
   * @see https://www.twilio.com/docs/voice/api/recording#create-a-recording-resource
   */
  startRecording = async (options: RecordingListInstanceCreateOptions = {}) => {
    const call = await client
      .calls(this.callSid)
      .recordings.create({ recordingChannels: "dual", ...options });

    if (call.errorCode) return { status: "error", call };

    const mediaUrl = `https://api.twilio.com${call.uri.replace(".json", "")}`;
    return { status: "success", call, mediaUrl };
  };
}
