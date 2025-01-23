import OpenAI from "openai";
import type {
  Annotation,
  GovernanceStepStatus,
  GovernanceTracker,
  LogActions,
  SimilarCall,
} from "../../shared/entities";
import governanceBot from "../bot/subconscious/governance";
import summarizationBot from "../bot/subconscious/summary";
import { OPENAI_API_KEY } from "../env";
import log from "../logger";
import { safeParse } from "../utils/misc";
import type { ConversationStore } from "./conversation-store";
import { addSyncLogItem, getCallItem } from "./sync-service";
import { vectorQuery } from "./vector-db-service";
import startCase from "lodash.startcase";
import { getInstructions } from "../bot/conscious/instructions";

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

interface SubconsciousOptions {
  governanceFrequency: number; // in milliseconds, how often the governance process should be executed
  recallFrequency: number; // in milliseconds, how often the recall process should be executed
  summarizationFrequency: number; // in milliseconds, how often the summarization process should be executed
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
      summarizationFrequency: opts.summarizationFrequency ?? 5 * 1000,
    };
  }

  stop = async () => {
    clearInterval(this.governanceTimeout);
    clearInterval(this.recallTimeout);
    clearInterval(this.summarizationTimeout);
  };

  /****************************************************
   Governance
  ****************************************************/
  governanceTimeout: NodeJS.Timeout | undefined;
  startGovernance = async () => {
    log.info("sub.gov", "starting subconscious governance");
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
      messages: [{ role: "user", content: instructions }],
      response_format: { type: "json_object" },
      stream: false,
    });

    const choice = completion.choices[0];
    const content = choice.message.content;

    if (choice.finish_reason === "tool_calls" && choice.message.tool_calls) {
      const logMsg =
        "Subconscious Governance has no tools but LLM is attempting to execute fns";
      log.error(logMsg);
      throw Error(logMsg);
    }

    if (choice.finish_reason === "stop") {
      const result = safeParse(content) as GovernanceTracker;

      if (!result) {
        log.warn(
          "sub.gov",
          "executeGovernance LLM responded with a non-JSON format",
          content
        );
        return;
      }

      const prevTracker = this.store.call.callContext.governance;

      const newTracker = updateGovernanceTracker(prevTracker, result);
      const changes = identifyGovernanceChanges(prevTracker, newTracker);

      this.store.setContext({ governance: newTracker });

      if (changes.newProcedures.length) {
        addSyncLogItem({
          callSid: this.store.call.callSid,
          actions: ["Updated Context", "Updated Instructions"],
          source: "Governance",
          description:
            `New procedure${
              changes.newProcedures.length > 1 ? "s" : ""
            } identified: ` + changes.newProcedures.join(", "),
        });
      }

      if (changes.updatedSteps.length) {
        let actions: LogActions[] = ["Updated Context"];
        if (
          changes.updatedSteps.some(
            (step) =>
              step.newStatus === "missed" || step.newStatus === "unresolved"
          )
        ) {
          actions.push("Added System Message");
        }

        const updateMap = changes.updatedSteps.reduce(
          (acc, step) =>
            Object.assign(acc, {
              [step.procedureId]:
                step.procedureId in acc && Array.isArray(acc[step.procedureId])
                  ? acc[step.procedureId].concat(step)
                  : [step],
            }),
          {} as {
            [key: string]: {
              procedureId: string;
              stepId: string;
              oldStatus: GovernanceStepStatus;
              newStatus: GovernanceStepStatus;
            }[];
          }
        );

        let description = "";
        Object.entries(updateMap).forEach(([procedureId, steps], idx) => {
          if (idx !== 0) description += "\n";

          description +=
            `${startCase(procedureId)}: ` +
            " " +
            steps
              .map((step) => `${step.stepId} is ${step.newStatus}`)
              .join(", ");

          description += "\n";
        });

        addSyncLogItem({
          callSid: this.store.call.callSid,
          actions,
          source: "Governance",
          description,
        });
      }
    }
  };

  newProcedure = (procedureId: string) => {
    addSyncLogItem({
      callSid: this.store.call.callSid,
      actions: ["Updated Context", "Updated Instructions"],
      description: `New procedure identified: ${startCase(procedureId)}`,
      source: "Governance",
    });
  };

  updateProcedure = (
    procedureId: string,
    step: string,
    newStatus: GovernanceStepStatus,
    oldStatus: GovernanceStepStatus = "not-started"
  ) => {
    const description = `${startCase(procedureId)}: ${step} is ${newStatus}'`;
    let actions: LogActions[] = ["Updated Context"];

    addSyncLogItem({
      callSid: this.store.call.callSid,
      actions,
      description,
      source: "Governance",
    });
  };

  /****************************************************
   Recall
  ****************************************************/
  recallTimeout: NodeJS.Timeout | undefined;
  startRecall = async () => {
    log.info("sub.gov", "starting subconscious recall");

    this.recallTimeout = setInterval(
      this.executeRecall,
      this.opts.recallFrequency
    );
  };

  executeRecall = async () => {
    const matches = await vectorQuery(this.store.getMessages());

    const similarCalls: SimilarCall[] = matches.map((match) => ({
      callSid: match.metadata?.callSid as string,
      id: match.id,
      score: match.score as number,
      title: match.metadata?.title as string,
    }));

    const newMatches = await Promise.all(
      similarCalls
        .filter(
          (match) =>
            !this.store.call.callContext.similarCalls.some(
              (call) => call.callSid === match.callSid
            )
        )
        .map(async (match) => ({
          call: await getCallItem(match.callSid),
          match,
        }))
    );

    const newFeedback = newMatches
      .filter((match) => match.call)
      .flatMap((item) =>
        item.call.feedback.map((annotation) => ({
          annotation,
          match: item.match,
        }))
      );

    this.store.setContext({
      similarCalls,
      suggestions: [
        ...newFeedback.map((item) => item.annotation.comment),
        ...this.store.call.callContext.suggestions,
      ].slice(0, 40),
    });

    this.store.setInstructions(getInstructions(this.store.call.callContext));

    if (!newFeedback.length) return;

    const annotationText = newFeedback
      .map((item) => item.annotation.comment)
      .join("\n");

    this.addRecallAnnotation(annotationText);
  };

  addRecallAnnotation = (description: string) => {
    addSyncLogItem({
      actions: ["Updated Instructions"],
      callSid: this.store.call.callSid,
      description,
      source: "Recall",
    });
  };

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
   Summarization
  ****************************************************/
  summarizationTimeout: NodeJS.Timeout | undefined;
  startSummarization = async () => {
    log.info("sub.sum", "starting subconscious summarization");

    this.summarizationTimeout = setInterval(
      this.executeSummarization,
      this.opts.summarizationFrequency
    );
  };

  executeSummarization = async () => {
    let instructions = summarizationBot.getInstructions(
      this.store.call.callContext,
      this.store.getMessages()
    );

    const completion = await openai.chat.completions.create({
      model: summarizationBot.model,
      messages: [{ role: "user", content: instructions }],
      stream: false,
      response_format: { type: "json_object" },
    });

    const choice = completion.choices[0];
    const content = choice.message.content;

    if (choice.finish_reason === "tool_calls" && choice.message.tool_calls) {
      const logMsg =
        "Subconscious Summarization has no tools but LLM is attempting to execute fns";
      log.error(logMsg);
      throw Error(logMsg);
    }

    if (choice.finish_reason === "stop") {
      const summary = safeParse(content);

      if (summary) {
        this.store.setCall({ summary });
        this.store.call.callContext;
      } else
        log.warn(
          "sub.sum",
          "summarization LLM return invalid format. content",
          content
        );
    }
  };
}

