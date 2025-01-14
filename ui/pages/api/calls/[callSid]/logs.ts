import { LogRecord } from "@shared/entities";
import { NextApiHandler, NextApiRequest } from "next";
import twilio from "twilio";

const handler: NextApiHandler = async (req: NextApiRequest, res) => {
  const callSid = req.query.callSid as string;

  res.json(await getData(callSid));
};

export default handler;

async function getData(callSid: string) {
  const client = twilio(
    process.env.TWILIO_API_KEY,
    process.env.TWILIO_API_SECRET,
    { accountSid: process.env.TWILIO_ACCOUNT_SID }
  );

  const sync = client.sync.v1.services(process.env.TWILIO_SYNC_SVC_SID);

  const items = await sync.syncLists(callSid).syncListItems.list();

  const result = items.map((item, _index) => ({
    _index,
    ...item.data,
  })) as LogRecord[];
  return result;
}

export type GetMessages = Awaited<ReturnType<typeof getData>>;
