import diff from "deep-diff";
import { pRateLimit } from "p-ratelimit";
import Twilio from "twilio";
import { SyncClient } from "twilio-sync";
import {
  EventRecord,
  OrderRecord,
  UserRecord,
  type AddLogRecord,
  type AIQuestion,
  type CallRecord,
  type DemoConfiguration,
  type LogRecord,
  type StoreMessage,
} from "../../shared/entities";
import { sampleData } from "../../shared/sample-data";
import {
  callMapItemName,
  isLogListName,
  isMsgMapName,
  logListName,
  msgMapName,
  SYNC_CALL_MAP_NAME,
  SYNC_CONFIG_NAME,
  SYNC_EVENT_MAP,
  SYNC_ORDER_MAP,
  SYNC_Q_MAP_NAME,
  SYNC_USER_MAP,
} from "../../shared/sync";
import bot from "../bot/conscious";
import { relayConfig } from "../bot/relay-config";
import {
  TWILIO_ACCOUNT_SID,
  TWILIO_API_KEY,
  TWILIO_API_SECRET,
  TWILIO_SYNC_SVC_SID,
} from "../env";
import log from "../logger";
import { makeId } from "../utils/misc";
import type { EntityService } from "./database-service";
import type { SyncMapContext } from "twilio/lib/rest/sync/v1/service/syncMap";
import { mockDatabase } from "../../shared/mock-database";

const rateLimitConfig = {
  interval: 1000, // 1000 ms == 1 second
  rate: 100, // 30 API calls per interval
  maxDelay: 30 * 1000, // an API call delayed > 10 sec is rejected
};

const limit = pRateLimit({ ...rateLimitConfig, concurrency: 50 }); // global limiter applied to everything to ensure concurrency & rates don't exceed Sync limitations

function composeDoubleLimiter() {
  const extraLimiter = pRateLimit({
    ...rateLimitConfig,
    concurrency: 1,
    maxDelay: 5 * 1000,
  });
  return async function <T>(fn: () => Promise<T>): Promise<T> {
    return limit(() => extraLimiter(fn));
  };
}

const limitConfig = composeDoubleLimiter(); // limiter to avoid race conditions for demo config
const limitCall = composeDoubleLimiter(); // limiter to avoid race conditions for call items
const limitMsg = composeDoubleLimiter(); // limiter to avoid race conditions for messages

const twilio = Twilio(TWILIO_API_KEY, TWILIO_API_SECRET, {
  accountSid: TWILIO_ACCOUNT_SID,
});

let syncWsClient: SyncClient | undefined;

const sync = twilio.sync.v1.services(TWILIO_SYNC_SVC_SID);
const syncCallMapApi = sync.syncMaps(SYNC_CALL_MAP_NAME);
const syncDemoConfigApi = sync.documents(SYNC_CONFIG_NAME);
const syncQuestionMapApi = sync.syncMaps(SYNC_Q_MAP_NAME);

const defaultDemoConfig: DemoConfiguration = {
  ...sampleData.config,
  relayConfig,
  consciousModel: bot.model,
};

export let demoConfig: DemoConfiguration = JSON.parse(
  JSON.stringify(defaultDemoConfig)
); // to do: update with data from demo

/****************************************************
 Setup Sync
****************************************************/
export async function setupSync() {
  console.log("setting up sync");

  try {
    await limit(() =>
      sync.documents.create({ uniqueName: SYNC_CONFIG_NAME, data: demoConfig })
    );

    console.log("created sync document for demo config");
  } catch (error) {}

  try {
    await limit(() => sync.syncMaps.create({ uniqueName: SYNC_CALL_MAP_NAME }));
    console.log("created sync map to store call details");
  } catch (error) {}

  try {
    await limit(() => sync.syncMaps.create({ uniqueName: SYNC_Q_MAP_NAME }));
    console.log("created sync map to ai questions");
  } catch (error) {}

  try {
    await limit(() => sync.syncMaps.create({ uniqueName: SYNC_EVENT_MAP }));
    console.log("created sync map to store events");
  } catch (error) {}

  try {
    await limit(() => sync.syncMaps.create({ uniqueName: SYNC_ORDER_MAP }));
    console.log("created sync map to store orders");
  } catch (error) {}

  try {
    await limit(() => sync.syncMaps.create({ uniqueName: SYNC_USER_MAP }));
    console.log("created sync map to store users");
  } catch (error) {}

  try {
    console.log("sync websocket client initializing");
    await initSyncClient();
    console.log("sync websocket client connected");
  } catch (error) {}
}

