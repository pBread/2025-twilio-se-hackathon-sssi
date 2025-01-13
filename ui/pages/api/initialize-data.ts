import { NextApiHandler, NextApiRequest } from "next";
import twilio from "twilio";
import { SYNC_DEMO_CONFIG } from "@shared/constants";
import { mockDatabase } from "@shared/mock-database";

const handler: NextApiHandler = async (req: NextApiRequest, res) => {
  const client = twilio(
    process.env.TWILIO_API_KEY,
    process.env.TWILIO_API_SECRET,
    { accountSid: process.env.TWILIO_ACCOUNT_SID }
  );

  const sync = client.sync.v1.services(process.env.TWILIO_SYNC_SVC_SID);

  const [config, calls] = await Promise.all([
    sync.documents(SYNC_DEMO_CONFIG).fetch(),
    sync.syncMaps("calls").syncMapItems.list(),
  ]);

  res.json({ config: config.data, calls, ...mockDatabase });
};

export default handler;
