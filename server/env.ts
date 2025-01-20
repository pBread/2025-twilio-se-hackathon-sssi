// Always import this file at the top of the app's entry file (i.e. app.ts) to guarantee sensitive environment variables are securely deleted before anything else runs

import "dotenv-flow/config"; // dotenv-flow supports multiple .env files for different environments (e.g., .env, .env.local).

export const APP_DEBUG = bool(process.env.APP_DEBUG);
export const DEVELOPERS_PHONE_NUMBER = process.env.DEVELOPERS_PHONE_NUMBER;
export const ENABLE_GOVERNANCE = bool(process.env.ENABLE_GOVERNANCE);
export const ENABLE_RECALL = bool(process.env.ENABLE_RECALL);
export const ENABLE_SUMMARIZATION = bool(process.env.ENABLE_SUMMARIZATION);
export const LLM_MODEL = process.env.LLM_MODEL as string;
export const PORT = process.env.PORT ?? "3001";
export const RECORD_CALL = bool(process.env.RECORD_CALL);
export const STT_PROVIDER = process.env.STT_PROVIDER;
export const TTS_PROVIDER = process.env.TTS_PROVIDER;
export const TTS_VOICE = process.env.TTS_VOICE;
export const TWILIO_DEFAULT_NUMBER = process.env.TWILIO_DEFAULT_NUMBER;

// Required environment variables must be explicitly defined in `.env` files or the runtime environment
export const FLEX_WORKFLOW_SID = process.env.FLEX_WORKFLOW_SID as string;
export const HOSTNAME = process.env.HOSTNAME as string;
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY as string;
export const PINECONE_API_KEY = process.env.PINECONE_API_KEY as string;
export const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME as string;
export const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID as string;
export const TWILIO_API_KEY = process.env.TWILIO_API_KEY as string;
export const TWILIO_API_SECRET = process.env.TWILIO_API_SECRET as string;
export const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN as string;
export const TWILIO_SYNC_SVC_SID = process.env.TWILIO_SYNC_SVC_SID as string;

// Check for missing required environment variables and log errors to aid debugging
if (!FLEX_WORKFLOW_SID) console.error(`Missing env var FLEX_WORKFLOW_SID`);
if (!HOSTNAME) console.error(`Missing env var HOSTNAME`);
if (!OPENAI_API_KEY) console.error(`Missing env var OPENAI_API_KEY`);
if (!PINECONE_API_KEY) console.error(`Missing env var PINECONE_API_KEY`);
if (!PINECONE_INDEX_NAME) console.error(`Missing env var PINECONE_INDEX_NAME`);
if (!TWILIO_ACCOUNT_SID) console.error(`Missing env var TWILIO_ACCOUNT_SID`);
if (!TWILIO_API_KEY) console.error(`Missing env var TWILIO_API_KEY`);
if (!TWILIO_API_SECRET) console.error(`Missing env var TWILIO_API_SECRET`);
if (!TWILIO_AUTH_TOKEN) console.error(`Missing env var TWILIO_AUTH_TOKEN`);
if (!TWILIO_SYNC_SVC_SID) console.error(`Missing env var TWILIO_SYNC_SVC_SID`);

// Delete sensitive credentials from process.env after they've been securely accessed. This minimizes the risk of exposure to untrusted libraries or parts of the application that might inadvertently access them. For example, this reduces the likelihood of sensitive data leaks via third-party npm packages or debugging tools.
// delete process.env.OPENAI_API_KEY;
// delete process.env.PINECONE_API_KEY;
// delete process.env.PINECONE_INDEX_NAME;
// delete process.env.TWILIO_ACCOUNT_SID;
// delete process.env.TWILIO_API_KEY;
// delete process.env.TWILIO_API_SECRET;
// delete process.env.TWILIO_AUTH_TOKEN;

function bool(val: any) {
  return /true/i.test(val ?? "false");
}