async function initSyncClient() {
  const identity =
    "server-" +
    Math.floor(Math.random() * 9999)
      .toString()
      .padStart(4, "0");

  const token = createSyncToken(identity);

  syncWsClient = new SyncClient(token.token);

  syncWsClient.on("tokenAboutToExpire", () =>
    syncWsClient?.updateToken(createSyncToken(identity).token)
  );

  await syncWsClient
    .document(SYNC_CONFIG_NAME)
    .then((doc) => {
      demoConfig = doc.data as DemoConfiguration;

      doc.on("updated", (ev) => {
        const delta = diff(demoConfig, ev.data);
        const kind = {
          A: "array change",
          D: "deleted",
          E: "edited",
          N: "New",
        };

        if (delta)
          log.info(
            "sync",
            `demo configuration updated:`,
            delta
              .map((item) => `(${kind[item.kind]} ${item.path?.join(".")})`)
              .join(",")
          );

        demoConfig = ev.data;
      });
    })
    .catch((err) => {
      log.error("sync", "initSyncClient error subscribing to demo", err);
    });

  await syncWsClient.map(SYNC_Q_MAP_NAME).then((map) => {
    map.on("itemUpdated", (ev) => {
      const question = ev.item.data as AIQuestion;
      log.info("sync", `ai question answered: ${question.answer}`);
    });
  });

  syncWsClient?.on("connectionStateChanged", (state) => {
    log.info("sync", `sync websocket client status: ${state}`);
  });
}

export function createSyncToken(identity: string) {
  const AccessToken = Twilio.jwt.AccessToken;
  const SyncGrant = AccessToken.SyncGrant;

  const token = new AccessToken(
    TWILIO_ACCOUNT_SID,
    TWILIO_API_KEY,
    TWILIO_API_SECRET,
    { identity }
  );

  token.addGrant(
    new SyncGrant({ serviceSid: process.env.TWILIO_SYNC_SVC_SID })
  );

  return { identity, token: token.toJwt() };
}

/****************************************************
 Higher Level
****************************************************/
export async function initCall(call: CallRecord) {
  await createSyncLogList(call.callSid)
    .then(() => console.log("createSyncLogList success"))
    .catch((err) => console.error("createSyncLogList error", err));

  await createSyncMsgMap(call.callSid)
    .then(() => console.log("createSyncMsgMap success"))
    .catch((err) => console.error("createSyncMsgMap error", err));

  await addSyncCallItem(call)
    .then(() => console.log("addSyncCallItem success"))
    .catch((err) => console.error("addSyncCallItem error", err));
}

async function destroyCall(callSid: string) {
  await limit(() =>
    destroySyncLogList(callSid)
      .then(() => console.log(`destroySyncLogList success ${callSid}`))
      .catch((err) => console.error("destroySyncLogList error", err))
  );

  await limit(() =>
    destroySyncMsgMap(callSid)
      .then(() => console.log(`destroySyncMsgMap success ${callSid}`))
      .catch((err) => console.error("destroySyncMsgMap error", err))
  );

  const questions = await getCallQuestions(callSid);
  await Promise.all(
    questions.map((question) => removeSyncQuestion(question.id))
  );

  await limit(() =>
    removeSyncCallItem(callSid)
      .then(() => console.log(`removeSyncCallItem success ${callSid}`))
      .catch((err) => console.error("removeSyncCallItem error", err))
  );
}

/****************************************************
 Demo Configuration
****************************************************/
async function updateDemoConfig(config: DemoConfiguration) {
  return limitConfig(() => syncDemoConfigApi.update({ data: config }));
}

/****************************************************
 Call Map Items
****************************************************/
async function addSyncCallItem(call: CallRecord) {
  const key = callMapItemName(call.callSid);
  return limitCall(async () => {
    syncCallMapApi.syncMapItems.create({
      key,
      data: call,
    });
  });
}

async function getAllCallItems() {
  return limit(() =>
    syncCallMapApi.syncMapItems
      .list()
      .then((res) => res.map((item) => item.data) as CallRecord[])
  );
}

export async function getCallItem(callSid: string) {
  const key = callMapItemName(callSid);
  return limit(() =>
    syncCallMapApi
      .syncMapItems(key)
      .fetch()
      .then((res) => res.data as CallRecord)
  );
}

export async function updateSyncCallItem(
  callSid: string,
  update: Partial<CallRecord>
) {
  const key = callMapItemName(callSid);
  const call = await getCallItem(callSid);

  return limitCall(() =>
    syncCallMapApi.syncMapItems(key).update({ data: { ...call, ...update } })
  );
}

export async function setSyncCallItem(call: CallRecord) {
  const key = callMapItemName(call.callSid);

  return limitCall(() =>
    syncCallMapApi.syncMapItems(key).update({ data: call })
  );
}

async function removeSyncCallItem(callSid: string) {
  const key = callMapItemName(callSid);
  return limit(() => syncCallMapApi.syncMapItems(key).remove());
}

