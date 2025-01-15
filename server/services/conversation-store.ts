import diff from "deep-diff";
import {
  AddBotDTMF,
  AddBotText,
  AddBotTool,
  AddHumanDTMF,
  AddHumanText,
  AddSystemMessage,
  BotDTMF,
  BotText,
  BotTool,
  CallContext,
  CallRecord,
  HumanDTMF,
  HumanText,
  StoreMessage,
  SystemMessage,
} from "../../shared/entities";
import log from "../logger";
import { makeId, makeTimestamp } from "../utils/misc";
import {
  addSyncMsgItem,
  removeSyncMsgItem,
  setSyncCallItem,
  setSyncMsgItem,
} from "./sync-service";

export class ConversationStore {
  constructor(call: CallRecord) {
    this.msgMap = new StoreMessageMap();

    this._call = JSON.parse(JSON.stringify(call)) as CallRecord;
  }

  /****************************************************
   Call Data Methods
  ****************************************************/
  private _call: CallRecord;
  get call() {
    return this._call;
  }
  set call(call: CallRecord) {
    const updates = diff(this._call, call);
    if (updates) setSyncCallItem(call);
    this._call = call;
  }

  setCall = (update: Partial<CallRecord>) => {
    this.call = { ...this.call, ...update };
  };

  setContext = (ctx: Partial<CallContext>) => {
    this.call = {
      ...this.call,
      callContext: { ...this.call.callContext, ...ctx },
    };
  };

  msgMap: StoreMessageMap; // note: msgs are stored in a map. adding a message w/the same id as another will override the previous
  seq: number = 0; // sequence tracks the order in which messages were added. seq is not guaranteed to be the index of a message, only that it is greater than the last message

  forceSync = (id: string) => {
    const msg = this.msgMap.get(id);
    if (!msg) return;
    if (msg) setSyncMsgItem(msg);
  };

  deleteMsg = (id: string) => {
    const msg = this.msgMap.get(id);
    if (msg) removeSyncMsgItem(msg);

    this.msgMap.delete(id);
  };
  getMessage = (id: string) => this.msgMap.get(id);
  getMessages = () =>
    [...this.msgMap.values()].map((msg, _index) => ({ ...msg, _index }));

  addBotDTMF = (params: AddBotDTMF): BotDTMF => {
    const seq = this.seq++;
    const id = params.id ?? makeId("bot", `${seq}`);
    const msg: BotDTMF = {
      ...params,
      callSid: this.call.callSid,
      createdAt: makeTimestamp(),
      seq,
      id,
      role: "bot",
      type: "dtmf",
    };

    this.msgMap.set(id, msg);

    // log.info(
    //   "store",
    //   `added ${msg.role} ${msg.type} message to local state, id="${msg.id}"`
    // );
    return msg;
  };

  addBotText = (params: AddBotText): BotText => {
    const seq = this.seq++;
    const id = params.id ?? makeId("bot", `${seq}`);
    const msg: BotText = {
      ...params,
      callSid: this.call.callSid,
      createdAt: makeTimestamp(),
      seq,
      id,
      role: "bot",
      type: "text",
    };

    this.msgMap.set(id, msg);

    // log.info(
    //   "store",
    //   `added ${msg.role} ${msg.type} message to local state, id="${msg.id}"`
    // );

    return msg;
  };

  addBotTool = (params: AddBotTool): BotTool => {
    const msg: BotTool = {
      seq: this.seq++,
      ...params,
      callSid: this.call.callSid,
      createdAt: makeTimestamp(),
      role: "bot",
      type: "tool",
    };

    this.msgMap.set(msg.id, msg);

    // log.info(
    //   "store",
    //   `added ${msg.role} ${msg.type} to local state, id="${msg.id}"`
    // );
    return msg;
  };

  setBotToolResult = (toolId: string, result: object) => {
    const toolMsg = this.getMessages().find(
      (msg) =>
        msg.role === "bot" &&
        msg.type === "tool" &&
        msg.tool_calls.some((tool) => tool.id === toolId)
    ) as BotTool | undefined;

    if (!toolMsg)
      return log.error(
        "store",
        `Unable to set tool result because tool message (${toolId}) not found.`
      );

    const tool = toolMsg.tool_calls.find((tool) => tool.id === toolId);
    if (!tool) throw Error(`unreachable error setBotToolResult`);

    tool.result = result;

    this.msgMap.set(toolMsg.id, toolMsg);

    return toolMsg;
  };

  addHumanDTMF = (params: AddHumanDTMF): HumanDTMF => {
    const seq = this.seq++;
    const id = params.id ?? makeId("human", `${seq}`);
    const msg: HumanDTMF = {
      ...params,
      callSid: this.call.callSid,
      createdAt: makeTimestamp(),
      id,
      seq,
      role: "human",
      type: "dtmf",
    };

    this.msgMap.set(id, msg);

    // log.info(
    //   "store",
    //   `added ${msg.role} ${msg.type} message to local state, id="${msg.id}"`
    // );
    return msg;
  };

  addHumanText = (params: AddHumanText): HumanText => {
    const seq = this.seq++;
    const id = params.id ?? makeId("human", `${seq}`);
    const msg: HumanText = {
      ...params,
      callSid: this.call.callSid,
      createdAt: makeTimestamp(),
      id,
      seq,
      role: "human",
      type: "text",
    };

    this.msgMap.set(id, msg);

    // log.info(
    //   "store",
    //   `added ${msg.role} ${msg.type} message to local state, id="${msg.id}"`
    // );
    return msg;
  };

  addSystemMessage = (params: AddSystemMessage): SystemMessage => {
    const seq = this.seq++;
    const id = params.id ?? makeId("sys", `${seq}`);
    const msg: SystemMessage = {
      ...params,
      callSid: this.call.callSid,
      createdAt: makeTimestamp(),
      id,
      seq,
      role: "system",
    };
    this.msgMap.set(id, msg);

    // log.info(
    //   "store",
    //   `added ${msg.role} message to local state, id="${msg.id}"`
    // );

    return msg;
  };
}

class StoreMessageMap extends Map<string, StoreMessage> {
  constructor() {
    super();
  }

  set = (key: string, msg: StoreMessage) => {
    const prev = this.get(key);
    super.set(key, msg);

    if (prev) {
      const changes = diff(prev, msg);
      if (changes) setSyncMsgItem(msg);
    } else addSyncMsgItem(msg);

    return this;
  };
}
