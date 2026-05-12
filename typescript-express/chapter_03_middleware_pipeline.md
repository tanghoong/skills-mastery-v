# Chapter 3 — Middleware Pipeline

## Learning Objectives

By the end of this chapter you will be able to:
- Explain how Express's middleware pipeline works and why order matters
- Write typed middleware using `RequestHandler` and `ErrorRequestHandler`
- Build composable middleware factories that accept configuration
- Implement `asyncHandler` — the wrapper that prevents async route crashes
- Understand the difference between application, router, and route middleware

---

## 3.1 How the Pipeline Works

Express middleware is a chain of functions. Each one receives `(req, res, next)` and must either:
- Call `next()` to pass control to the next middleware
- Call `next(error)` to skip to the error handler
- Send a response with `res.json()`, `res.send()`, etc.

```
Request
  │
  ▼
app.use(express.json())        ← body parser
  │
  ▼
app.use(requestLogger)         ← logging
  │
  ▼
app.use("/api", router)        ← route matching
  │
  ▼
router.use(authenticate)       ← auth guard (router-level)
  │
  ▼
router.get("/tasks", handler)  ← route handler
  │
  ▼
app.use(errorHandler)          ← error handler (always last)
```

If any middleware sends a response, the chain stops. If any calls `next(error)`, Express jumps directly to the error handler.

---

## 3.2 Typed Middleware

```typescript
import type { RequestHandler, NextFunction, Request, Response } from "express";

// Simple middleware — no special params/body types
const requestId: RequestHandler = (req, _res, next) => {
  req.requestId = crypto.randomUUID();
  next();
};

// Middleware that reads req.user (extended type from Ch 2)
const requireAuth: RequestHandler = (req, res, next) => {
  if (!req.user) {
    res.status(401).json({
      ok: false,
      error: { code: "UNAUTHORIZED", message: "Authentication required" },
    });
    return; // important: return after sending, do not call next()
  }
  next();
};
```

The `return` after `res.json()` is critical. Without it, Express continues executing and you may call `next()` after already sending a response — causing a "Cannot set headers after they are sent" error.

---

## 3.3 Middleware Factories

When middleware needs configuration, wrap it in a factory function:

```typescript
// A middleware that enforces a minimum role
type OrgRole = "owner" | "admin" | "member" | "viewer";

const ROLE_HIERARCHY: Record<OrgRole, number> = {
  owner: 4, admin: 3, member: 2, viewer: 1,
};

function requireRole(minimumRole: OrgRole): RequestHandler {
  return (req, res, next) => {
    const userRole = req.user?.role as OrgRole | undefined;
    if (!userRole || ROLE_HIERARCHY[userRole] < ROLE_HIERARCHY[minimumRole]) {
      res.status(403).json({
        ok: false,
        error: { code: "FORBIDDEN", message: `Requires ${minimumRole} role` },
      });
      return;
    }
    next();
  };
}

// Usage: only admins and owners can delete a project
router.delete(
  "/:projectId",
  requireRole("admin"),  // ← factory returns a RequestHandler
  deleteProjectHandler
);
```

---

## 3.4 asyncHandler — The Most Important Wrapper

Express does not catch async errors automatically. If a route throws or returns a rejected Promise, the server crashes silently (or hangs) unless you handle it.

**Without asyncHandler (broken):**
```typescript
router.get("/tasks/:id", async (req, res) => {
  const task = await taskService.findById(req.params.id); // if this throws — crash
  res.json({ ok: true, data: task });
});
```

**With asyncHandler (correct):**
```typescript
// src/middleware/asyncHandler.ts
import type { RequestHandler, Request, Response, NextFunction } from "express";

type AsyncRequestHandler<
  P = Record<string, string>,
  ResBody = unknown,
  ReqBody = unknown,
  Q = Record<string, string>
> = (
  req: Request<P, ResBody, ReqBody, Q>,
  res: Response<ResBody>,
  next: NextFunction
) => Promise<void>;

export function asyncHandler<P, ResBody, ReqBody, Q>(
  fn: AsyncRequestHandler<P, ResBody, ReqBody, Q>
): RequestHandler<P, ResBody, ReqBody, Q> {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next); // catches rejections → next(err)
  };
}

// Usage — clean, no try/catch in every route
router.get(
  "/tasks/:taskId",
  asyncHandler(async (req, res) => {
    const task = await taskService.findById(req.params.taskId);
    res.json({ ok: true, data: task });
  })
);
```

