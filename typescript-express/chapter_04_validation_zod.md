# Chapter 4 — Request Validation with Zod

## Learning Objectives

By the end of this chapter you will be able to:
- Validate request body, params, and query string with Zod schemas
- Build a reusable `validate` middleware factory
- Return structured validation errors with field-level detail
- Share Zod schemas between validation and TypeScript type inference
- Never trust client input beyond the HTTP boundary

---

## 4.1 Why Runtime Validation Is Non-Negotiable

TypeScript types disappear at runtime. A user sending:
```json
{ "priority": "SUPER_URGENT", "dueDate": "yesterday" }
```
passes TypeScript's compile-time checks if `req.body` is typed as `any` or `unknown`. You need runtime validation at the HTTP boundary — before any business logic touches the data.

**Zod** is the standard for this in the TypeScript ecosystem because it:
1. Validates at runtime AND generates TypeScript types from the schema
2. Gives precise error messages per field
3. Transforms data (string → number, string → Date) at the same time

---

## 4.2 Installing Zod

```bash
npm install zod
```

---

## 4.3 Defining Schemas and Inferring Types

```typescript
import { z } from "zod";

// Schema = runtime validator
const CreateTaskSchema = z.object({
  title:       z.string().min(1).max(255),
  description: z.string().max(5000).optional(),
  priority:    z.enum(["urgent", "high", "medium", "low", "none"]).default("none"),
  dueDate:     z.coerce.date().optional(), // coerces "2024-12-01" string → Date
  assigneeId:  z.number().int().positive().optional(),
});

// Type = inferred from schema — no duplication
type CreateTaskDto = z.infer<typeof CreateTaskSchema>;

// Both are always in sync — change the schema, the type updates automatically
```

---

## 4.4 The `validate` Middleware Factory

```typescript
// src/middleware/validate.ts
import { z, ZodSchema } from "zod";
import type { RequestHandler } from "express";

interface ValidateTargets {
  body?:   ZodSchema;
  params?: ZodSchema;
  query?:  ZodSchema;
}

export function validate(schemas: ValidateTargets): RequestHandler {
  return (req, res, next) => {
    const errors: Record<string, unknown> = {};

    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (!result.success) {
        errors.body = result.error.flatten().fieldErrors;
      } else {
        req.body = result.data; // replace with parsed + coerced data
      }
    }

    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      if (!result.success) {
        errors.params = result.error.flatten().fieldErrors;
      } else {
        req.params = result.data;
      }
    }

    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);
      if (!result.success) {
        errors.query = result.error.flatten().fieldErrors;
      } else {
        req.query = result.data;
      }
    }

    if (Object.keys(errors).length > 0) {
      res.status(422).json({
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Request validation failed",
          statusCode: 422,
          details: errors,
        },
      });
      return;
    }

    next();
  };
}
```

---

## 4.5 Using validate on Routes

```typescript
import { validate } from "../../../middleware/validate.js";
import { asyncHandler } from "../../../middleware/asyncHandler.js";
import { z } from "zod";

const TaskParamsSchema = z.object({
  taskId: z.coerce.number().int().positive(), // coerces "42" → 42
});

const CreateTaskSchema = z.object({
  title:    z.string().min(1).max(255),
  priority: z.enum(["urgent", "high", "medium", "low", "none"]).default("none"),
  dueDate:  z.coerce.date().optional(),
});

const ListTaskQuerySchema = z.object({
  status:   z.enum(["backlog","todo","in_progress","in_review","done","cancelled"]).optional(),
  priority: z.enum(["urgent","high","medium","low","none"]).optional(),
  page:     z.coerce.number().int().positive().default(1),
  limit:    z.coerce.number().int().min(1).max(100).default(20),
});

router.get(
  "/",
  validate({ query: ListTaskQuerySchema }),
  asyncHandler(async (req, res) => {
    // req.query is now { status?, priority?, page: number, limit: number }
    // All values are correctly typed — no manual parsing needed
    const tasks = await taskService.list(req.params.projectId, req.query);
    res.json({ ok: true, data: tasks });
  })
);

router.post(
  "/",
  validate({ body: CreateTaskSchema }),
  asyncHandler(async (req, res) => {
    // req.body is CreateTaskDto — validated and coerced
    const task = await taskService.create(req.params.projectId, req.body);
    res.status(201).json({ ok: true, data: task });
  })
);
```

