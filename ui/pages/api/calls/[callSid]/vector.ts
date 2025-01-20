import { makeId } from "@/util/misc";
import type { CallRecord, StoreMessage } from "@shared/entities";
import { callMapItemName, msgMapName, SYNC_CALL_MAP_NAME } from "@shared/sync";
import { NextApiHandler, NextApiRequest } from "next";
import twilio from "twilio";
import { Pinecone } from "@pinecone-database/pinecone";
import { OpenAI } from "openai";

const {
  TWILIO_API_KEY,
  TWILIO_API_SECRET,
  TWILIO_ACCOUNT_SID,
  PINECONE_INDEX_NAME,
  TWILIO_SYNC_SVC_SID,
  OPENAI_API_KEY,
  PINECONE_API_KEY,
} = process.env;

const client = twilio(TWILIO_API_KEY, TWILIO_API_SECRET, {
  accountSid: TWILIO_ACCOUNT_SID,
});

const sync = client.sync.v1.services(TWILIO_SYNC_SVC_SID);

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
const EMBEDDING_MODEL = "text-embedding-3-large";
const NS = "conversations";

const pc = new Pinecone({ apiKey: PINECONE_API_KEY });

const handler: NextApiHandler = async (req: NextApiRequest, res) => {
  try {
    const callSid = req.query.callSid as string;
    const call = await sync
      .syncMaps(SYNC_CALL_MAP_NAME)
      .syncMapItems(callMapItemName(callSid))
      .fetch()
      .then((res) => res.data as CallRecord);

    if (call.hasVector)
      throw Error(
        `Attempted to insert a vector for a call (${callSid}) that already has a vector record`
      );

    const msgs = await sync
      .syncMaps(msgMapName(callSid))
      .syncMapItems.list()
      .then((res) => res.map((item) => item.data as StoreMessage));

    await insertCallVector(call, msgs);

    res.json({ status: "success" });
  } catch (error) {
    console.error(`Error in api route calls/[callSid]`, error);
    res.status(500).send({ error, status: "error" });
  }
};

export default handler;

async function insertCallVector(call: CallRecord, msgs: StoreMessage[]) {
  const input = translateMsgsToParam(msgs);

  const res = await openai.embeddings.create({ input, model: EMBEDDING_MODEL });
  const embedding = res.data[0].embedding;
  if (!embedding) throw Error(`Unable to create embedding`);

  return pc
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
    ]);
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
