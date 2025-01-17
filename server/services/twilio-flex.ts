import { Twilio, twiml as TwiML } from "twilio";
import {
  FLEX_WORKFLOW_SID,
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
} from "../env";
import log from "../logger";
import { safeParse } from "../utils/misc";
import { HandoffData } from "../../shared/entities";

const client = new Twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
const VoiceResponse = TwiML.VoiceResponse;

interface CreateLiveAgentHandoffTwiML {
  AccountSid: string;
  CallSid: string;
  From: string;
  To: string;
  SessionId: string;
  SessionDuration: string;
  HandoffData: string; // json string
}

export async function createLiveAgentHandoffTwiML(
  params: CreateLiveAgentHandoffTwiML
) {
  const data = safeParse(params.HandoffData) as HandoffData;

  if (!data)
    throw Error(`createLiveAgentHandoffTwiML could not parse handoffData`);

  const taskAttributes = {
    ...data,
    customerData: data.customerData,
    accountSid: params.AccountSid,
    callSid: params.CallSid,
    from: params.From,
    to: params.To,
    sessionId: params.SessionId,
    sessionDuration: params.SessionDuration,
    reasonCode: data.reasonCode ?? "No reason code",
    handoffReason: data.reason ?? "No reason provided",
    conversationSummary: data.conversationSummary ?? "No conversation summary",
    escalation_type: data.conversationSummary ?? "No escalation type",
  };

  log.info(
    "flex",
    "Enqueing call with the following attributes: ",
    taskAttributes
  );

  const twiml = new VoiceResponse();
  twiml
    .enqueue({ workflowSid: FLEX_WORKFLOW_SID })
    .task({ priority: 1000 }, JSON.stringify(taskAttributes));

  return twiml;
}
