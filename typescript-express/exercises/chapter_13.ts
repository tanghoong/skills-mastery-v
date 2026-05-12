/**
 * Chapter 13 — Structured Logging with Pino
 *
 * Run: tsx exercises/chapter_13.ts
 */

// =============================================================================
// EXERCISE 1 — Log level definitions
// =============================================================================
// TODO: Define `LogLevel` union: "fatal" | "error" | "warn" | "info" | "debug" | "trace"
// TODO: Define `LOG_LEVEL_VALUE` as Record<LogLevel, number>:
//       fatal=60, error=50, warn=40, info=30, debug=20, trace=10

export type LogLevel = never; // replace

export const LOG_LEVEL_VALUE: Record<string, number> = {
  // TODO
};

// TODO: Implement `shouldLog(currentLevel: LogLevel, messageLevel: LogLevel): boolean`
//       Returns true if messageLevel >= currentLevel (by numeric value)

export function shouldLog(currentLevel: LogLevel, messageLevel: LogLevel): boolean {
  // TODO
  return false;
}

// =============================================================================
// EXERCISE 2 — Log record structure
// =============================================================================
// TODO: Define `LogRecord` interface:
//       - level:      LogLevel
//       - time:       number (unix ms timestamp)
//       - msg:        string
//       - requestId?: string
//       - userId?:    number
//       - [key: string]: unknown   (allows arbitrary extra fields)

export interface LogRecord {
  // TODO
}

// =============================================================================
// EXERCISE 3 — Simple in-memory logger
// =============================================================================
// TODO: Implement `InMemoryLogger` class:
//       - Constructor takes `level: LogLevel` (minimum level)
//       - Has a `records: LogRecord[]` array (public)
//       - Has methods: fatal, error, warn, info, debug, trace
//         Each accepts (context: Record<string,unknown>, msg: string)
//         or just (msg: string)
//         Only logs if shouldLog(this.level, methodLevel) is true
//       - Has a `child(bindings: Record<string,unknown>): InMemoryLogger`
//         Returns a new logger that prepends bindings to every log record

export class InMemoryLogger {
  public records: LogRecord[] = [];

  constructor(private level: LogLevel) {}

  private log(logLevel: LogLevel, contextOrMsg: Record<string, unknown> | string, msg?: string): void {
    // TODO: check shouldLog, build LogRecord, push to records
  }

  fatal(contextOrMsg: Record<string, unknown> | string, msg?: string): void {
    this.log("fatal", contextOrMsg, msg);
  }

  error(contextOrMsg: Record<string, unknown> | string, msg?: string): void {
    this.log("error", contextOrMsg, msg);
  }

  warn(contextOrMsg: Record<string, unknown> | string, msg?: string): void {
    this.log("warn", contextOrMsg, msg);
  }

  info(contextOrMsg: Record<string, unknown> | string, msg?: string): void {
    this.log("info", contextOrMsg, msg);
  }

  debug(contextOrMsg: Record<string, unknown> | string, msg?: string): void {
    this.log("debug", contextOrMsg, msg);
  }

  trace(contextOrMsg: Record<string, unknown> | string, msg?: string): void {
    this.log("trace", contextOrMsg, msg);
  }

  child(bindings: Record<string, unknown>): InMemoryLogger {
    // TODO: return a new InMemoryLogger that automatically includes bindings in every record
    return new InMemoryLogger(this.level);
  }
}

// =============================================================================
// EXERCISE 4 — Request log entry builder
// =============================================================================
// TODO: Define `RequestLogEntry` interface:
//       requestId (string), method (string), path (string),
//       statusCode (number), durationMs (number),
//       userId? (number), contentLength? (number)
//
// TODO: Implement `buildRequestLogEntry(params: RequestLogEntry): { level: LogLevel; entry: RequestLogEntry }`
//       Determines the log level from statusCode:
//       - 500–599: "error"
//       - 400–499: "warn"
//       - else:    "info"

export interface RequestLogEntry {
  // TODO
}

export function buildRequestLogEntry(params: RequestLogEntry): { level: LogLevel; entry: RequestLogEntry } {
  // TODO
  return { level: "info", entry: params };
}

// =============================================================================
// EXERCISE 5 — Redactor
// =============================================================================
// TODO: Implement `redact(obj: Record<string, unknown>, fields: string[]): Record<string, unknown>`
//       Returns a new object where any key in `fields` has its value replaced with "[Redacted]"
//       Handle nested objects recursively (1 level deep is fine)

export function redact(obj: Record<string, unknown>, fields: string[]): Record<string, unknown> {
  // TODO
  return obj;
}

// =============================================================================
// VERIFICATION
// =============================================================================

function verify(): void {
  // Exercise 1 — shouldLog
  console.assert(shouldLog("info",  "info")  === true,  "Ex1: info >= info");
  console.assert(shouldLog("info",  "warn")  === true,  "Ex1: warn >= info");
  console.assert(shouldLog("info",  "debug") === false, "Ex1: debug < info");
  console.assert(shouldLog("error", "warn")  === false, "Ex1: warn < error");
  console.assert(shouldLog("debug", "trace") === false, "Ex1: trace < debug");

  // Exercise 3 — InMemoryLogger
  const logger = new InMemoryLogger("info");

  logger.info("Hello");
  logger.debug("This should be filtered");
  logger.warn({ requestId: "abc" }, "Warning");

  console.assert(logger.records.length === 2,               "Ex3: debug should be filtered");
  console.assert(logger.records[0].msg === "Hello",          "Ex3: first record should be Hello");
  console.assert(logger.records[0].level === "info",         "Ex3: first record level should be info");
  console.assert(logger.records[1].level === "warn",         "Ex3: second record level should be warn");
  console.assert((logger.records[1] as any).requestId === "abc", "Ex3: context should be included");

  // Child logger
  const child = logger.child({ requestId: "child-123", userId: 42 });
  child.info("Child message");
  const lastRecord = child.records[child.records.length - 1] ?? logger.records[logger.records.length - 1];
  console.assert((lastRecord as any).requestId === "child-123", "Ex3: child should include bindings");
  console.assert((lastRecord as any).userId    === 42,          "Ex3: child should include userId binding");

  // Exercise 4 — request log entry
  const ok200  = buildRequestLogEntry({ requestId: "r1", method: "GET",  path: "/tasks", statusCode: 200, durationMs: 45 });
  const err500 = buildRequestLogEntry({ requestId: "r2", method: "POST", path: "/tasks", statusCode: 500, durationMs: 12 });
  const warn404 = buildRequestLogEntry({ requestId: "r3", method: "GET", path: "/x",     statusCode: 404, durationMs: 5 });

  console.assert(ok200.level   === "info",  "Ex4: 200 → info");
  console.assert(err500.level  === "error", "Ex4: 500 → error");
  console.assert(warn404.level === "warn",  "Ex4: 404 → warn");

  // Exercise 5 — redact
  const original = { email: "a@b.com", password: "secret", name: "Alice" };
  const redacted = redact(original, ["password"]);
  console.assert(redacted.password === "[Redacted]", "Ex5: password should be redacted");
  console.assert(redacted.email    === "a@b.com",    "Ex5: email should be unchanged");
  console.assert(redacted.name     === "Alice",      "Ex5: name should be unchanged");

  const nested = { user: { token: "abc123", id: 1 }, other: "value" };
  const redactedNested = redact(nested as any, ["token"]);
  console.assert((redactedNested.user as any).token === "[Redacted]", "Ex5: nested token should be redacted");

  console.log("Chapter 13 verification complete ✓");
}

verify();
