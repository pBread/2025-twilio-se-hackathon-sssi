import fs from "fs";
import path from "path";

/****************************************************
 - This is a stopwatch-style logger for development, designed to aid in debugging latency issues. Each log entry includes the elapsed time since the logger started and the time since the last log, enabling quick identification of latency patterns.
 - Logs are saved in the `logs/` directory with filenames based on the start timestamp, allowing easy identification of log sessions.
 - This logger is for development use only, as it is not optimized for production environments.
****************************************************/

const LOG_DIR = path.join(__dirname, "../logs");
try {
  if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR);
} catch (error) {
  console.log("unable to create logs directory", error);
}

// Clean up old log files
const LOG_FILE_LIMIT = parseInt(process.env.LOG_FILE_LIMIT ?? "") || 25;

try {
  const filesToDelete = fs
    .readdirSync(LOG_DIR)
    .map((file) => ({
      name: file,
      path: path.join(LOG_DIR, file),
      ctime: fs.statSync(path.join(LOG_DIR, file)).ctime,
    }))
    .sort((a, b) => b.ctime.getTime() - a.ctime.getTime())
    .slice(LOG_FILE_LIMIT);

  if (filesToDelete.length > 0) {
    console.log(`deleting the ${filesToDelete.length} oldest log files`);
    filesToDelete.forEach((file) => fs.unlinkSync(file.path));
  }
} catch (error) {
  console.log("error cleaning up old log files", error);
}

const NS_PAD = 17;

const COLORS = {
  red: "\x1b[31m",
  yellow: "\x1b[33m",

  cyan: "\x1b[36m",
  green: "\x1b[32m",
  magenta: "\x1b[35m",

  clear: "\x1b[0m",
};

const Levels = {
  DEBUG: COLORS.cyan,
  INFO: "", // empty, so it defaults to the user's terminal style settings
  ERROR: COLORS.red,
  WARN: COLORS.yellow,

  CLEAR: "\x1b[0m",
  INVERT: "\x1b[7m",
} as const;

export class StopwatchLogger {
  start: number; // initialization timestamp
  prev: number; // previous log's timestamp

  date: Date;
  logDateString?: string;
  logPath?: string;
  private _logStream?: fs.WriteStream;

  constructor() {
    this.date = new Date();
    this.prev = Date.now();
    this.start = Date.now();

    this.reset();
  }

  callSid: string | null = null;
  setCallSid = (callSid: string | null) => {
    if (callSid === this.callSid) return;
    this.callSid = callSid;
    this.reset();
  };

  reset = () => {
    this.date = new Date();
    this.start = Date.now();
    this.prev = Date.now();

    const dateStr = `${this.date.getMonth() + 1}-${this.date.getDate()}`;
    const timeStr = `${this.date
      .getHours()
      .toString()
      .padStart(2, "0")}:${this.date
      .getMinutes()
      .toString()
      .padStart(2, "0")}:${this.date
      .getSeconds()
      .toString()
      .padStart(2, "0")}:${this.date
      .getMilliseconds()
      .toString()
      .padStart(3, "0")}`;
    const dtStr = `${dateStr}_${timeStr}`;
    this.logDateString = dtStr;
    this.logPath = path.join(LOG_DIR, `${dtStr}.txt`);
    this._logStream = undefined;
  };

  get logStream() {
    if (this._logStream) return this._logStream;

    if (!this.logPath) return undefined;

    if (!fs.existsSync(this.logPath)) fs.writeFileSync(this.logPath, ``);

    this._logStream = fs.createWriteStream(this.logPath, {});
    this._logStream?.write(`${this.date.toString()}\n`);

    return this._logStream;
  }

  sinceStart = () => {
    const elapsed = Date.now() - this.start;
    const min = Math.floor(elapsed / (60 * 1000));
    const sec = Math.floor((elapsed % (60 * 1000)) / 1000);
    const ms = elapsed % 1000;

    return (
      `${min.toString().padStart(2, "0")}m ` +
      `${sec.toString().padStart(2, "0")}s ` +
      `${ms.toString().padStart(3, "0")}ms`
    );
  };

  sinceLast = () => {
    const elapsed = Date.now() - this.prev;
    this.prev = Date.now();

    const sec = Math.floor((elapsed % (60 * 1000)) / 1000);
    const ms = elapsed % 1000;

    return (
      "+" +
      sec.toString().padStart(2, "0") +
      "." +
      ms.toString().padStart(3, "0")
    );
  };

