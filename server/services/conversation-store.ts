import {
  CallContext,
  CallRecord,
  DemoConfiguration,
} from "../../shared/entities";
import bot from "../bot/conscious";
import governanceBot from "../bot/subconscious/governance";
import merge from "deepmerge";
import log from "../logger";

export class ConversationStore {
  call: CallRecord;
  constructor(call: CallRecord) {
    const conscious = { instructions: bot.getInstructions(call.callContext) };
    const subconscious = {
      governanceInstructions: governanceBot.getInstructions(call.callContext),
    };

    const _config = merge.all([
      call,
      { config: { conscious, subconscious } },
    ]) as CallRecord;

    this.call = JSON.parse(JSON.stringify(_config)) as CallRecord;
  }

  setContext = (ctx: Partial<CallContext>) => {};
}
