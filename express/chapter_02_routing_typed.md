# Chapter 2 — Routing & Typed Request/Response

## Learning Objectives

By the end of this chapter you will be able to:
- Type route handler parameters, request body, response body, and query strings
- Use Express's `RequestHandler` generic to get full type safety on a route
- Organise routes into `Router` instances with typed factories
- Understand why `res.json()` does not enforce response shape — and how to fix it
- Build the first two TaskFlow route groups

---

## 2.1 Express's Generic Types

Express ships with four generics on `Request`:

```typescript
Request<
  Params,      // req.params — URL segments like :taskId
  ResBody,     // what res.json() accepts
  ReqBody,     // req.body
  Query        // req.query
>
```

When you write a route without generics, all of these default to `any` — you get no type checking.

---

## 2.2 Typed Route Handler

```typescript
import type { RequestHandler } from "express";

// Typed params: /tasks/:taskId
interface TaskParams {
  taskId: string;
}

// Typed response body
interface TaskResponse {
  ok: true;
  data: { id: number; title: string; status: string };
}

// Typed request body for creation
interface CreateTaskBody {
  title: string;
  priority?: "urgent" | "high" | "medium" | "low" | "none";
}

// All four generics declared — handler is fully typed
const getTask: RequestHandler<TaskParams, TaskResponse, never, never> = (
  req,
  res
) => {
  const taskId = Number(req.params.taskId); // req.params.taskId is string ✓
  // req.body is never  ✓ (GET has no body)
  res.json({
    ok: true,
    data: { id: taskId, title: "Fix login bug", status: "in_progress" },
  });
};
```

---

## 2.3 Router Factory Pattern

Each feature area gets its own `Router`. Export a factory function that takes any dependencies (services, logger) as arguments rather than importing them directly — this makes the router testable.

```typescript
// src/api/v1/tasks/tasks.router.ts
import { Router } from "express";
import type { TaskService } from "../../../services/task.service.js";

export function createTaskRouter(taskService: TaskService): Router {
  const router = Router({ mergeParams: true }); // mergeParams: true inherits :projectId from parent

  router.get("/", async (req, res, next) => {
    try {
      const tasks = await taskService.list(req.params.projectId);
      res.json({ ok: true, data: tasks });
    } catch (err) {
      next(err); // delegate to error middleware (Ch 5)
    }
  });

  router.post("/", async (req, res, next) => {
    try {
      const task = await taskService.create(req.params.projectId, req.body);
      res.status(201).json({ ok: true, data: task });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
```

---

## 2.4 Mounting Routers

```typescript
// src/api/v1/index.ts
import { Router } from "express";
import { createTaskRouter } from "./tasks/tasks.router.js";
import { createAuthRouter } from "./auth/auth.router.js";
import { taskService } from "../../services/task.service.js";

export function createV1Router(): Router {
  const router = Router();

  router.use("/auth", createAuthRouter());
  router.use("/projects/:projectId/tasks", createTaskRouter(taskService));

  return router;
}

// src/app.ts
import { createV1Router } from "./api/v1/index.js";

export function createApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/v1", createV1Router());
  return app;
}
```

---

## 2.5 Typed Query Strings

`req.query` values are always `string | string[] | ParsedQs | ParsedQs[]`. You must parse them explicitly — do not trust their types.

```typescript
interface TaskQuery {
  status?: string;
  priority?: string;
  page?: string;
  limit?: string;
}

const listTasks: RequestHandler<{ projectId: string }, unknown, never, TaskQuery> = (
  req,
  res
) => {
  const page  = Number(req.query.page  ?? 1);   // always parse
  const limit = Number(req.query.limit ?? 20);  // always parse
  const status = req.query.status;              // string | undefined ✓
  // ...
};
```

In Chapter 4, Zod replaces this manual parsing and validates at the same time.

---

## 2.6 res.json() Does Not Enforce Shape

A subtle TypeScript pitfall: even if you type `ResBody`, TypeScript only checks what you pass to `res.json()` at the call site — it does not prevent you from calling `res.json()` with a completely different shape elsewhere. The type is advisory, not enforced at runtime.

The real enforcement comes from:
1. Typed response interfaces used consistently
2. Service-layer functions returning typed results
3. Integration tests (Ch 15) that assert response shape

---

## 2.7 Route Naming Conventions

| HTTP Method | Path | Action |
|-------------|------|--------|
| GET | `/projects` | list all projects |
| POST | `/projects` | create project |
| GET | `/projects/:projectId` | get one project |
| PATCH | `/projects/:projectId` | partial update |
| DELETE | `/projects/:projectId` | delete |

Use `PATCH` for partial updates, not `PUT`. `PUT` means replace the entire resource. In practice you almost never replace an entire resource — you update one or two fields.

Use nested routes for owned resources: `/projects/:projectId/tasks` not `/tasks?projectId=`.

---

## 2.8 TaskFlow — Auth Router Skeleton

```typescript
// src/api/v1/auth/auth.router.ts
import { Router } from "express";

export function createAuthRouter(): Router {
  const router = Router();

  router.post("/register", async (req, res, next) => {
    // body: { email, password, name }
    // returns: { ok: true, data: { user, tokens } }
    res.status(501).json({ ok: false, error: { code: "NOT_IMPLEMENTED" } });
  });

  router.post("/login", async (req, res, next) => {
    res.status(501).json({ ok: false, error: { code: "NOT_IMPLEMENTED" } });
  });

  router.post("/refresh", async (req, res, next) => {
    res.status(501).json({ ok: false, error: { code: "NOT_IMPLEMENTED" } });
  });

  router.post("/logout", async (req, res, next) => {
    res.status(204).send();
  });

  return router;
}
```

The 501 stubs let you register the routes now and implement them chapter by chapter.

---

## 2.9 Extending Express's Request Type

You often need to attach data to `req` (e.g. `req.user` after auth middleware). TypeScript does not know about this by default. Use declaration merging:

```typescript
// src/types/express.d.ts
import type { AuthUser } from "./index.js";

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      requestId?: string;
    }
  }
}
```

With this in place, `req.user` is typed everywhere — no casting required.

---

## Summary

| Concept | Takeaway |
|---------|----------|
| `RequestHandler<P,R,B,Q>` | Four generics give full type coverage on a route |
| Router factory | Pass dependencies as arguments, not global imports |
| `mergeParams: true` | Child routers inherit parent URL params |
| `req.query` | Always parse — values are strings, never numbers |
| `declare global` | Extend `Request` type for `req.user`, `req.requestId` |

---

## Exercise

Open `exercises/chapter_02.ts` and complete all TODOs.
