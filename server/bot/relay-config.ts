import { STT_PROVIDER, TTS_PROVIDER, TTS_VOICE } from "../env";

export const relayConfig = {
  sttProvider: STT_PROVIDER ?? "deepgram",
  ttsProvider: TTS_PROVIDER ?? "google",
  ttsVoice: TTS_VOICE ?? "en-US-Journey-D",
};