`asyncHandler` is the single most important utility in a TypeScript Express app. Every async route must use it. This is one of the Codex review criteria.

---

## 3.5 Error Middleware

Error middleware has four parameters — Express identifies it by the arity:

```typescript
// src/middleware/errorHandler.ts
import type { ErrorRequestHandler } from "express";
import { AppError } from "../types/index.js";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  // AppError is our custom typed error class (Ch 5)
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      ok: false,
      error: {
        code: err.code,
        message: err.message,
        statusCode: err.statusCode,
      },
    });
    return;
  }

  // Unknown error — log it, return generic 500
  console.error("[Unhandled error]", err);
  res.status(500).json({
    ok: false,
    error: {
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred",
      statusCode: 500,
    },
  });
};
```

Register it **last** in `app.ts`, after all routes:

```typescript
app.use("/api/v1", createV1Router());
app.use(errorHandler); // ← always last
```

---

## 3.6 Application vs Router vs Route Middleware

| Level | Where | Applies to |
|-------|-------|-----------|
| Application | `app.use(fn)` | Every request |
| Router | `router.use(fn)` | All routes on this router |
| Route | `router.get("/path", fn, handler)` | Only this specific route |

```typescript
// Application-level: runs for every request
app.use(requestId);
app.use(requestLogger);

// Router-level: runs for all /api/v1 routes
const v1Router = Router();
v1Router.use(authenticate); // all v1 routes require auth

// Route-level: only this DELETE route needs admin
v1Router.delete("/projects/:id", requireRole("admin"), asyncHandler(deleteProject));
```

---

## 3.7 Middleware Order Gotchas

```typescript
// WRONG — body parser must come before routes that read req.body
app.use("/api/v1", createV1Router());
app.use(express.json()); // too late, body is already gone

// CORRECT
app.use(express.json());
app.use("/api/v1", createV1Router());
app.use(errorHandler); // must be after routes
```

Common mistakes:
1. Forgetting `return` after `res.json()` — execution continues, may call `next()`
2. Not registering the error handler last — Express won't route errors to it
3. Forgetting `asyncHandler` — async errors silently crash the process
4. Using `app.use(fn)` instead of `router.use(fn)` — middleware applies too broadly

---

## 3.8 TaskFlow Middleware Stack

```typescript
// src/app.ts
import express from "express";
import { requestId }     from "./middleware/requestId.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { errorHandler }  from "./middleware/errorHandler.js";
import { createV1Router } from "./api/v1/index.js";

export function createApp() {
  const app = express();

  // 1. Parse JSON bodies
  app.use(express.json({ limit: "1mb" }));

  // 2. Attach a unique ID to every request
  app.use(requestId);

  // 3. Log every request (Ch 13 expands this)
  app.use(requestLogger);

  // 4. Health check — no auth needed
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // 5. Versioned API routes
  app.use("/api/v1", createV1Router());

  // 6. 404 for unmatched routes
  app.use((_req, res) => {
    res.status(404).json({
      ok: false,
      error: { code: "NOT_FOUND", message: "Route not found", statusCode: 404 },
    });
  });

  // 7. Error handler — MUST be last
  app.use(errorHandler);

  return app;
}
```

---

## Summary

| Concept | Rule |
|---------|------|
| Pipeline order | Body parser → logging → routes → 404 → error handler |
| `return` after response | Always return after `res.json()` to prevent dual-response errors |
| `asyncHandler` | Wrap every async route — no exceptions |
| Middleware factory | When middleware needs config, return a `RequestHandler` |
| Error handler arity | Four params `(err, req, res, next)` — Express detects by parameter count |

---

## Exercise

Open `exercises/chapter_03.ts` and complete all TODOs.
