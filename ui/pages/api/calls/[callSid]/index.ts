import { Pinecone } from "@pinecone-database/pinecone";
import type { AIQuestion, CallRecord } from "@shared/entities";
import {
  callMapItemName,
  logListName,
  msgMapName,
  SYNC_CALL_MAP_NAME,
  SYNC_Q_MAP_NAME,
} from "@shared/sync";
import { NextApiHandler, NextApiRequest } from "next";
import OpenAI from "openai";
import twilio from "twilio";

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

    if (req.method === "POST") {
      const call = JSON.parse(req.body) as CallRecord;

      res.json(await updateCall(callSid, call));
    } else if (req.method === "DELETE") res.json(await deleteCall(callSid));
    else throw Error(`Invalid method: ${req.method}`);
  } catch (error) {
    console.error(`Error in api route calls/[callSid]`, error);
    res.status(500).send({ error, status: "error" });
  }
};

export default handler;

async function updateCall(callSid: string, update: Partial<CallRecord>) {
  const uniqueName = callMapItemName(callSid);
  const callItem = sync.syncMaps(SYNC_CALL_MAP_NAME).syncMapItems(uniqueName);

  const prevCall = await callItem.fetch().then((item) => item.data);

  if (!prevCall)
    throw Error(`Attempted to update a call that does not exist ${callSid}`);

  const data = { ...prevCall, ...update };

  const newCall = await callItem.update({ data });

  return { status: "success", call: newCall.data };
}

async function deleteCall(callSid: string) {
  console.log("deleting call record");
  await sync
    .syncMaps(SYNC_CALL_MAP_NAME)
    .syncMapItems(callMapItemName(callSid))
    .remove();

  console.log("deleting message map");
  await sync.syncMaps(msgMapName(callSid)).remove();

  console.log("deleting log list");
  await sync.syncLists(logListName(callSid)).remove();

  console.log("finding call questions");
  const qResult = await sync.syncMaps(SYNC_Q_MAP_NAME).syncMapItems.list();
  const questions = qResult
    .map((item) => item.data)
    .filter((question) => question.callSid === callSid) as AIQuestion[];

  console.log("deleting question records");
  await Promise.all(
    questions.map((item) =>
      sync.syncMaps(SYNC_Q_MAP_NAME).syncMapItems(item.id).remove()
    )
  );

  const vector = await openai.embeddings
    .create({ input: "hello world", model: EMBEDDING_MODEL })
    .then((result) => result.data[0].embedding);

  const vectors = await pc
    .index(PINECONE_INDEX_NAME)
    .namespace(NS)
    .query({ topK: 10, filter: { callSid }, vector });

  await Promise.all(
    vectors.matches.map((match) =>
      pc.index(PINECONE_INDEX_NAME).namespace(NS).deleteOne(match.id)
    )
  );

  return { status: "success" };
}