/****************************************************
 Governance Utilities
****************************************************/
function updateGovernanceTracker(
  existing: GovernanceTracker,
  update: GovernanceTracker
): GovernanceTracker {
  // Create a deep copy of the existing state
  const result: GovernanceTracker = Object.entries(existing).reduce(
    (acc, [key, steps]) => {
      acc[key] = steps.map((step) => ({ ...step }));
      return acc;
    },
    {} as GovernanceTracker
  );

  // Iterate through each procedure in the update
  Object.entries(update).forEach(([procedureId, updatedSteps]) => {
    if (!result[procedureId]) {
      // If this is a new procedure, add it with a deep copy
      result[procedureId] = updatedSteps.map((step) => ({ ...step }));
    } else {
      // Update existing procedure's steps
      const existingSteps = result[procedureId];

      // Create a map of existing steps for quick lookup
      const existingStepsMap = new Map(
        existingSteps.map((step, index) => [step.id, { step, index }])
      );

      // Update existing steps while maintaining order
      updatedSteps.forEach((updatedStep) => {
        const existing = existingStepsMap.get(updatedStep.id);
        if (existing) {
          // Update status of existing step while maintaining its position
          existingSteps[existing.index] = {
            ...existing.step,
            status: updatedStep.status,
          };
        } else {
          // If it's a new step, append it to the end
          existingSteps.push({ ...updatedStep });
        }
      });
    }
  });

  return result;
}

interface GovernanceChanges {
  newProcedures: string[];
  updatedSteps: {
    procedureId: string;
    stepId: string;
    oldStatus: GovernanceStepStatus;
    newStatus: GovernanceStepStatus;
  }[];
}

function identifyGovernanceChanges(
  existing: GovernanceTracker,
  update: GovernanceTracker
): GovernanceChanges {
  const changes: GovernanceChanges = {
    newProcedures: [],
    updatedSteps: [],
  };

  // Identify new procedures
  Object.keys(update).forEach((procedureId) => {
    if (!existing[procedureId]) {
      changes.newProcedures.push(procedureId);
    }
  });

  // Identify updated steps in existing procedures
  Object.entries(update).forEach(([procedureId, updatedSteps]) => {
    const existingSteps = existing[procedureId];
    if (!existingSteps) return; // Skip if procedure doesn't exist

    // Create a map of existing steps for quick lookup
    const existingStepsMap = new Map(
      existingSteps.map((step) => [step.id, step])
    );

    // Check each updated step
    updatedSteps.forEach((updatedStep) => {
      const existingStep = existingStepsMap.get(updatedStep.id);
      if (existingStep && existingStep.status !== updatedStep.status) {
        changes.updatedSteps.push({
          procedureId,
          stepId: updatedStep.id,
          oldStatus: existingStep.status,
          newStatus: updatedStep.status,
        });
      }
    });
  });

  return changes;
}
