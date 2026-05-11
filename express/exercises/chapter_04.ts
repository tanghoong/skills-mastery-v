/**
 * Chapter 4 — Request Validation with Zod
 *
 * Run: tsx exercises/chapter_04.ts
 *
 * Install: npm install zod
 */

import { z } from "zod";
import type { RequestHandler } from "express";

// =============================================================================
// EXERCISE 1 — CreateTask schema
// =============================================================================
// TODO: Define `CreateTaskSchema` using z.object() with:
//       - title:       string, min 1, max 255
//       - description: string, max 5000, optional
//       - priority:    enum ["urgent","high","medium","low","none"], default "none"
//       - assigneeId:  positive integer, optional
//       - dueDate:     coerced Date, optional

export const CreateTaskSchema = z.object({
  // TODO
});

// TODO: Derive `CreateTaskDto` from the schema using z.infer
export type CreateTaskDto = z.infer<typeof CreateTaskSchema>;

// =============================================================================
// EXERCISE 2 — UpdateTask schema
// =============================================================================
// TODO: Define `UpdateTaskSchema` — same fields as Create but all optional,
//       with an added `.refine()` that ensures at least one field is present.
//       Hint: Object.keys(data).length > 0

export const UpdateTaskSchema = z.object({
  // TODO
}).refine(
  (data) => true, // TODO: replace with the correct check
  { message: "At least one field must be provided" }
);

// =============================================================================
// EXERCISE 3 — Pagination schema
// =============================================================================
// TODO: Define `PaginationSchema` with:
//       - page:  coerced positive integer, default 1
//       - limit: coerced integer min 1 max 100, default 20

export const PaginationSchema = z.object({
  // TODO
});

// =============================================================================
// EXERCISE 4 — TaskParams schema
// =============================================================================
// TODO: Define `TaskParamsSchema` with:
//       - taskId: coerced positive integer (URL params arrive as strings)

export const TaskParamsSchema = z.object({
  // TODO
});

// =============================================================================
// EXERCISE 5 — validate middleware factory
// =============================================================================
// TODO: Implement `validate({ body?, params?, query? }): RequestHandler`
//       - For each target, call schema.safeParse(req[target])
//       - If any fail, collect errors and send 422:
//         { ok: false, error: { code: "VALIDATION_ERROR", message: "...", statusCode: 422, details: errors } }
//       - If all pass, replace req[target] with result.data and call next()

interface ValidateTargets {
  body?:   z.ZodSchema;
  params?: z.ZodSchema;
  query?:  z.ZodSchema;
}

export function validate(schemas: ValidateTargets): RequestHandler {
  return (req, res, next) => {
    // TODO
  };
}

// =============================================================================
// EXERCISE 6 — Compose schemas with .extend()
// =============================================================================
// TODO: Create `ListTaskQuerySchema` by extending PaginationSchema with:
//       - status:   enum of task statuses, optional
//       - priority: enum of priorities, optional
//       - sort:     enum ["createdAt","dueDate","title"], default "createdAt"
//       - order:    enum ["asc","desc"], default "desc"

export const ListTaskQuerySchema = PaginationSchema.extend({
  // TODO
});

export type ListTaskQuery = z.infer<typeof ListTaskQuerySchema>;

// =============================================================================
// EXERCISE 7 — Email validation schema
// =============================================================================
// TODO: Define `RegisterSchema` with:
//       - name:     string, trim, min 2, max 100
//       - email:    valid email format, transform to lowercase
//       - password: string, min 8, max 100

export const RegisterSchema = z.object({
  // TODO
});

// =============================================================================
// VERIFICATION
// =============================================================================

function verify(): void {
  // Exercise 1 — CreateTask
  const validCreate = CreateTaskSchema.safeParse({
    title:    "Fix bug",
    priority: "high",
  });
  console.assert(validCreate.success,                       "Ex1: valid input should parse");
  console.assert(validCreate.success && validCreate.data.priority === "high", "Ex1: priority should be high");

  const defaultCreate = CreateTaskSchema.safeParse({ title: "Task" });
  console.assert(defaultCreate.success && (defaultCreate.data as any).priority === "none", "Ex1: priority should default to none");

  const invalidCreate = CreateTaskSchema.safeParse({ title: "" }); // empty title
  console.assert(!invalidCreate.success, "Ex1: empty title should fail");

  // Exercise 2 — UpdateTask
  const emptyUpdate = UpdateTaskSchema.safeParse({});
  console.assert(!emptyUpdate.success, "Ex2: empty object should fail refine");

  const validUpdate = UpdateTaskSchema.safeParse({ status: "in_progress" });
  console.assert(validUpdate.success, "Ex2: single field should pass");

  // Exercise 3 — Pagination defaults
  const pagination = PaginationSchema.safeParse({});
  console.assert(pagination.success,                                "Ex3: empty should use defaults");
  console.assert(pagination.success && pagination.data.page  === 1,  "Ex3: page default should be 1");
  console.assert(pagination.success && pagination.data.limit === 20, "Ex3: limit default should be 20");

  // Coercion
  const coerced = PaginationSchema.safeParse({ page: "3", limit: "50" });
  console.assert(coerced.success && coerced.data.page  === 3,  "Ex3: page should be coerced to number");
  console.assert(coerced.success && coerced.data.limit === 50, "Ex3: limit should be coerced to number");

  // Exercise 4 — TaskParams coercion
  const params = TaskParamsSchema.safeParse({ taskId: "42" });
  console.assert(params.success && params.data.taskId === 42, "Ex4: taskId should be coerced to number");

  // Exercise 7 — Email normalisation
  const reg = RegisterSchema.safeParse({ name: "Alice", email: "Alice@EXAMPLE.COM", password: "password123" });
  console.assert(reg.success,                                   "Ex7: valid register should parse");
  console.assert(reg.success && reg.data.email === "alice@example.com", "Ex7: email should be lowercased");

  const shortPw = RegisterSchema.safeParse({ name: "Bob", email: "b@b.com", password: "short" });
  console.assert(!shortPw.success, "Ex7: password < 8 chars should fail");

  console.log("Chapter 4 verification complete ✓");
}

verify();