---

## 4.6 Validation Error Response Example

When a client sends `{ "title": "", "priority": "WRONG" }`:

```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "statusCode": 422,
    "details": {
      "body": {
        "title": ["String must contain at least 1 character(s)"],
        "priority": ["Invalid enum value. Expected 'urgent' | 'high' | 'medium' | 'low' | 'none', received 'WRONG'"]
      }
    }
  }
}
```

Field-level errors let the client display exactly which field failed and why — essential for a good API.

---

## 4.7 Common Zod Patterns

```typescript
// String transformations
z.string().trim().toLowerCase()              // normalise email input
z.string().email()                           // validate email format
z.string().url()                             // validate URL
z.string().uuid()                            // validate UUID
z.string().regex(/^[a-z0-9-]+$/)            // custom pattern (slugs)

// Number coercion (query params come in as strings)
z.coerce.number().int().positive()           // "42" → 42
z.coerce.number().min(0).max(100)            // bounded range

// Date coercion
z.coerce.date()                              // "2024-12-01" → Date object

// Optional vs nullable
z.string().optional()                        // string | undefined
z.string().nullable()                        // string | null
z.string().nullish()                         // string | null | undefined

// Default values
z.number().default(1)                        // if field missing, use 1

// Nested objects
z.object({
  address: z.object({
    city:    z.string(),
    country: z.string().length(2),
  }),
})

// Arrays
z.array(z.string()).min(1).max(10)           // 1–10 string items

// Union discrimination
const EventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("task.created"), taskId: z.number() }),
  z.object({ type: z.literal("comment.added"), commentId: z.number() }),
]);
```

---

## 4.8 Reusable Schema Building Blocks

Define shared sub-schemas once and compose them:

```typescript
// src/schemas/common.ts
import { z } from "zod";

export const PaginationSchema = z.object({
  page:  z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const IdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const TaskIdParamSchema = z.object({
  taskId: z.coerce.number().int().positive(),
});

// Composed in a specific router
const ListTaskQuerySchema = PaginationSchema.extend({
  status:   z.enum(["todo","in_progress","done"]).optional(),
  priority: z.enum(["urgent","high","medium"]).optional(),
});
```

---

## 4.9 Never Bypass Validation

The rule: **no service or repository function receives raw `req.body`**. The `validate` middleware runs first, replaces `req.body` with the parsed result, and only then does the handler run.

```typescript
// WRONG — raw body reaches the service
router.post("/tasks", asyncHandler(async (req, res) => {
  const task = await taskService.create(req.body); // untrusted data
  res.json({ ok: true, data: task });
}));

// CORRECT — validate middleware intercepts first
router.post(
  "/tasks",
  validate({ body: CreateTaskSchema }), // validates + coerces
  asyncHandler(async (req, res) => {
    const task = await taskService.create(req.body); // trusted, typed
    res.json({ ok: true, data: task });
  })
);
```

This is enforced by the Codex review (criterion 2).

---

## Summary

| Concept | Rule |
|---------|------|
| Zod schema + `z.infer` | Single source of truth — no duplicate type definitions |
| `safeParse` | Never throws — returns `{ success, data }` or `{ success, error }` |
| `validate()` factory | Apply to body, params, and query independently |
| `z.coerce` | Always coerce query params — they arrive as strings |
| `.replace req.body` | After validation, route handlers receive clean, typed data |

---

## Exercise

Open `exercises/chapter_04.ts` and complete all TODOs.
