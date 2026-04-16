import fs from "node:fs";
import path from "node:path";

const LOG_BASE_DIR = process.env.VERCEL ? "/tmp" : process.cwd();
const LOG_DIR = path.join(LOG_BASE_DIR, "logs");
const LOG_FILE = path.join(LOG_DIR, "app.log");
const MAX_SIZE_BYTES = 1024 * 1024;
const MAX_ARCHIVES = 3;

type LogLevel = "INFO" | "WARN" | "ERROR";

function ensureLogDirectory() {
  try {
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true });
    }
  } catch {
    // File logging should never break request handling.
  }
}

function rotateIfNeeded() {
  try {
    if (!fs.existsSync(LOG_FILE)) {
      return;
    }

    const stats = fs.statSync(LOG_FILE);
    if (stats.size < MAX_SIZE_BYTES) {
      return;
    }

    for (let index = MAX_ARCHIVES - 1; index >= 1; index -= 1) {
      const source = `${LOG_FILE}.${index}`;
      const target = `${LOG_FILE}.${index + 1}`;
      if (fs.existsSync(source)) {
        fs.renameSync(source, target);
      }
    }

    fs.renameSync(LOG_FILE, `${LOG_FILE}.1`);
  } catch {
    // Ignore rotate failures so API handlers continue.
  }
}

function getCallerInfo() {
  const stack = new Error().stack?.split("\n") ?? [];
  const callerLine = stack[4] ?? "";
  const matched =
    callerLine.match(/at (.+) \((.+):(\d+):(\d+)\)/) ??
    callerLine.match(/at (.+):(\d+):(\d+)/);

  if (!matched) {
    return { func: "unknown", line: "0" };
  }

  if (matched.length === 5) {
    return { func: matched[1], line: matched[3] };
  }

  return { func: "anonymous", line: matched[2] };
}

function estTimestamp() {
  return new Date().toLocaleString("en-US", {
    timeZone: "America/New_York",
    hour12: false
  });
}

function write(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  ensureLogDirectory();
  rotateIfNeeded();
  const caller = getCallerInfo();
  const serializedMeta = meta ? ` ${JSON.stringify(meta)}` : "";
  const line = `[${estTimestamp()} EST] [${level}] [${caller.func}:${caller.line}] ${message}${serializedMeta}`;
  // eslint-disable-next-line no-console
  console.log(line);
  try {
    fs.appendFileSync(LOG_FILE, `${line}\n`, { encoding: "utf8" });
  } catch {
    // Ignore file write errors in read-only/serverless contexts.
  }
}

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) =>
    write("INFO", message, meta),
  warn: (message: string, meta?: Record<string, unknown>) =>
    write("WARN", message, meta),
  error: (message: string, meta?: Record<string, unknown>) =>
    write("ERROR", message, meta)
};
