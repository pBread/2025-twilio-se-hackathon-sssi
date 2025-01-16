import { CallContext, StoreMessage } from "../../../shared/entities";
import { FunctionServices, injectContext } from "../helpers";
import procedures from "../procedures";

const instructions = `\
Below you will find a list of procedures and a partial conversation between an LLM powered voice bot and a human. Your job is to identify what procedures are relevant to the conversation and what the status of the procedure steps are.

# Response Format
Format your response as a JSON object formatted to the schema of the Typescript type GovernanceTracker below. You should only include the procedures that are underway or could be relevant. But, you should include every step with that step's status for each procedure you identify.

type GovernanceTracker = Record<ProcedureId, GovernanceStep[]>

type ProcedureId = string;
type StepId = string;

interface GovernanceStep {
  id: StepId;
  status: GovernanceStepStatus;
}

type GovernanceStepStatus =
  | "not-started"
  | "in-progress"
  | "complete"
  | "missed";


## Example Response
Here is an example of a response...
{
  modify_order: [
    { id: "identify_user", status: "missed" },
    { id: "get_order", status: "complete" },
    { id: "ask_agent", status: "in-progress" },
    { id: "send_modification_confirmation", status: "not-started" },
    { id: "process_payment", status: "not-started" },
    { id: "issue_refund", status: "not-started" },
  ],
}

# Procedures
Here are the procedures for this conversations...
${JSON.stringify(procedures)}

# Current Conversation

`;

function getInstructions(ctx: CallContext, msgs: StoreMessage[]) {
  let prompt = injectContext(instructions, ctx);

  prompt += JSON.stringify(msgs);

  return prompt;
}

const governanceBot = { getInstructions };

export default governanceBot;
