const fs = require("fs").promises;
const path = require("path");
const twilio = require("twilio");
const dotenv = require("dotenv-flow");

// Utility functions
const logger = {
  info: (...args) => console.log("📝 [INFO]:", ...args),
  success: (...args) => console.log("✅ [SUCCESS]:", ...args),
  error: (...args) => console.error("❌ [ERROR]:", ...args),
  warning: (...args) => console.warn("⚠️ [WARNING]:", ...args),
};

const friendlyName =
  "c-relay-demo-" +
  Math.floor(Math.random() * 1000000)
    .toString()
    .padStart(6, "0");

// File paths
const paths = {
  rootEnv: ".env",
  rootEnvExample: ".env.example",
  uiEnv: "ui/.env",
  uiEnvExample: "ui/.env.example",
  flexPluginConfig: "flex-plugin/public/appConfig.js",
  flexPluginConfigExample: "flex-plugin/public/appConfig.example.js",
};

// Required variables and their validation rules
const requiredVars = {
  TWILIO_ACCOUNT_SID: (value) => {
    if (!value) return "TWILIO_ACCOUNT_SID is required";
    if (!value.startsWith("AC"))
      return 'TWILIO_ACCOUNT_SID must start with "AC"';
    if (value.length !== 34)
      return "TWILIO_ACCOUNT_SID must be 34 characters long";
    if (!/^AC[0-9a-zA-Z]{32}$/.test(value))
      return 'TWILIO_ACCOUNT_SID must contain only alphanumeric characters after "AC"';
    return null;
  },
  TWILIO_AUTH_TOKEN: (value) => {
    if (!value) return "TWILIO_AUTH_TOKEN is required";
    if (value.length !== 32)
      return "TWILIO_AUTH_TOKEN must be 32 characters long";
    if (!/^[0-9a-zA-Z]{32}$/.test(value))
      return "TWILIO_AUTH_TOKEN must contain only alphanumeric characters";
    return null;
  },
  FLEX_WORKFLOW_SID: (value) => {
    if (!value) return "FLEX_WORKFLOW_SID is required";
    return null;
  },
  HOSTNAME: (value) => {
    if (!value) return "HOSTNAME is required";
    if (value.includes("://"))
      return "HOSTNAME should not include protocol (https://)";
    if (value.includes("/")) return "HOSTNAME should not include path";
    if (!/^[a-zA-Z0-9][a-zA-Z0-9-._]+[a-zA-Z0-9]$/.test(value))
      return "Invalid hostname format";
    return null;
  },
  DEVELOPERS_PHONE_NUMBER: (value) => {
    if (!value) return "DEVELOPERS_PHONE_NUMBER is required";
    return null;
  },
  OPENAI_API_KEY: (value) => {
    if (!value) return "OPENAI_API_KEY is required";
    return null;
  },
  PINCONE_API_KEY: (value) => {
    if (!value) return "PINCONE_API_KEY is required";
    return null;
  },
};

// Twilio service creation functions
async function createTwilioAPIKeyAndSecret(
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN
) {
  logger.info("Creating Twilio API Key and Secret...");
  const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  const result = await client.iam.v1.newApiKey.create({
    accountSid: TWILIO_ACCOUNT_SID,
    friendlyName,
  });
  logger.success("Created Twilio API Key and Secret");
  return { TWILIO_API_KEY: result.sid, TWILIO_API_SECRET: result.secret };
}

async function createTwilioSyncService(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN) {
  logger.info("Creating Twilio Sync Service...");
  const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  const result = await client.sync.v1.services.create({ friendlyName });
  logger.success("Created Twilio Sync Service");
  return { TWILIO_SYNC_SVC_SID: result.sid };
}

async function createTwilioServerlessService(
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN
) {
  logger.info("Creating Twilio Serverless Service...");
  const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  const result = await client.serverless.v1.services.create({
    uniqueName: friendlyName,
    friendlyName,
    uiEditable: true,
  });
  logger.success("Created Twilio Serverless Service");
  return { TWILIO_FN_BASE_URL: result.url };
}

// File operations
async function ensureFileExists(sourcePath, targetPath) {
  try {
    await fs.access(targetPath);
    logger.info(`File exists: ${targetPath}`);
  } catch {
    logger.info(`Creating ${targetPath} from ${sourcePath}`);
    await fs.copyFile(sourcePath, targetPath);
    logger.success(`Created ${targetPath}`);
  }
}

