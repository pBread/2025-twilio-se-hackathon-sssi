import type {
  AIQuestion,
  CallRecord,
  LogRecord,
  StoreMessage,
} from "@shared/entities";
import {
  callMapItemName,
  logListName,
  msgMapName,
  SYNC_CALL_MAP_NAME,
  SYNC_Q_MAP_NAME,
} from "@shared/sync";
import { NextApiHandler, NextApiRequest } from "next";
import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_API_KEY,
  process.env.TWILIO_API_SECRET,
  { accountSid: process.env.TWILIO_ACCOUNT_SID }
);

const sync = client.sync.v1.services(process.env.TWILIO_SYNC_SVC_SID);

export interface UpdateAllCallData {
  call: CallRecord;
  logs: LogRecord[];
  messages: StoreMessage[];
  questions: AIQuestion[];
}

const handler: NextApiHandler = async (req: NextApiRequest, res) => {
  try {
    const callSid = req.query.callSid as string;
    const data = JSON.parse(req.body) as UpdateAllCallData;

    console.debug("UpdateAllCallData", data);

    if (req.method === "POST") res.json(await handleUpdate(callSid, data));
    else throw Error(`Invalid method: ${req.method}`);
  } catch (error) {
    console.error(`Error in api route calls/[callSid]`, error);
    res.status(500).send({ error, status: "error" });
  }
};

export default handler;

async function handleUpdate(
  callSid: string,
  { call, messages, questions, logs }: UpdateAllCallData
) {
  console.log("updating call record");
  await sync
    .syncMaps(SYNC_CALL_MAP_NAME)
    .syncMapItems(callMapItemName(callSid))
    .update({ data: call });

  console.log("updating message records");
  await Promise.all(
    messages.map((item) =>
      sync
        .syncMaps(msgMapName(callSid))
        .syncMapItems(item.id)
        .update({ data: item })
    )
  );

  console.log("updating question records");
  await Promise.all(
    questions.map((item) =>
      sync
        .syncMaps(SYNC_Q_MAP_NAME)
        .syncMapItems(item.id)
        .update({ data: item })
    )
  );

  console.log("fetching current log items");
  const curLogs = await sync
    .syncLists(logListName(callSid))
    .syncListItems.list();

  console.log("deleting current log items");
  await Promise.all(
    curLogs.map((item) =>
      sync.syncLists(logListName(callSid)).syncListItems(item.index).remove()
    )
  );

  console.log("saving new log items");
  await Promise.all(
    logs.map((item) =>
      sync.syncLists(logListName(callSid)).syncListItems.create({ data: item })
    )
  );

  return { status: "success" };
}