  hasWarned = false;
  log = (level: keyof typeof Levels, namespace: string, ...msgs: any[]) => {
    const timeStamp = `${this.sinceStart()} ${this.sinceLast()}`;

    const ns = namespace.padEnd(NS_PAD, " ");

    if (this.callSid) {
      try {
        const formattedMsg = msgs
          .map((m) => (typeof m === "object" ? JSON.stringify(m, null, 2) : m))
          .join(" ");

        this.logStream?.write(
          `${level.padEnd(7, " ")} ${timeStamp} ${ns} ${formattedMsg}\n`
        );
      } catch (error) {}
    }

    const color = Levels[level];

    let _msgs = msgs.flatMap((msg) =>
      (typeof msg === "object" && msg !== null) || Array.isArray(msg)
        ? [Levels.CLEAR, msg, color]
        : String(msg)
    );

    console.log(
      `${color}${Levels.INVERT}${timeStamp} ${ns}${Levels.CLEAR}${color} `,
      ..._msgs,
      Levels.CLEAR
    );
  };

  debug = (ns: string, ...msg: any) => this.log("DEBUG", ns, ...msg);
  error = (ns: string, ...msg: any) => this.log("ERROR", ns, ...msg);
  info = (ns: string, ...msg: any) => this.log("INFO", ns, ...msg);
  warn = (ns: string, ...msg: any) => this.log("WARN", ns, ...msg);

  green = (...msgs: any) => console.log(COLORS.green, ...msgs, COLORS.clear);
  red = (...msgs: any) => console.log(COLORS.red, ...msgs, COLORS.clear);
  yellow = (...msgs: any) => console.log(COLORS.yellow, ...msgs, COLORS.clear);
}

const log = new StopwatchLogger();
export default log;

/** 
const NS_FLAGS = {
  route: "\x1b[34m●\x1b[0m", // blue
  webhook: "\x1b[32m●\x1b[0m", // green
} as const;

type NS = keyof typeof NS_FLAGS;

const namespaceColors = {
  blue: "\x1b[34m●\x1b[0m",
  green: "\x1b[32m●\x1b[0m",
  cyan: "\x1b[36m●\x1b[0m",
  magenta: "\x1b[35m●\x1b[0m",
  white: "\x1b[37m●\x1b[0m",
  gray: "\x1b[90m●\x1b[0m",
  brightBlue: "\x1b[94m●\x1b[0m",
  brightGreen: "\x1b[92m●\x1b[0m",
  brightCyan: "\x1b[96m●\x1b[0m",
  brightMagenta: "\x1b[95m●\x1b[0m",
  brightWhite: "\x1b[97m●\x1b[0m",
  dimBlue: "\x1b[34;2m●\x1b[0m",
  dimGreen: "\x1b[32;2m●\x1b[0m",
  dimCyan: "\x1b[36;2m●\x1b[0m",
  dimMagenta: "\x1b[35;2m●\x1b[0m",
  dimWhite: "\x1b[37;2m●\x1b[0m",
  boldBlue: "\x1b[34;1m●\x1b[0m",
  boldGreen: "\x1b[32;1m●\x1b[0m",
  boldCyan: "\x1b[36;1m●\x1b[0m",
  boldMagenta: "\x1b[35;1m●\x1b[0m",
  boldWhite: "\x1b[37;1m●\x1b[0m",
  brightGray: "\x1b[90;1m●\x1b[0m",
  darkGray: "\x1b[90;2m●\x1b[0m",
  teal: "\x1b[36m●\x1b[0m",
  indigo: "\x1b[34;3m●\x1b[0m",
  turquoise: "\x1b[96;3m●\x1b[0m",
  lavender: "\x1b[95;2m●\x1b[0m",
  mint: "\x1b[92;3m●\x1b[0m",
  skyBlue: "\x1b[94;3m●\x1b[0m",
  lime: "\x1b[92;1m●\x1b[0m",
  lightGray: "\x1b[37;3m●\x1b[0m",
  darkTeal: "\x1b[36;2m●\x1b[0m",
  softPink: "\x1b[35;3m●\x1b[0m",
};
*/
