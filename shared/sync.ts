export const SYNC_CALL_MAP_NAME = "calls";
export const SYNC_CONFIG_NAME = "config";

export function callMapItemName(callSid: string) {
  return `call-${callSid}`;
}

export function logListName(callSid: string) {
  return `logs-${callSid}`;
}

export function msgMapName(callSid: string) {
  return `msgs-${callSid}`;
}
