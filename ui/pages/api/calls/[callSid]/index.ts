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
import twilio from "twilio";

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

const client = twilio(
  process.env.TWILIO_API_KEY,
  process.env.TWILIO_API_SECRET,
  { accountSid: process.env.TWILIO_ACCOUNT_SID }
);

const sync = client.sync.v1.services(process.env.TWILIO_SYNC_SVC_SID);

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

  return { status: "success" };
}