/****************************************************
 Logs
****************************************************/
async function getAllSyncLogLists() {
  const items = await limit(() => sync.syncLists.list());
  return items.filter((item) => isLogListName(item.uniqueName));
}

export async function getCallLogs(callSid: string) {
  const uniqueName = logListName(callSid);
  return limit(() =>
    sync
      .syncLists(uniqueName)
      .syncListItems.list()
      .then((res) => res.map((item) => item.data) as LogRecord[])
  );
}

async function createSyncLogList(callSid: string) {
  const uniqueName = logListName(callSid);
  return limit(() => sync.syncLists.create({ uniqueName }));
}

async function destroySyncLogList(callSid: string) {
  const uniqueName = logListName(callSid);
  return limit(() => sync.syncLists(uniqueName).remove());
}

async function getSyncList(callSid: string) {
  const uniqueName = logListName(callSid);
  return limit(() => sync.syncLists(uniqueName).fetch());
}

let logSeg = 0;
export async function addSyncLogItem(params: AddLogRecord) {
  const uniqueName = logListName(params.callSid);

  const data: LogRecord = {
    id: makeId("log"),
    createdAt: new Date().toLocaleString(),
    seq: logSeg++,
    ...params,
  };

  return limit(() => sync.syncLists(uniqueName).syncListItems.create({ data }));
}

/****************************************************
 Messages
****************************************************/
async function getAllSyncMsgMaps() {
  const maps = await limit(() => sync.syncMaps.list());
  return maps.filter((item) => isMsgMapName(item.uniqueName));
}

export async function getCallMessages(callSid: string) {
  const uniqueName = msgMapName(callSid);
  return limit(() =>
    sync
      .syncMaps(uniqueName)
      .syncMapItems.list()
      .then((res) => res.map((item) => item.data))
  );
}

async function createSyncMsgMap(callSid: string) {
  const uniqueName = msgMapName(callSid);
  return limit(() => sync.syncMaps.create({ uniqueName }));
}

async function destroySyncMsgMap(callSid: string) {
  const uniqueName = msgMapName(callSid);
  return limit(() => sync.syncMaps(uniqueName).remove());
}

export async function addSyncMsgItem(msg: StoreMessage) {
  const uniqueName = msgMapName(msg.callSid);

  return limitMsg(async () => {
    sync.syncMaps(uniqueName).syncMapItems.create({ key: msg.id, data: msg });
  });
}

async function updateSyncMsgItem(msg: StoreMessage) {
  const uniqueName = msgMapName(msg.callSid);
  return limitMsg(() =>
    sync.syncMaps(uniqueName).syncMapItems(msg.id).update({ data: msg })
  );
}

export async function setSyncMsgItem(msg: StoreMessage) {
  const uniqueName = msgMapName(msg.callSid);

  return limitMsg(async () => {
    sync.syncMaps(uniqueName).syncMapItems(msg.id).update({ data: msg });
  });
}

export async function removeSyncMsgItem(msg: StoreMessage) {
  const uniqueName = msgMapName(msg.callSid);

  return limit(() => sync.syncMaps(uniqueName).syncMapItems(msg.id).remove());
}

/****************************************************
 Questions
****************************************************/
export async function addSyncQuestion(data: AIQuestion) {
  const key = data.id;
  return limit(() => syncQuestionMapApi.syncMapItems.create({ key, data }));
}

async function removeSyncQuestion(questionId: string) {
  return limit(() => syncQuestionMapApi.syncMapItems(questionId).remove());
}

async function getAllQuestions() {
  return limit(() =>
    syncQuestionMapApi.syncMapItems
      .list()
      .then((res) => res.map((item) => item.data as AIQuestion))
  );
}

async function getCallQuestions(callSid: string) {
  const questions = await getAllQuestions();

  return questions.filter((question) => question.callSid === callSid);
}

export async function addSyncQuestionListener(
  questionId: string,
  handler: (question: AIQuestion) => void
) {
  syncWsClient?.map(SYNC_Q_MAP_NAME).then((map) =>
    map.on("itemUpdated", (ev) => {
      const question = ev.item.data as AIQuestion;
      if (question.id === questionId) handler(question);
    })
  );
}

