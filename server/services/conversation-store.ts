import diff from "deep-diff";
import merge from "deepmerge";
import { CallContext, CallRecord } from "../../shared/entities";
import bot from "../bot/conscious";
import governanceBot from "../bot/subconscious/governance";
import { setSyncCallItem } from "./sync-service";

export class ConversationStore {
  constructor(call: CallRecord) {
    const conscious = { instructions: bot.getInstructions(call.callContext) };
    const subconscious = {
      governanceInstructions: governanceBot.getInstructions(call.callContext),
    };

    const _config = merge.all([
      call,
      { config: { conscious, subconscious } },
    ]) as CallRecord;

    this._call = JSON.parse(JSON.stringify(_config)) as CallRecord;
    setSyncCallItem(this._call);
  }

  _call: CallRecord;
  get call() {
    return this._call;
  }
  set call(call: CallRecord) {
    const updates = diff(this._call, call);
    if (updates) setSyncCallItem(call);
    this._call = call;
  }

  setContext = (ctx: Partial<CallContext>) => {};
}
