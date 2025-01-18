import type { AIQuestion } from "@shared/entities";
import { SYNC_Q_MAP_NAME } from "@shared/sync";
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
    const questionId = req.query.questionId as string;
    const question = JSON.parse(req.body) as AIQuestion;

    if (req.method === "POST")
      res.json(await updateQuestion(questionId, question));
    else throw Error(`Invalid method: ${req.method}`);
  } catch (error) {
    console.error(`Error in api route calls/[callSid]`, error);
    res.status(500).send({ error, status: "error" });
  }
};

async function updateQuestion(questionId: string, update: Partial<AIQuestion>) {
  const mapItem = sync.syncMaps(SYNC_Q_MAP_NAME).syncMapItems(questionId);

  const prev = await mapItem.fetch().then((res) => res.data);

  if (!prev)
    throw Error(
      `Attempted to update question that does not exist. questionId ${questionId}`
    );

  const data = { ...prev, ...update };

  const newItem = await mapItem.update({ data });
  return { status: "success", call: newItem.data };
}

export default handler;
