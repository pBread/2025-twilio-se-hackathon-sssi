export const SYNC_CALL_MAP_NAME = "calls";
export const SYNC_CONFIG_NAME = "config";

export function callMapItemName(callSid: string) {
  return `call-${callSid}`;
}

export function isCallId(it: any) {
  return /^call-CA[0-9A-Za-z]{32}$/.test(it);
}

export function logListName(callSid: string) {
  return `logs-${callSid}`;
}

export function isLogListName(it: any) {
  return /^logs-CA[0-9A-Za-z]{32}$/.test(it);
}

export function msgMapName(callSid: string) {
  return `msgs-${callSid}`;
}

export function isMsgMapName(it: any) {
  return /^msgs-CA[0-9A-Za-z]{32}$/.test(it);
}
