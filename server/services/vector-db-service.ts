import { IndexModel, Pinecone } from "@pinecone-database/pinecone";
import OpenAI from "openai";
import log from "../logger";
import { OPENAI_API_KEY, PINCONE_API_KEY, PINECONE_INDEX_NAME } from "../env";

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
const EMBEDDING_MODEL = "text-embedding-3-large";
const NS = "conversations";

const pc = new Pinecone({ apiKey: PINCONE_API_KEY });

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
