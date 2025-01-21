const { Twilio } = require("twilio");
const dotenv = require("dotenv");
const fs = require("fs").promises;
const kebabCase = require("lodash.kebabcase");
const path = require("path");
const readline = require("readline");

let tIdx = 0;
const log = makeLogger();
let twlo;

/****************************************************
 Files
****************************************************/
const cwd = process.cwd();
const paths = {
  env: path.join(cwd, ".env"),
  _env: path.join(cwd, ".env.example"),

  ui: path.join(cwd, "ui", ".env"),
  _ui: path.join(cwd, "ui", ".env.example"),

  flex: path.join(cwd, "flex-plugin", "public", "appConfig.js"),
  _flex: path.join(cwd, "flex-plugin", "public", "appConfig.example.js"),

  fns: path.join(cwd, "serverless", ".env"),
  _fns: path.join(cwd, "serverless", ".env.example"),
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const askQuestion = (query) =>
  new Promise((resolve) =>
    rl.question(pad(query) + "\t", (answer) => resolve(answer))
  );

/****************************************************
 State
****************************************************/
let friendlyName = "c-relay-script-" + randStr();

let root = {
  // Required to run setup
  HOSTNAME: null,
  TWILIO_ACCOUNT_SID: null,
  TWILIO_AUTH_TOKEN: null,
  FLEX_WORKFLOW_SID: null,
  DEVELOPERS_PHONE_NUMBER: null,
  TWILIO_DEFAULT_NUMBER: null,
  OPENAI_API_KEY: null,
  PINECONE_API_KEY: null,
  PINECONE_INDEX_NAME: null,

  // Optional: will be created if not included
  TWILIO_API_KEY: null,
  TWILIO_API_SECRET: null,
  TWILIO_FN_BASE_URL: null,
  TWILIO_SYNC_SVC_SID: null,

  // Not important to script
  LLM_MODEL: null,
  RECORD_CALL: null,
  STT_PROVIDER: null,
  TTS_PROVIDER: null,
  TTS_VOICE: null,
  ENABLE_GOVERNANCE: null,
  ENABLE_RECALL: null,
  ENABLE_SUMMARIZATION: null,
  LOG_FILE_LIMIT: null,
};

async function main() {
  const name = (await askQuestion("What is your name? (Optional)"))?.trim();
  if (name.length) {
    friendlyName = kebabCase(`${name}-convo-relay-${randStr()}`).toLowerCase();
    log.info(`The friendlyName of created services will be: ${friendlyName}`);
  }

  log.title("Checking Required Files");
  await checkOrCreateFile(paths.env, paths._env);
  await checkOrCreateFile(paths.flex, paths._flex);
  await checkOrCreateFile(paths.fns, paths._fns);
  await checkOrCreateFile(paths.ui, paths._ui);

  root = mapObj(root, readEnv(paths.env));
  log.success("All required env files exist");

  // validate Twilio credentials
  log.title("Validating Required Variables");

  const sidErr = checkAccountSid(root.TWILIO_ACCOUNT_SID);
  const tokenErr = checkAuthToken(root.TWILIO_AUTH_TOKEN);
  if (sidErr || tokenErr) {
    log.error("Invalid Twilio Credentials");
    throw Error([sidErr, tokenErr].filter(Boolean).join(", "));
  }
  twlo = new Twilio(root.TWILIO_ACCOUNT_SID, root.TWILIO_AUTH_TOKEN);
  await validateTwilioAccount();

  // check other required vars
  log.info("Validating other required variables");
  validateObj(root, "FLEX_WORKFLOW_SID", "OPENAI_API_KEY");
  validateHostname(root.HOSTNAME);

  log.success("All required env variables exist");

  log.title("Checking or Creating Required Twilio Items");

  const hasApiKey = !checkMissing(root, "TWILIO_API_KEY", "TWILIO_API_SECRET")
    .length;

  if (hasApiKey) await validateApiKey(root);
  else {
    const res = await createAPIKeyAndSecret();
    root.TWILIO_API_KEY = res.TWILIO_API_KEY;
    root.TWILIO_API_SECRET = res.TWILIO_API_SECRET;
    await updateEnvFile(
      paths.env,
      pick(root, "TWILIO_API_KEY", "TWILIO_API_SECRET")
    );
    log.success(`Twilio API Key Setup Complete`);
  }

  if (root.TWILIO_SYNC_SVC_SID) await validateSyncService();
  else {
    const svc = await createSyncService();
    root.TWILIO_SYNC_SVC_SID = svc.sid;
    await updateEnvFile(paths.env, pick(root, "TWILIO_SYNC_SVC_SID"));
  }

  if (root.TWILIO_DEFAULT_NUMBER) await setupDefaultNumber();

  if (!root.TWILIO_DEFAULT_NUMBER) {
    const runSetup = await askQuestion(
      "TWILIO_DEFAULT_NUMBER is not defined. Would you like to purchase a new phone number? (y/n)"
    );

    if (runSetup.includes("y")) {
      const pn = await buyTwilioPhone();
      root.TWILIO_DEFAULT_NUMBER = pn.phoneNumber;
      await updateEnvFile(paths.env, pick(root, "TWILIO_DEFAULT_NUMBER"));
      await setupDefaultNumber();
    }
  }

  if (!root.DEVELOPERS_PHONE_NUMBER)
    log.warn(
      "Missing env variable: DEVELOPERS_PHONE_NUMBER. Your demo will not recognize you when you call into the bot."
    );

  log.title("Checking Misc");
  let hasPinecone = !!root.PINECONE_API_KEY?.length;
  if (hasPinecone && !root.PINECONE_INDEX_NAME) {
    // set default for PINECONE_INDEX_NAME
    log.info(`Setting default PINECONE_INDEX_NAME to "sample-data"`);
    root.PINECONE_INDEX_NAME = "sample-data";
    await updateEnvFile(paths.env, pick(root, "PINECONE_INDEX_NAME"));
  }

  if (hasPinecone && root.ENABLE_RECALL?.toLowerCase() !== "true")
    log.warn(
      `PINECONE_API_KEY is included in env variables, but ENABLE_RECALL is false. You must set ENABLE_RECALL to enable these capabilities.`
    );

  if (!hasPinecone)
    log.warn(`Missing PINECONE_API_KEY. Vector DB services will be disabled.`);

  log.title("Updating Nested Env Variable Files");
  log.info("Updating ui environment variables");
  updateEnvFile(
    paths.ui,
    pick(
      root,
      "DEVELOPERS_PHONE_NUMBER",
      "OPENAI_API_KEY",
      "PINECONE_API_KEY",
      "PINECONE_INDEX_NAME",
      "TWILIO_ACCOUNT_SID",
      "TWILIO_API_KEY",
      "TWILIO_API_SECRET",
      "TWILIO_SYNC_SVC_SID"
    )
  );

  log.info("Updating serverless environment variables");
  updateEnvFile(
    paths.fns,
    pick(root, "TWILIO_API_KEY", "TWILIO_API_SECRET", "TWILIO_SYNC_SVC_SID")
  );

  log.info("Updating flex-plugin environment variables");
  if (root.TWILIO_FN_BASE_URL) updateAppConfig();
  else
    log.warn(
      "TWILIO_FN_BASE_URL is not defined. You will need to follow the instructions in the README to deploy the serverless function, update root .env file and rerun this script."
    );

  // end
  rl.close();
}

main();

/****************************************************
 Twilio
****************************************************/
async function createAPIKeyAndSecret() {
  log.info("Creating Twilio API Key and Secret...");
  const result = await twlo.iam.v1.keys.create({
    accountSid: root.TWILIO_ACCOUNT_SID,
    friendlyName,
  });
  log.success("Created Twilio API Key and Secret");
  return { TWILIO_API_KEY: result.sid, TWILIO_API_SECRET: result.secret };
}

/****************************************************
 Validation
****************************************************/
async function checkOrCreateFile(target, example) {
  const pTarget = prettyFileName(target);
  const pExample = prettyFileName(example);

  try {
    await fs.access(target);
  } catch {
    log.info(`Copying ${pExample} to ${pTarget}`);
    await fs.copyFile(example, target);
    log.success(`Created ${pTarget}`);
  }
}

function checkAccountSid(str) {
  if (!str) return `TWILIO_ACCOUNT_SID is missing`;
  if (!str.startsWith("AC")) return 'TWILIO_ACCOUNT_SID must start with "AC"';
  if (str.length !== 34) return "TWILIO_ACCOUNT_SID must be 34 characters long";
  if (!/^AC[0-9a-zA-Z]{32}$/.test(str))
    return "Invalid TWILIO_ACCOUNT_SID format";
  return null;
}

function checkAuthToken(str) {
  if (!str) return "TWILIO_AUTH_TOKEN is missing";
  if (str.length !== 32) return "TWILIO_AUTH_TOKEN must be 32 characters long";
  if (!/^[0-9a-zA-Z]{32}$/.test(str)) return "Invalid TWILIO_AUTH_TOKEN format";
  return null;
}

async function validateTwilioAccount() {
  try {
    const account = await twlo.api.account.fetch();
    log.success(`Twilio account found: "${account.friendlyName}"`);
  } catch (error) {
    log.error(`Twilio account not found. Invalid credentials.`);
    throw error;
  }
}

function checkMissing(obj, ...required) {
  const missing = required.filter((key) => !(key in obj) || !obj[key]?.length);
  return missing;
}

function validateObj(obj, ...required) {
  const missing = checkMissing(obj, ...required);

  if (!missing.length) return;

  throw new Error("Missing required variables: " + missing.join(", "));
}

function validateHostname(str) {
  if (!str) throw Error("HOSTNAME is required");
  if (str.includes("://"))
    throw Error("HOSTNAME should not include protocol (https://)");
  if (str.includes("/")) throw Error("HOSTNAME should not include path");
  if (!/^[a-zA-Z0-9][a-zA-Z0-9-._]+[a-zA-Z0-9]$/.test(str))
    throw Error("Invalid hostname format");
}

async function validateApiKey({
  TWILIO_ACCOUNT_SID: accountSid,
  TWILIO_API_KEY: apiKey,
  TWILIO_API_SECRET: apiSecret,
}) {
  try {
    log.info("Validating TWILIO_API_KEY & TWILIO_API_SECRET");
    const client = new Twilio(apiKey, apiSecret, { accountSid });
    await client.messages.list({ limit: 1 });

    log.success("Valid Twilio API Keys");
  } catch (error) {
    log.error("Invalid Twilio API Key &/or Secret");
    console.error(error);
    return false;
  }
}

async function validateSyncService() {
  try {
    const svc = await twlo.sync.v1.services(root.TWILIO_SYNC_SVC_SID).fetch();
    if (svc.friendlyName)
      log.success(`Found Sync Service "${svc.friendlyName}"`);
    else throw Error("Twilio Sync Service SID not found in account");
  } catch (error) {
    log.error(
      `Twilio Sync Service not found. TWILIO_SYNC_SVC_SID=${root.TWILIO_SYNC_SVC_SID}`
    );
    throw error;
  }
}

async function createSyncService() {
  try {
    log.info("Creating Sync Service...");
    const svc = await twlo.sync.v1.services.create({ friendlyName });
    log.success(
      `Created new Sync Service with friendlyName "${svc.friendlyName}"`
    );
    return svc;
  } catch (error) {
    log.error("Failed to create Sync Service");
    throw error;
  }
}

async function buyTwilioPhone() {
  try {
    log.info("Buying Twilio phone number");
    const available = await twlo
      .availablePhoneNumbers("US")
      .local.list({ limit: 1 });

    if (!available || !available[0]) throw Error("No phone numbers found");

    const [pn] = available;

    const incomingPn = await twlo.incomingPhoneNumbers.create({
      phoneNumber: pn.phoneNumber,
    });
    log.success(`Purchased Twilio Phone Number ${pn.phoneNumber}`);
    return incomingPn;
  } catch (error) {
    log.error(
      "Failed to purchase a default phone number. You must go into your Twilio Console, buy a phone number, and configure the phone number's webhooks"
    );
  }
}

async function setupDefaultNumber() {
  try {
    log.info("Checking TWILIO_DEFAULT_NUMBER");
    const [pn] = await twlo.incomingPhoneNumbers.list({
      phoneNumber: root.TWILIO_DEFAULT_NUMBER,
    });

    if (!pn)
      throw Error(`Could not find a record for ${root.TWILIO_DEFAULT_NUMBER}`);

    const statusCallback = `https://${root.HOSTNAME}/call-status`;
    const statusCallbackMethod = "POST";
    const voiceMethod = "POST";
    const voiceUrl = `https://${root.HOSTNAME}/call-handler`;

    const isAlreadySetup =
      pn.statusCallback === statusCallback &&
      pn.statusCallbackMethod === statusCallbackMethod &&
      pn.voiceMethod === voiceMethod &&
      pn.voiceUrl === voiceUrl;

    if (isAlreadySetup) {
      log.success(
        `TWILIO_DEFAULT_NUMBER (${root.TWILIO_DEFAULT_NUMBER}) is configured properly.`
      );
    } else {
      log.info("Updating TWILIO_DEFAULT_NUMBER voiceUrl & statusCallback");
      await twlo.incomingPhoneNumbers(pn.sid).update({
        statusCallback,
        statusCallbackMethod,
        voiceMethod,
        voiceUrl,
      });
      log.success(
        `Configured webhooks on TWILIO_DEFAULT_NUMBER (${pn.phoneNumber}).`
      );
    }
  } catch (error) {
    log.error("Phone Number Setup Failed");
    throw error;
  }
}

/****************************************************
 File Helpers
****************************************************/
function readEnv(file) {
  const result = dotenv.config({ path: file });

  if (result.error) {
    log.error(`Unable to read env file: ${file}`);
    throw result.error;
  }

  log.info(`Loaded env file: ${prettyFileName(file)}`);
  return result.parsed;
}

async function updateEnvFile(file, updates) {
  const pFile = prettyFileName(file);
  try {
    let content = await fs.readFile(file, "utf-8");

    // Ensure content ends with newline
    if (content && !content.endsWith("\n")) content += "\n";

    // Process each update
    for (const [key, value] of Object.entries(updates)) {
      // Escape special regex characters in key
      const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`^${escapedKey}=.*$`, "m");

      // Format the value properly
      const formattedValue = value.includes(" ") ? `"${value}"` : value;

      if (regex.test(content)) {
        content = content.replace(regex, `${key}=${formattedValue}`);
      } else {
        content = content.trimEnd() + "\n" + `${key}=${formattedValue}` + "\n";
      }
    }

    // Write back to file
    await fs.writeFile(file, content);
    log.info(
      `Updated ${pFile} with variables: ${Object.keys(updates).join(", ")}`
    );

    return true;
  } catch (error) {
    console.error(`Error updating ${pFile}:`, error);
    throw error;
  }
}

