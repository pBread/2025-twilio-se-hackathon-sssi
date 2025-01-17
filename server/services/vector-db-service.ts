import { IndexModel, Pinecone } from "@pinecone-database/pinecone";
import OpenAI from "openai";
import log from "../logger";
import { OPENAI_API_KEY, PINCONE_API_KEY, PINECONE_INDEX_NAME } from "../env";
import { CallRecord, StoreMessage } from "../../shared/entities";
import { makeId } from "../utils/misc";
import { sampleData } from "../../shared/sample-data";

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
const EMBEDDING_MODEL = "text-embedding-3-large";
const NS = "conversations";

const pc = new Pinecone({ apiKey: PINCONE_API_KEY });

/****************************************************
 Ensure Pincecone Index is created
****************************************************/
let ready = false;
export async function initVectorDB(attempt = 0) {
  if (ready) return;

  if (attempt === 0) log.info("vector-db", "Pinecone Index is initializing");

  const index = await pc.describeIndex(PINECONE_INDEX_NAME).catch(() => {
    if (attempt === 0) return;

    const msg = `Failed to create Pinecone Index name '${PINECONE_INDEX_NAME}'`;
    log.error("vector-db", msg);
    throw Error(msg);
  });

  if (!index) {
    // find the dimension of the model by creating an embedding
    const dimension = await openai.embeddings
      .create({ input: "hello world", model: EMBEDDING_MODEL })
      .then((result) => result.data[0].embedding.length);

    log.info(
      "vector-db",
      `Pinecone Index not found. Creating new index: "${PINECONE_INDEX_NAME}"`
    );
    await pc.createIndex({
      name: PINECONE_INDEX_NAME,
      dimension,
      metric: "cosine",
      spec: { serverless: { cloud: "aws", region: "us-east-1" } },
    });
  }

  if (index?.status.ready) {
    ready = true;
    return log.info("vector-db", "Pinecone Index is ready");
  }

  const sec = 2;
  if (index?.status.ready === false) {
    log.info(
      "vector-db",
      `Pinecone Index is still initializing. Checking again in ${sec} seconds.`
    );
  }

  await new Promise((resolve) => setTimeout(() => resolve(true), sec * 1000));

  return initVectorDB(++attempt);
}

export async function populateSampleVectorData() {
  console.log("sample data insert starting");
  await Promise.all(
    sampleData.calls.map((call) =>
      insertCall(call, sampleData.callMessages[call.callSid])
    )
  );

  console.log("sample data insert complete");
}

function translateMsgsToParam(msgs: StoreMessage[]) {
  return msgs
    .filter((msg) => msg.role !== "system")
    .filter(
      (msg) =>
        msg.role === "human" || (msg.role === "bot" && msg.type !== "tool")
    )
    .map((msg) => `[${msg.role.toUpperCase()}]: ${msg.content}`)
    .join("\n");
}

async function insertCall(call: CallRecord, msgs: StoreMessage[]) {
  const input = translateMsgsToParam(msgs);

  const res = await openai.embeddings.create({ input, model: EMBEDDING_MODEL });
  const embedding = res.data[0].embedding;
  if (!embedding) throw Error(`Unable to create embedding`);

  await pc
    .index(PINECONE_INDEX_NAME)
    .namespace(NS)
    .upsert([
      {
        id: makeId(call.callSid),
        values: embedding,
        metadata: {
          callSid: call.callSid,
          summary: call.summary,
          feedback: call.feedback.map((item) => item.comment),
        },
      },
    ]);
}
