import type { GovernanceStepStatus, LogActions } from "../../shared/entities";
import type { ConversationStore } from "./conversation-store";
import { addSyncLogItem } from "./sync-service";

export class SubsconsciousService {
  constructor(private store: ConversationStore) {}

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