async function readEnvFile(filePath) {
  const content = await fs.readFile(filePath, "utf-8");
  return dotenv.parse(content);
}

async function updateEnvFile(filePath, updates) {
  logger.info(`Updating ${filePath}`);
  let content = await fs.readFile(filePath, "utf-8");

  for (const [key, value] of Object.entries(updates)) {
    const regex = new RegExp(`^${key}=.*$`, "m");
    if (content.match(regex)) {
      content = content.replace(regex, `${key}=${value}`);
      logger.info(`Updated existing value for ${key}`);
    } else {
      content += `\n${key}=${value}`;
      logger.info(`Appended new value for ${key}`);
    }
  }

  await fs.writeFile(filePath, content);
  logger.success(`Successfully updated ${filePath}`);
}

async function updateAppConfig(filePath, baseUrl) {
  logger.info("Updating appConfig.js");
  let content = await fs.readFile(filePath, "utf-8");
  content = content.replace(/{{TWILIO_FN_BASE_URL}}/g, baseUrl);
  await fs.writeFile(filePath, content);
  logger.success("Updated appConfig.js");
}

// Main function
async function main() {
  try {
    // 1. Ensure all files exist
    logger.info("Checking for required files...");
    await ensureFileExists(paths.rootEnvExample, paths.rootEnv);
    await ensureFileExists(paths.uiEnvExample, paths.uiEnv);
    await ensureFileExists(
      paths.flexPluginConfigExample,
      paths.flexPluginConfig
    );

    // 2. Read and validate root .env
    logger.info("Reading root .env file");
    const rootEnv = await readEnvFile(paths.rootEnv);

    // Validate required variables
    const errors = [];
    for (const [key, validator] of Object.entries(requiredVars)) {
      const error = validator(rootEnv[key]);
      if (error) errors.push(error);
    }

    if (errors.length > 0) {
      throw new Error("Validation errors:\n" + errors.join("\n"));
    }

    // Auto-populate PINECONE_INDEX_NAME if missing
    if (!rootEnv.PINECONE_INDEX_NAME) {
      logger.info('PINECONE_INDEX_NAME not found, setting to "sample-data"');
      await updateEnvFile(paths.rootEnv, {
        PINECONE_INDEX_NAME: "sample-data",
      });
    }

    // 3. Generate Twilio variables if missing
    const updates = {};

    if (!rootEnv.TWILIO_API_KEY || !rootEnv.TWILIO_API_SECRET) {
      const apiKeyResult = await createTwilioAPIKeyAndSecret(
        rootEnv.TWILIO_ACCOUNT_SID,
        rootEnv.TWILIO_AUTH_TOKEN
      );
      Object.assign(updates, apiKeyResult);
    }

    if (!rootEnv.TWILIO_SYNC_SVC_SID) {
      const syncResult = await createTwilioSyncService(
        rootEnv.TWILIO_ACCOUNT_SID,
        rootEnv.TWILIO_AUTH_TOKEN
      );
      Object.assign(updates, syncResult);
    }

    // 4. Create Function Service if needed
    if (!rootEnv.TWILIO_FN_BASE_URL) {
      const fnResult = await createTwilioServerlessService(
        rootEnv.TWILIO_ACCOUNT_SID,
        rootEnv.TWILIO_AUTH_TOKEN
      );
      Object.assign(updates, fnResult);
    }

    // 5. Update root .env with new values
    if (Object.keys(updates).length > 0) {
      await updateEnvFile(paths.rootEnv, updates);
    }

    // 6. Update UI .env
    const uiEnvVars = {
      TWILIO_ACCOUNT_SID: rootEnv.TWILIO_ACCOUNT_SID,
      TWILIO_API_KEY: rootEnv.TWILIO_API_KEY,
      TWILIO_API_SECRET: rootEnv.TWILIO_API_SECRET,
      TWILIO_SYNC_SVC_SID: rootEnv.TWILIO_SYNC_SVC_SID,
      NEXT_PUBLIC_DEVELOPERS_PHONE_NUMBER: rootEnv.DEVELOPERS_PHONE_NUMBER,
    };
    await updateEnvFile(paths.uiEnv, uiEnvVars);

    // 7. Update appConfig.js
    if (rootEnv.TWILIO_FN_BASE_URL) {
      await updateAppConfig(paths.flexPluginConfig, rootEnv.TWILIO_FN_BASE_URL);
    }

    logger.success("Environment setup completed successfully");
  } catch (error) {
    logger.error("Setup failed:", error.message);
    process.exit(1);
  }
}

main();
