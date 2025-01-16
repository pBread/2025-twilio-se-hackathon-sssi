import OpenAI from "openai";
import type {
  Annotation,
  CallRecord,
  GovernanceStepStatus,
  GovernanceTracker,
  LogActions,
  SimilarCall,
} from "../../shared/entities";
import { sampleData } from "../../shared/sample-data";
import governanceBot from "../bot/subconscious/governance";
import { OPENAI_API_KEY } from "../env";
import log from "../logger";
import { makeId, safeParse } from "../utils/misc";
import type { ConversationStore } from "./conversation-store";
import { addSyncLogItem, getCallItem } from "./sync-service";

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

  stop = async () => {
    clearInterval(this.governanceTimeout);
    clearInterval(this.recallTimeout);
  };

  /****************************************************
   Governance
  ****************************************************/
  governanceTimeout: NodeJS.Timeout | undefined;
  startGovernance = async () => {
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

      for (const procedureId of changes.newProcedures)
        this.newProcedure(procedureId);

      for (const change of changes.updatedSteps)
        this.updateProcedure(
          change.procedureId,
          change.stepId,
          change.newStatus,
          change.oldStatus
        );
    }
  };

  newProcedure = (procedureId: string) => {
    const description = `Added new procedure '${procedureId} to governance tracker'`;
    log.info("sub.gov", description);

    addSyncLogItem({
      callSid: this.store.call.callSid,
      actions: ["Updated Context"],
      description,
      source: "Governance",
    });
  };

  updateProcedure = (
    procedureId: string,
    step: string,
    newStatus: GovernanceStepStatus,
    oldStatus: GovernanceStepStatus = "not-started"
  ) => {
    const description = `Updated the '${procedureId}' procedure step '${step}' from '${oldStatus}' to '${newStatus}''`;
    log.info("sub.gov", description);

    let actions: LogActions[] = ["Updated Context"];

    if (newStatus === "missed") actions.push("Added System Message");

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
    this.recallTimeout = setInterval(
      this.executeRecall,
      this.opts.recallFrequency
    );
  };

  executeRecall = async () => {
    log.info("sub.recall", "executing recall");

    // just randomly sorting for dev purposes
    const top5Calls = shuffleArray(
      sampleData.calls.filter((call) => call.feedback.length).slice(0, 5)
    );

    function shuffleArray<T>(array: T[]): T[] {
      const shuffled = [...array];

      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      return shuffled;
    }

    // end of dev purposes

    const similarCalls = top5Calls.map((call) => ({
      callSid: call.callSid,
      similarity: Number((Math.random() * (0.95 - 0.6) + 0.6).toFixed(2)), // rand 0.6-0.95
      id: makeId("similar-call"),
    }));

    const newMatches = similarCalls.filter((callMatch) =>
      this.store.call.callContext.similarCalls.some(
        (call) => call.callSid !== callMatch.callSid
      )
    );

    const callRecs = await Promise.all(
      newMatches
        .map((call) => call.callSid)
        .map((callSid) => getCallItem(callSid))
    );

    const callMap = callRecs.reduce(
      (acc, cur) => Object.assign(acc, { [cur.callSid]: cur }),
      {} as { [key: string]: CallRecord }
    );

    const newFeedback = newMatches
      .map((match) => ({ call: callMap[match.callSid], match }))
      .filter((data) => !!data.call)
      .flatMap((data) =>
        data.call.feedback.map((annotation) => ({
          annotation,
          match: data.match,
        }))
      );

    this.store.setContext({ similarCalls });

    log.debug("sub.recall", "newFeedback", callRecs, newFeedback);

    newFeedback.forEach((feedback) =>
      this.addRecallAnnotation(feedback.match, feedback.annotation)
    );
  };

  addRecallAnnotation = (match: SimilarCall, annotation: Annotation) => {
    addSyncLogItem({
      actions: ["Updated Instructions"],
      callSid: match.callSid,
      description: `Recall identified a new relevant conversation and supplied the bot with the annotation: ${annotation.comment}`,
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
