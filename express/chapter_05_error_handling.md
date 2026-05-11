# Chapter 5 — Error Handling

## Learning Objectives

By the end of this chapter you will be able to:
- Design a typed `AppError` class hierarchy
- Map domain errors to correct HTTP status codes
- Write a central error handler middleware
- Use the `Result<T, E>` pattern to avoid throwing in business logic
- Never leak stack traces or internal details to API consumers

---

## 5.1 The Problem with Untyped Errors

```typescript
// This is what most Express tutorials show:
try {
  const task = await db.task.findUnique({ where: { id } });
  if (!task) throw new Error("Not found"); // loses HTTP context
  res.json(task);
} catch (e) {
  res.status(500).json({ error: e.message }); // always 500, leaks internals
}
```

Problems:
- Every error maps to 500, even "not found" which should be 404
- `e.message` may contain database internals or stack traces
- No error code — clients can't programmatically distinguish error types
- `catch (e)` gives `unknown` in strict mode — `e.message` is a type error

---

## 5.2 Typed AppError Class

```typescript
// src/types/errors.ts

export type ErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "UNPROCESSABLE"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

export class AppError extends Error {
  readonly code:       ErrorCode;
  readonly statusCode: number;
  readonly details?:   unknown;

  constructor(code: ErrorCode, message: string, statusCode: number, details?: unknown) {
    super(message);
    this.name       = "AppError";
    this.code       = code;
    this.statusCode = statusCode;
    this.details    = details;

    // Required for instanceof to work correctly with transpiled classes
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// Convenience subclasses — constructors already know the status code
export class NotFoundError extends AppError {
  constructor(resource: string, id: number | string) {
    super("NOT_FOUND", `${resource} ${id} not found`, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required") {
    super("UNAUTHORIZED", message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Insufficient permissions") {
    super("FORBIDDEN", message, 403);
  }
}

export class ConflictError extends AppError {
  constructor(resource: string, field: string, value: string) {
    super("CONFLICT", `${resource} with ${field} '${value}' already exists`, 409);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details: unknown) {
    super("VALIDATION_ERROR", message, 422, details);
  }
}
```

---

## 5.3 Central Error Handler

```typescript
// src/middleware/errorHandler.ts
import type { ErrorRequestHandler } from "express";
import { AppError } from "../types/errors.js";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    const body: Record<string, unknown> = {
      ok:    false,
      error: {
        code:       err.code,
        message:    err.message,
        statusCode: err.statusCode,
      },
    };

    if (err.details !== undefined) {
      (body.error as Record<string, unknown>).details = err.details;
    }

    res.status(err.statusCode).json(body);
    return;
  }

  // Handle Prisma known request errors (Ch 10)
  // if (err instanceof Prisma.PrismaClientKnownRequestError) { ... }

  // Unknown error — never expose internals
  const isDev = process.env.NODE_ENV === "development";

  res.status(500).json({
    ok:    false,
    error: {
      code:       "INTERNAL_ERROR",
      message:    "An unexpected error occurred",
      statusCode: 500,
      ...(isDev && { stack: err instanceof Error ? err.stack : String(err) }),
    },
  });
};
```

Stack traces are only included in `development` mode. In production, clients never see internals.

---

## 5.4 Throwing AppErrors in Service Layer

```typescript
// src/services/task.service.ts
import { NotFoundError, ForbiddenError } from "../types/errors.js";

async function getTask(taskId: number, requestingUserId: number) {
  const task = await taskRepository.findById(taskId);

  if (!task) {
    throw new NotFoundError("Task", taskId); // 404 with correct message
  }

  if (task.project.orgId !== requestingUserId) {
    throw new ForbiddenError("You do not have access to this task"); // 403
  }

  return task;
}
```

The route handler doesn't need try/catch — `asyncHandler` passes errors to the central handler automatically:

```typescript
router.get(
  "/:taskId",
  validate({ params: TaskIdParamSchema }),
  asyncHandler(async (req, res) => {
    // If getTask throws NotFoundError → asyncHandler → errorHandler → 404
    const task = await taskService.getTask(
      req.params.taskId,
      req.user!.id
    );
    res.json({ ok: true, data: task });
  })
);
```

