import diff from "deep-diff";
import type {
  AddBotDTMF,
  AddBotText,
  AddBotTool,
  AddHumanDTMF,
  AddHumanText,
  AddSystemMessage,
  AIQuestion,
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
import { ignore, makeId, makeTimestamp } from "../utils/misc";
import {
  addSyncMsgItem,
  isErrorTypeNotFound,
  removeSyncMsgItem,
  setSyncCallItem,
  updateSyncMsgItem,
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

  parkingLot: string | undefined;
  setHumanInput = (update: AIQuestion) => {
    let content =
      "IMPORTANT UPDATE: A human agent has responded to your previous question. It is critical that your next response informs the customer.\n";

    if (update.status !== "new")
      content += `The request has been ${update.status}. \n`;

    content += `Here is the comment they provided: ${update.answer}. \n\n`;
    content += `As a reminder, here is the question you asked: ${update.question}`;

    this.parkingLot = content;
  };

  setInstructions = (instructions: string) => {
    this.addSystemMessage({
      content: instructions,
      id: `instructions-${this.call.callSid}`,
      flag: "no-display",
    });
  };

  setCall = (update: Partial<CallRecord>) => {
    const call = { ...this.call, ...update };
    this.call = call;
  };

  setContext = (ctx: Partial<CallContext>) => {
    this.call = {
      ...this.call,
      callContext: { ...this.call.callContext, ...ctx },
    };

    this.addSystemMessage({
      content: `Here is the database record of a person believed to be the person you are speaking to. Do not assume this is correct. You should confirm with them. Record: ${JSON.stringify(
        this.call.callContext?.user
      )}. `,
      id: `context-${this.call.callSid}`,
    });
  };

  msgMap: StoreMessageMap; // note: msgs are stored in a map. adding a message w/the same id as another will override the previous
  seq: number = 0; // sequence tracks the order in which messages were added. seq is not guaranteed to be the index of a message, only that it is greater than the last message

  forceSync = (id: string) => {
    const msg = this.msgMap.get(id);
    if (!msg) return;
    if (msg) updateSyncMsgItem(msg).catch(ignore(isErrorTypeNotFound));
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
    const id = params.id ?? makeId("bot");
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
    const id = params.id ?? makeId("bot");
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
    const id = params.id ?? makeId("human");
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
    const id = params.id ?? makeId("human");
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
    const id = params.id ?? makeId("sys");
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

    if (prev) updateSyncMsgItem(msg).catch(ignore(isErrorTypeNotFound));
    else addSyncMsgItem(msg);

    return this;
  };
}
