import { CallContext, StoreMessage } from "../../../shared/entities";
import { LLM_MODEL } from "../../env";
import { injectContext } from "../helpers";
import procedures from "../procedures";

const instructions = `\
You will find the transcript of an ongoing conversation between a voice bot and a human customer. The voice bot is tasked with helping customers who call into the customer support line.

Generate a one paragraph summary of the conversation. Be sure to include the customer's intent and note anything interesting about the call.

# Conversation
Here are a few notes on the formatting
- Result that are undefined are unresolved, i.e. the API request is still open.
- The result.data property is stringified then truncated to avoid this prompt from being too long.

## Transcript
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

const summarizationBot = { getInstructions, model: LLM_MODEL };

export default summarizationBot;