---

## 5.5 Result<T, E> Pattern — No Throws in Business Logic

For functions where errors are expected outcomes (not exceptional cases), use `Result` instead of throwing. This makes the control flow explicit and forces callers to handle both paths.

```typescript
// src/types/result.ts
export type Result<T, E = AppError> =
  | { ok: true;  value: T }
  | { ok: false; error: E };

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

// Usage in auth service
import { ok, err, Result } from "../types/result.js";
import { UnauthorizedError } from "../types/errors.js";

async function login(
  email: string,
  password: string
): Promise<Result<AuthTokens, UnauthorizedError>> {
  const user = await userRepository.findByEmail(email);
  if (!user) return err(new UnauthorizedError("Invalid credentials"));

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return err(new UnauthorizedError("Invalid credentials"));

  const tokens = generateTokens(user);
  return ok(tokens);
}

// Caller must handle both paths — TypeScript enforces this
const result = await authService.login(email, password);
if (!result.ok) {
  res.status(401).json({ ok: false, error: result.error });
  return;
}
res.json({ ok: true, data: result.value });
```

**When to throw vs Result:**
- Throw: unexpected errors (database offline, out of memory, programming bugs)
- Result: expected business outcomes (invalid credentials, resource already exists)

---

## 5.6 Handling catch(e) with unknown

In strict mode, `catch (e)` gives you `unknown`. You must narrow the type before accessing properties:

```typescript
try {
  await riskyOperation();
} catch (e) {
  // e is unknown — e.message is a TypeScript ERROR
  if (e instanceof AppError) throw e;  // rethrow our own errors
  if (e instanceof Error) {
    console.error("Unexpected error:", e.message, e.stack);
  } else {
    console.error("Thrown non-Error:", e);
  }
  throw new AppError("INTERNAL_ERROR", "Operation failed", 500);
}
```

---

## 5.7 Prisma Error Mapping

Prisma throws typed errors for known database conditions. Map them in the error handler:

```typescript
import { Prisma } from "@prisma/client";

// Inside errorHandler, before the generic 500:
if (err instanceof Prisma.PrismaClientKnownRequestError) {
  if (err.code === "P2025") {
    // Record not found
    res.status(404).json({
      ok: false,
      error: { code: "NOT_FOUND", message: "Record not found", statusCode: 404 },
    });
    return;
  }
  if (err.code === "P2002") {
    // Unique constraint violation
    res.status(409).json({
      ok: false,
      error: { code: "CONFLICT", message: "Record already exists", statusCode: 409 },
    });
    return;
  }
}
```

Common Prisma error codes: `P2025` (not found), `P2002` (unique violation), `P2003` (foreign key), `P2000` (value too long).

---

## 5.8 HTTP Status Code Reference

| Code | When to Use |
|------|------------|
| 200 | Successful GET, PATCH, DELETE |
| 201 | Successful POST (resource created) |
| 204 | Successful DELETE with no body |
| 400 | Bad request — malformed JSON, missing required field |
| 401 | Authentication required or token invalid |
| 403 | Authenticated but insufficient permissions |
| 404 | Resource does not exist |
| 409 | Conflict — duplicate, already exists |
| 422 | Validation error — semantically invalid input |
| 429 | Rate limited |
| 500 | Unexpected server error |
| 503 | Service unavailable (during graceful shutdown) |

---

## Summary

| Concept | Rule |
|---------|------|
| `AppError` hierarchy | Carry `code`, `statusCode`, `details` — never a raw `Error` |
| Central error handler | Single place for all error-to-HTTP mapping — last middleware |
| Stack trace | Dev only — never expose to production clients |
| `Result<T, E>` | Use for expected outcomes in business logic, throw for surprises |
| `catch (e: unknown)` | Narrow type before accessing properties — strict mode requires this |

---

## Exercise

Open `exercises/chapter_05.ts` and complete all TODOs.
