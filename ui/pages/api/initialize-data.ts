import { NextApiHandler, NextApiRequest } from "next";
import twilio from "twilio";

const handler: NextApiHandler = async (req: NextApiRequest, res) => {
  const client = twilio(
    process.env.TWILIO_API_KEY,
    process.env.TWILIO_API_SECRET,
    { accountSid: process.env.TWILIO_ACCOUNT_SID }
  );

  const sync = client.sync.v1.services(process.env.TWILIO_SYNC_SVC_SID);

  const [docs, lists, maps] = await Promise.all([
    sync.documents.list(),
    sync.syncLists.list(),
    sync.syncMaps.list(),
  ]);

  res.json({ docs, lists, maps });
};

export default handler;
