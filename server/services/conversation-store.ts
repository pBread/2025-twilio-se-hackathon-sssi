import diff from "deep-diff";
import {
  AddSystemMessage,
  CallContext,
  CallRecord,
  StoreMessage,
  SystemMessage,
} from "../../shared/entities";
import log from "../logger";
import { makeId, makeTimestamp } from "../utils/misc";
import {
  addSyncMsgItem,
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

  private msgMap: StoreMessageMap; // note: msgs are stored in a map. adding a message w/the same id as another will override the previous
  seq: number = 0; // sequence tracks the order in which messages were added. seq is not guaranteed to be the index of a message, only that it is greater than the last message

  deleteMsg = (id: string) => this.msgMap.delete(id);
  getMessage = (id: string) => this.msgMap.get(id);
  getMessages = () =>
    [...this.msgMap.values()].map((msg, _index) => ({ ...msg, _index }));

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
      log.debug("store", changes, msg);
      if (changes) setSyncMsgItem(msg);
    } else addSyncMsgItem(msg);

    return this;
  };
}
