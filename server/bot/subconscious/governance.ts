import { CallContext, StoreMessage } from "../../../shared/entities";
import { LLM_MODEL } from "../../env";
import log from "../../logger";
import { injectContext } from "../helpers";
import procedures from "../procedures";

const instructions = `\
Below you will find a list of procedures and a partial conversation between an LLM powered voice bot and a human. Your job is to identify what procedures are relevant to the conversation and what the status of the procedure steps are.

# Guidelines
## Status Progression
The status of each protocol steps should only advance. For instance, if a protocol step is "in-progress", your response MUST show that step as either "in-progress", "complete", "unresolved".
- "not-started" can move to any status
- "missed" can move to any status, except for "not-started"
- "in-progress" can move to  "in-progress", "complete" or "unresolved", but not "not-started" or "missed"
- "complete" cannot change
- "unresolved" can be updated to either "in-progress" or "complete". Note, this is the only status that can go back to a previous value.

## Events Are Related
Some of the events are related. Make sure you consider this when analyzing the step progress. For instance, identify_user is referenced in multiple procedures. If identify_user is a procedure and you identify a procedure with a step identify_user, then that step should not be "not-started".

Also, if a step is a related procedure and there are any steps that are not "not-started" or "in-progress" then that step cannot be considered "complete."

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
  | "missed" // the bot simply skipped this step
  | "in-progress" // the bot is currently performing this step
  | "complete" // the bot successfully completed this step
  | "unresolved" // the bot attempted, but failed

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

# Current State
Here is the current state of the procedures...
{{governanceState}}

# Procedures
Here are the procedures for this conversations...
{{procedures}}

# Current Conversation
Here are a few notes on the formatting
- Result that are undefined are unresolved, i.e. the API request is still open.
- The result.data property is stringified then truncated to avoid this prompt from being too long.

{{messages}}

`;

function getInstructions(ctx: CallContext, msgs: StoreMessage[]) {
  let prompt = instructions.replace(
    "{{governanceState}}",
    JSON.stringify(ctx.governance)
  );
  prompt = prompt.replace("{{procedures}}", JSON.stringify(procedures));

  const _msgs = msgs
    .filter((msg) => msg.role !== "system")
    .map((msg) => {
      const role = msg.role;
      const type = msg.type;

      if (role === "human") return { role, content: msg.content };

      if (type === "tool")
        return msg.tool_calls.map((tool) => {
          const result = tool.result as {
            status: "success" | "error";
            data: object | object[] | string;
          };

          if (result?.data) {
            const stringified = JSON.stringify(result.data);
            // reduce the size of the result
            const truncated =
              stringified.length > 100
                ? stringified.substring(0, 100) + "..."
                : stringified;

            return {
              role,
              type,
              function: tool.function,
              result: { ...result, data: truncated },
            };
          }

          return { role, type, function: tool.function, result };
        });

      return { role: msg.role, type: msg.type, content: msg.content };
    })
    .flat(Infinity);

  prompt = prompt.replace("{{messages}}", JSON.stringify(_msgs));

  prompt = injectContext(prompt, ctx);

  return prompt;
}

const governanceBot = { getInstructions, model: LLM_MODEL };

export default governanceBot;
