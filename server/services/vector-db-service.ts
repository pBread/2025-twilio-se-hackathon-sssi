import { Pinecone } from "@pinecone-database/pinecone";
import OpenAI from "openai";
import { pRateLimit } from "p-ratelimit";
import { CallRecord, StoreMessage } from "../../shared/entities";
import { sampleData } from "../../shared/sample-data";
import { OPENAI_API_KEY, PINECONE_API_KEY, PINECONE_INDEX_NAME } from "../env";
import log from "../logger";
import { makeId } from "../utils/misc";

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
const EMBEDDING_MODEL = "text-embedding-3-large";
const NS = "conversations";

const pc = new Pinecone({ apiKey: PINECONE_API_KEY });

const limit = pRateLimit({
  interval: 1000, // 1000 ms == 1 second
  rate: 100, // 100 API calls per interval
  maxDelay: 30 * 1000, // an API call delayed > 30 sec is rejected
  concurrency: 50,
});

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
    let dimension: number;
    try {
      // find the dimension of the model by creating an embedding
      dimension = await openai.embeddings
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
    } catch (error) {
      log.error("Error creating Pinecone Index", error);
      throw error;
    }
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

async function insertCallVector(call: CallRecord, msgs: StoreMessage[]) {
  const input = translateMsgsToParam(msgs);

  const res = await openai.embeddings.create({ input, model: EMBEDDING_MODEL });
  const embedding = res.data[0].embedding;
  if (!embedding) throw Error(`Unable to create embedding`);

  return limit(() =>
    pc
      .index(PINECONE_INDEX_NAME)
      .namespace(NS)
      .upsert([
        {
          id: makeId(call.callSid),
          values: embedding,
          metadata: {
            callSid: call.callSid,
            title: call.summary.title,
            feedback: call.feedback.map((item) => item.comment),
          },
        },
      ])
  );
}

export async function vectorQuery(msgs: StoreMessage[]) {
  const input = translateMsgsToParam(msgs);
  const result = await limit(() =>
    openai.embeddings.create({ model: EMBEDDING_MODEL, input })
  );

  const vector = result.data[0].embedding;

  return limit(() =>
    pc
      .index(PINECONE_INDEX_NAME)
      .namespace(NS)
      .query({ topK: 10, vector, includeMetadata: true })
      .then((res) => res.matches)
  );
}

async function getVectorsByCallSid(callSid: string) {
  const vector = await limit(() =>
    openai.embeddings
      .create({ input: "hello world", model: EMBEDDING_MODEL })
      .then((result) => result.data[0].embedding)
  );

  return limit(() =>
    pc
      .index(PINECONE_INDEX_NAME)
      .namespace(NS)
      .query({ topK: 10, filter: { callSid }, vector })
  );
}

async function removeVector(vectorId: string) {
  return limit(() =>
    pc.index(PINECONE_INDEX_NAME).namespace(NS).deleteOne(vectorId)
  );
}

export async function removeCallVectorsByCallSid(callSid: string) {
  const result = await getVectorsByCallSid(callSid);
}

/****************************************************
 Data Management
****************************************************/
export async function populateSampleVectorData() {
  console.log("sample data insert starting");
  await Promise.all(
    sampleData.calls.map((call) =>
      insertCallVector(call, sampleData.callMessages[call.callSid])
    )
  );

  console.log("sample data insert complete");
}

export async function clearAllVectors() {
  const result = await pc
    .index(PINECONE_INDEX_NAME)
    .namespace(NS)
    .listPaginated({ limit: 100 });

  if (!result.vectors) return;

  await Promise.all(
    result.vectors.map((vector) => removeVector(vector.id as string))
  );
}
