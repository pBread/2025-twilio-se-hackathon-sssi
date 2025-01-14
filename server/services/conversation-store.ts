import {
  CallContext,
  CallRecord,
  DemoConfiguration,
} from "../../shared/entities";

export class ConversationStore {
  call: CallRecord;
  constructor(config: CallRecord) {
    this.call = JSON.parse(JSON.stringify(config)) as CallRecord;
  }

  setContext = (ctx: Partial<CallContext>) => {};
}