/****************************************************
 Database
****************************************************/
class SyncEntityService<T extends { id: string }, P extends Partial<T>>
  implements EntityService<T, P>
{
  map: SyncMapContext;

  constructor(public name: string, private creator: (param: P) => T) {
    this.map = sync.syncMaps(this.name);
  }

  init = async () => {
    try {
      // create map if it doesn't exist
      const map = await sync.syncMaps.create({ uniqueName: this.name });

      if (map) console.log(`created sync map ${this.name}`);
      else throw Error(`Error creating Sync Map for ${this.name}`);
    } catch (error) {
      if ((error as { code?: number })?.code === 54301) return; // ignore sync map already exists

      log.error(`sync.${this.name}`, "Error creating Sync Map", error);
    }
  };

  add = async (partial: P) => {
    const data = this.creator(partial);
    const result = await limit(() =>
      this.map.syncMapItems.create({ key: data.id, data })
    );
    return data as T;
  };

  getById = async (id: string) => {
    const result = await limit(() => this.map.syncMapItems(id).fetch());
    return result.data as T;
  };

  list = async () => {
    const docs = await limit(() => this.map.syncMapItems.list());
    return docs.map((doc) => doc.data) as T[];
  };

  remove = async (id: string) => {
    const result = await limit(() => this.map.syncMapItems(id).remove());
    return result;
  };

  set = async (id: string, doc: T) => {
    await limit(() => this.map.syncMapItems(id).update({ data: doc }));
    const data = await this.getById(id);
    return data as T;
  };

  setIn = async (id: string, update: Partial<T>) => {
    const cur = await this.getById(id);
    const next = { ...cur, ...update };
    await limit(() => this.map.syncMapItems(id).update({ data: next }));

    return next as T;
  };
}

const eventApi = new SyncEntityService<EventRecord, EventRecord>(
  SYNC_EVENT_MAP,
  (item) => ({
    ...item,
    id: item.id ?? makeId("ev"),
  })
);

const orderApi = new SyncEntityService<OrderRecord, OrderRecord>(
  SYNC_ORDER_MAP,
  (item) => ({
    ...item,
    id: item.id ?? makeId("or"),
  })
);

const userApi = new SyncEntityService<UserRecord, UserRecord>(
  SYNC_USER_MAP,
  (item) => ({
    ...item,
    id: item.id ?? makeId("us"),
  })
);

/****************************************************
 Demo Data Management
****************************************************/
export async function clearSyncData() {
  console.log("clearSyncData");

  demoConfig = JSON.parse(JSON.stringify(defaultDemoConfig));
  console.log("resetting demo config");
  await updateDemoConfig(demoConfig);

  const calls = await getAllCallItems();
  console.log(`destroying ${calls.length} calls`);
  await Promise.all(calls.map((call) => destroyCall(call.callSid)));

  const logLists = await getAllSyncLogLists();
  if (logLists.length)
    console.log(
      `${logLists.length} log lists were missed. attempting to destroy`
    );
  await Promise.all(
    logLists.map((list) => destroySyncLogList(list.uniqueName))
  );
  const msgMaps = await getAllSyncMsgMaps();
  if (msgMaps.length)
    console.log(
      `${msgMaps.length} msg maps were missed. attempting to destroy`
    );
  await Promise.all(msgMaps.map((map) => destroySyncMsgMap(map.uniqueName)));

  const questions = await getAllQuestions();
  if (questions.length)
    console.log(
      `${questions.length} questions were missed. attempting to destroy.`
    );
  await Promise.all(
    questions.map((question) => removeSyncQuestion(question.id))
  );

  console.log("resetting events");
  const events = await eventApi.list();
  console.log(`deleting ${events.length} old event records`);
  await Promise.all(events.map((item) => eventApi.remove(item.id)));

  console.log("resetting orders");
  const orders = await orderApi.list();
  console.log(`deleting ${orders.length} old event records`);
  await Promise.all(orders.map((item) => orderApi.remove(item.id)));

  console.log("resetting users");
  const users = await userApi.list();
  console.log(`deleting ${users.length} old event records`);
  await Promise.all(users.map((item) => userApi.remove(item.id)));
}

export async function populateSampleSyncData() {
  console.log("populateSampleData");

  await updateDemoConfig(demoConfig);

  await Promise.all(sampleData.calls.map(initCall)).then(() =>
    console.log("populated call records")
  );
  await Promise.all(
    Object.values(sampleData.callLogs).flat().map(addSyncLogItem)
  ).then(() => console.log("populated call logs"));
  await Promise.all(
    Object.values(sampleData.callMessages).flat().map(addSyncMsgItem)
  ).then(() => console.log("populated messages"));

  console.log(`loading ${mockDatabase.orders.length} new event records`);
  await Promise.all(
    mockDatabase.events.map((item) =>
      eventApi
        .add(item)
        .catch(() => console.log(`unable to load event ${item.id}`))
    )
  );

  console.log(`loading ${mockDatabase.orders.length} new oder records`);
  await Promise.all(
    mockDatabase.orders.map((item) =>
      orderApi
        .add(item)
        .catch(() => console.log(`unable to load order ${item.id}`))
    )
  );

  console.log(`loading ${mockDatabase.users.length} new event records`);
  await Promise.all(
    mockDatabase.users.map((item) =>
      userApi
        .add(item)
        .catch(() => console.log(`unable to load user ${item.id}`))
    )
  );
}
