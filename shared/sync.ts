export const SYNC_CALL_MAP_NAME = "calls";
export const SYNC_CONFIG_NAME = "config";
export const SYNC_Q_MAP_NAME = "ai_requests";

export const SYNC_EVENT_MAP = "events";
export const SYNC_ORDER_MAP = "orders";
export const SYNC_USER_MAP = "users";

const callSidRe = /CA[a-f0-9]{32}/;

function getSid(str: string) {
  const match = str.match(callSidRe);
  if (!match) throw Error(`No Call SID found in ${str}`);

  return match[0];
}

export function callMapItemName(callSid: string) {
  const sid = getSid(callSid);
  return `call-${sid}`;
}

export function isCallId(id: any) {
  return /^call-CA[0-9A-Za-z]{32}$/.test(id);
}

export function logListName(callSid: string) {
  const sid = getSid(callSid);
  return `logs-${sid}`;
}

export function isLogListName(id: any) {
  return /^logs-CA[0-9A-Za-z]{32}$/.test(id);
}

// note: this syntax is referenced in the flex-plugin but it does not use this helper
export function msgMapName(callSid: string) {
  const sid = getSid(callSid);
  return `msgs-${sid}`;
}

export function isMsgMapName(id: any) {
  return /^msgs-CA[0-9A-Za-z]{32}$/.test(id);
}
