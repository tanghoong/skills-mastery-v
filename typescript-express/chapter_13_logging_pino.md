# Chapter 13 — Structured Logging with Pino

## Learning Objectives

By the end of this chapter you will be able to:
- Set up Pino for structured JSON logging
- Attach correlation IDs to every log line in a request
- Write a typed request logger middleware
- Redact sensitive fields automatically
- Use child loggers to add context without repeating it

---

## 13.1 Why Structured Logging

```
# Unstructured (hard to query in Datadog/Grafana/CloudWatch):
[INFO] POST /api/v1/tasks - 201 - 45ms - user 42

# Structured JSON (queryable, filterable, alertable):
{"level":"info","time":1700000000000,"requestId":"abc-123","method":"POST",
 "path":"/api/v1/tasks","statusCode":201,"durationMs":45,"userId":42}
```

Structured logs let you filter by `userId`, alert on `statusCode >= 500`, and build dashboards — without parsing log strings.

---

## 13.2 Installing Pino

```bash
npm install pino pino-http
npm install -D pino-pretty  # dev-only pretty printer
```

---

## 13.3 Logger Setup

```typescript
// src/lib/logger.ts
import pino from "pino";
import { config } from "../config/env.js";

export const logger = pino({
  level: config.log.level,

  // Pretty print in dev, JSON in production
  transport: config.isDev
    ? { target: "pino-pretty", options: { colorize: true, translateTime: "HH:MM:ss" } }
    : undefined,

  // Redact sensitive fields — values replaced with "[Redacted]"
  redact: {
    paths:   ["req.headers.authorization", "*.password", "*.passwordHash", "*.token"],
    censor:  "[Redacted]",
  },

  // Serializers customise how objects are logged
  serializers: {
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
    err: pino.stdSerializers.err,
  },
});

export type Logger = typeof logger;
```

---

## 13.4 Request Logger Middleware

```typescript
// src/middleware/requestLogger.ts
import type { RequestHandler } from "express";
import { logger } from "../lib/logger.js";

export const requestLogger: RequestHandler = (req, res, next) => {
  const start = Date.now();

  // Attach a child logger with request context to req
  req.log = logger.child({
    requestId: req.requestId,
    method:    req.method,
    path:      req.path,
    ip:        req.ip,
  });

  req.log.info("Request received");

  // Log after response is sent
  res.on("finish", () => {
    const durationMs = Date.now() - start;
    const level = res.statusCode >= 500 ? "error"
                : res.statusCode >= 400 ? "warn"
                : "info";

    req.log[level]({
      statusCode:  res.statusCode,
      durationMs,
      userId:      req.user?.id,
      contentLength: res.getHeader("content-length"),
    }, "Request completed");
  });

  next();
};
```

Extend the `Request` type:

```typescript
// src/types/express.d.ts
import type { Logger } from "pino";

declare global {
  namespace Express {
    interface Request {
      user?:      AuthUser;
      requestId?: string;
      log:        Logger; // pino child logger attached per-request
    }
  }
}
```

---

## 13.5 Child Loggers for Context

```typescript
// In a service, pass the logger as a dependency
export class TaskService {
  async create(dto: CreateTaskDto, user: AuthUser, log: Logger): Promise<Task> {
    log.info({ taskTitle: dto.title }, "Creating task");

    const task = await taskRepository.create({ ...dto });

    log.info({ taskId: task.id }, "Task created successfully");
    return task;
  }
}

// In the route handler, pass req.log
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const task = await taskService.create(req.body, req.user!, req.log);
    sendCreated(res, task);
  })
);
```

Every log line from this request automatically carries `requestId`, `method`, `path` — you never have to repeat them.

---

## 13.6 Correlation ID Middleware

```typescript
// src/middleware/requestId.ts
import type { RequestHandler } from "express";
import crypto from "crypto";

export const requestId: RequestHandler = (req, _res, next) => {
  // Use forwarded ID from upstream proxy if present (e.g. AWS ALB, nginx)
  req.requestId = (req.headers["x-request-id"] as string) ?? crypto.randomUUID();
  next();
};
```

Register this first in the middleware stack — before the request logger — so the ID is available immediately.

---

## 13.7 Log Levels Guide

| Level | Use For |
|-------|---------|
| `fatal` | Application is about to crash |
| `error` | Unexpected error — requires investigation |
| `warn` | Expected error path or degraded state (rate limit hit, retry) |
| `info` | Normal request/response, significant business events |
| `debug` | Detailed flow for debugging (off in production) |
| `trace` | Very verbose — query plans, loop iterations (never in production) |

```typescript
logger.info({ taskId: 42 }, "Task marked complete");           // business event
logger.warn({ userId: 7, attempt: 3 }, "Login attempt failed"); // expected failure
logger.error({ err: error }, "S3 upload failed");               // unexpected failure
logger.debug({ query }, "Executing database query");            // debugging
```

---

## 13.8 Error Logging in errorHandler

```typescript
// src/middleware/errorHandler.ts
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof AppError && err.statusCode < 500) {
    // Client error — log at warn, no stack trace
    req.log.warn({ err: { code: err.code, message: err.message } }, "Client error");
  } else {
    // Server error — log at error with full stack
    req.log.error({ err }, "Unhandled error");
  }

  // ... send response as before
};
```

500-level errors always get full stack trace in logs (but not in the response to the client).

---

## 13.9 pino-http for HTTP Logging

Alternative to the manual middleware — `pino-http` is a one-liner that logs all requests:

```typescript
import pinoHttp from "pino-http";
import { logger } from "./lib/logger.js";

app.use(pinoHttp({
  logger,
  customLogLevel: (_req, res) => {
    if (res.statusCode >= 500) return "error";
    if (res.statusCode >= 400) return "warn";
    return "info";
  },
  customSuccessMessage: (req, res) => `${req.method} ${req.url} → ${res.statusCode}`,
  redact: ["req.headers.authorization"],
}));
```

`pino-http` attaches `req.log` automatically.

---

## Summary

| Concept | Rule |
|---------|------|
| JSON in production | `pino-pretty` only in dev — machines parse JSON |
| `redact` | Always redact `authorization`, `password`, `token` fields |
| Child loggers | Attach request context once — never repeat it |
| `requestId` | Generated in first middleware, carried in every log line |
| Error log level | 5xx → `error`, 4xx → `warn`, 2xx → `info` |

---

## Exercise

Open `exercises/chapter_13.ts` and complete all TODOs.
