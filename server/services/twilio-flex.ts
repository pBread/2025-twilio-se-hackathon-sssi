import { Twilio, twiml as TwiML } from "twilio";
import { AIQuestion, HandoffData } from "../../shared/entities";
import {
  FLEX_QUEUE_SID,
  FLEX_WORKER_SID,
  FLEX_WORKFLOW_SID,
  FLEX_WORKSPACE_SID,
  HOSTNAME,
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_DEFAULT_NUMBER,
} from "../env";
import log from "../logger";
import { safeParse } from "../utils/misc";

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

  log.info("flex", `Enqueing call ${params.CallSid}`);

  const twiml = new VoiceResponse();
  twiml
    .enqueue({ workflowSid: FLEX_WORKFLOW_SID })
    .task({ priority: 1000 }, JSON.stringify(taskAttributes));

  return twiml;
}

export async function createFlexTask(
  attributes: HandoffData,
  question: AIQuestion
) {
  const result = await client.flexApi.v1.interaction.create({
    channel: {
      type: "chat",
      initiated_by: "agent",
      participants: [{ identity: "AI Agent" }],
    },
    routing: {
      properties: {
        workspace_sid: FLEX_WORKSPACE_SID,
        workflow_sid: FLEX_WORKFLOW_SID,
        queue_sid: FLEX_QUEUE_SID,
        worker_sid: FLEX_WORKER_SID,
        task_channel_unique_name: "chat",
        from: attributes.customerData.phone,

        attributes: {
          ...attributes,
          customer: { from: attributes.customerData.phone },
          customerAddress: "AI Agent",
          from: attributes.customerData.phone,
          phone: attributes.customerData.phone,
          to: TWILIO_DEFAULT_NUMBER,
        },
      },
    },
  });

  const attr = JSON.parse(result.routing.properties.attributes);

  await client.conversations.v1
    .conversations(attr.conversationSid)
    .messages.create({
      author: "AI Agent",
      body: `${question.question} \n${question.explanation}\n\nHere is my recommendation: ${question.recommendation}`,
    });

  await client.conversations.v1
    .conversations(attr.conversationSid)
    .webhooks.create({
      "configuration.filters": ["onMessageAdded"],
      "configuration.method": "POST",
      "configuration.url": `https://${HOSTNAME}/api/ai-question/${question.id}`,
      target: "webhook",
    });
}
