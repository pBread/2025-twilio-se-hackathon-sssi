import type { CallRecord } from "@shared/entities";
import { callMapItemName, SYNC_CALL_MAP_NAME } from "@shared/sync";
import { NextApiHandler, NextApiRequest } from "next";
import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_API_KEY,
  process.env.TWILIO_API_SECRET,
  { accountSid: process.env.TWILIO_ACCOUNT_SID }
);

const sync = client.sync.v1.services(process.env.TWILIO_SYNC_SVC_SID);

const handler: NextApiHandler = async (req: NextApiRequest, res) => {
  try {
    const callSid = req.query.callSid as string;
    const call = JSON.parse(req.body) as CallRecord;

    if (req.method === "POST") res.json(await updateCall(callSid, call));
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
