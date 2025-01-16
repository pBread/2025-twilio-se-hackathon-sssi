import OpenAI from "openai";
import type { GovernanceStepStatus, LogActions } from "../../shared/entities";
import governanceBot from "../bot/subconscious/governance";
import { OPENAI_API_KEY } from "../env";
import log from "../logger";
import type { ConversationStore } from "./conversation-store";
import { addSyncLogItem } from "./sync-service";

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

interface SubconsciousOptions {
  governanceFrequency: number; // in milliseconds, how often the governance process should be executed
  recallFrequency: number; // in milliseconds, how often the recall process should be executed
}

export class SubsconsciousService {
  private opts: SubconsciousOptions;
  constructor(
    private store: ConversationStore,
    opts: Partial<SubconsciousOptions> = {}
  ) {
    this.opts = {
      governanceFrequency: opts.governanceFrequency ?? 10 * 1000,
      recallFrequency: opts.recallFrequency ?? 5 * 1000,
    };
  }

  /****************************************************
   Segment
  ****************************************************/
  addSegmentLog = (description: string) =>
    addSyncLogItem({
      callSid: this.store.call.callSid,

      actions: ["Updated Context"],
      description,
      source: "Segment",
    });

  /****************************************************
   Governance
  ****************************************************/
  governanceTimeout: NodeJS.Timeout | undefined;
  startGovernance = async () => {
    log.info("llm.sub", "subconscious governance starting");
    this.governanceTimeout = setInterval(
      this.executeGovernance,
      this.opts.governanceFrequency
    );
  };

  executeGovernance = async () => {
    let instructions = governanceBot.getInstructions(
      this.store.call.callContext,
      this.store.getMessages()
    );

    const completion = await openai.chat.completions.create({
      model: governanceBot.model,
      messages: [
        {
          role: "user",
          content: instructions,
        },
      ],
      stream: false,
    });

    const choice = completion.choices[0];

    if (choice.finish_reason === "tool_calls" && choice.message.tool_calls) {
      const logMsg =
        "Subconscious Governance has no tools but LLM is attempting to execute fns";
      log.error(logMsg);
      throw Error(logMsg);
    }

    if (choice.finish_reason === "stop") {
      log.info("llm.sub", "governance bot response: ", choice.message.content);
    }
  };

  stop = async () => {
    clearInterval(this.governanceTimeout);
  };

  newProcedure = (procedureId: string) =>
    addSyncLogItem({
      callSid: this.store.call.callSid,

      actions: ["Updated Context"],
      description: `Added new procedure '${procedureId} to governance tracker'`,
      source: "Segment",
    });

  updateProcedure = (
    procedureId: string,
    step: string,
    status: GovernanceStepStatus
  ) => {
    let actions: LogActions[] = ["Updated Context"];

    if (status === "missed") actions.push("Added System Message");

    addSyncLogItem({
      callSid: this.store.call.callSid,

      actions: ["Updated Context"],
      description: `Updated the '${procedureId}' procedure step '${step}' to '${status}''`,
      source: "Segment",
    });
  };
}
