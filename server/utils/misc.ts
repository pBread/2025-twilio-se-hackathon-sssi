import { APP_DEBUG } from "../env";
import log from "../logger";

export function getJSONSize(obj: {}) {
  function getStringBytes(str: string) {
    return new TextEncoder().encode(str).length;
  }

  if (obj === null || obj === undefined) return "4";
  if (typeof obj !== "object")
    return getStringBytes(JSON.stringify(obj)).toLocaleString();

  let size = 0;
  size += 2; // Add 2 bytes for opening and closing braces/brackets
  const entries = Object.entries(obj); // Get all entries (works for both objects and arrays)
  size += Math.max(0, entries.length - 1); // Add commas between elements (entries.length - 1 commas)

  // Process each key-value pair
  for (const [key, value] of entries) {
    if (!Array.isArray(obj)) {
      // For objects, add the key size plus the colon and space
      size += getStringBytes(JSON.stringify(key)) + 2;
    }

    // Add the value size
    if (typeof value === "object" && value !== null) {
      size += parseInt(getJSONSize(value).replace(/,/g, ""), 10);
    } else {
      size += getStringBytes(JSON.stringify(value));
    }
  }

  return size.toLocaleString();
}

export function makeTimestamp() {
  return new Date().toLocaleString();
}

export function makeId(prefix = "") {
  const CODE_LENGTH = 10;
  const code = randStr(CODE_LENGTH);

  if (prefix) return `${prefix}-${code}`;
  return code;
}

function randStr(length: number) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    result += chars[randomIndex];
  }

  return result;
}

export function safeParse(data: any) {
  try {
    return JSON.parse(data);
  } catch (error) {}
}

export function ignore(
  checks: (error: any) => boolean | ((error: any) => boolean)[]
) {
  const _checks = Array.isArray(checks) ? checks : [checks];

  return (error: any) => {
    const hit = _checks.find((check) => check(error));
    if (hit) {
      if (APP_DEBUG)
        log.debug(
          "ignore",
          `error was ignored. check: `,
          hit,
          "\nerror: ",
          error
        );

      return;
    }
    throw error;
  };
}
