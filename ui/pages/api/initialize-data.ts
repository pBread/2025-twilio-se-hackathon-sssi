import { NextApiHandler, NextApiRequest } from "next";
import twilio from "twilio";
import { SYNC_CONFIG_NAME } from "@shared/constants";
import { mockDatabase } from "@shared/mock-database";
import { DemoConfiguration, CallRecord } from "@shared/entities";

const handler: NextApiHandler = async (req: NextApiRequest, res) => {
  res.json(await getData());
};

export default handler;

async function getData() {
  const client = twilio(
    process.env.TWILIO_API_KEY,
    process.env.TWILIO_API_SECRET,
    { accountSid: process.env.TWILIO_ACCOUNT_SID }
  );

  const sync = client.sync.v1.services(process.env.TWILIO_SYNC_SVC_SID);

  const [config, calls] = await Promise.all([
    sync.documents(SYNC_CONFIG_NAME).fetch(),
    sync.syncMaps("calls").syncMapItems.list(),
  ]);

  const result = {
    config: config.data as DemoConfiguration,
    calls: calls.map((item) => item.data as CallRecord),
    ...mockDatabase,
  };
  return result;
}

export type InitializeDataResult = Awaited<ReturnType<typeof getData>>;