async function updateAppConfig() {
  log.info("Updating appConfig.js");
  let content = await fs.readFile(paths.flex, "utf-8");
  content = content.replace(/{{TWILIO_FN_BASE_URL}}/g, root.TWILIO_FN_BASE_URL);
  await fs.writeFile(paths.flex, content);
  log.success("Updated appConfig.js");
}

/****************************************************
 Misc
****************************************************/
function makeLogger() {
  return {
    info: (...args) =>
      console.log("\x1b[0m" + pad("[INFO]"), ...args, "\x1b[0m"),
    success: (...args) =>
      console.log("\x1b[32m" + pad("[SUCCESS]"), ...args, "\x1b[0m"),
    error: (...args) =>
      console.error("\x1b[31m" + pad("[ERROR]"), ...args, "\x1b[0m"),
    warn: (...args) =>
      console.warn("\x1b[33m" + pad("[WARNING]"), ...args, "\x1b[0m"),
    title: (title) =>
      console.log(
        `\x1b[1;7m${tIdx++ ? "\n" : ""}${title.padEnd(50, " ")}\x1b[0m`
      ),
  };
}

function mapObj(a, b) {
  return Object.fromEntries(
    Object.entries(a).map(([key, curVal]) => [key, b[key] ?? curVal])
  );
}

function pad(str) {
  return str.padEnd(10, " ");
}

function pick(obj, ...keys) {
  return Object.fromEntries(keys.map((key) => [key, obj[key]]));
}

function randStr(len = 8) {
  return Math.floor(Math.random() * 10 ** len)
    .toString()
    .padStart(len, "0");
}

function prettyFileName(file) {
  return file.replace(cwd + "/", "");
}
