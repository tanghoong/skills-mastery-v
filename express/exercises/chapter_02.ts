/**
 * Chapter 2 — Routing & Typed Request/Response
 *
 * Run: tsx exercises/chapter_02.ts
 *
 * These exercises focus on typing Express route handlers correctly.
 * No actual server starts — we type-check the handler signatures.
 */

import type { RequestHandler, Request, Response, NextFunction } from "express";

// =============================================================================
// EXERCISE 1 — Define a typed params interface
// =============================================================================
// TODO: Define a `TaskParams` interface with:
//       - taskId:    string   (URL param — always string before coercion)
//       - projectId: string

interface TaskParams {
  // TODO
}

// =============================================================================
// EXERCISE 2 — Define typed response bodies
// =============================================================================
// TODO: Define a `Task` interface with:
//       id, projectId (number), title (string), status (string), priority (string)
//
// TODO: Define `TaskResponse` as: { ok: true; data: Task }
// TODO: Define `TaskListResponse` as: { ok: true; data: Task[]; meta: { page: number; limit: number; total: number } }
// TODO: Define `ErrorResponse` as: { ok: false; error: { code: string; message: string; statusCode: number } }

interface Task {
  // TODO
}

interface TaskResponse {
  // TODO
}

interface TaskListResponse {
  // TODO
}

interface ErrorResponse {
  // TODO
}

// =============================================================================
// EXERCISE 3 — Type a GET route handler
// =============================================================================
// TODO: Implement `getTaskHandler` as a fully-typed RequestHandler:
//       - Params: TaskParams
//       - Response body: TaskResponse
//       - Request body: never (GET has no body)
//       - Query: Record<string, string>
//
//       The handler should:
//       1. Parse taskId from req.params (use Number())
//       2. Return a mock Task with that ID (hardcode other fields)

const getTaskHandler: RequestHandler<TaskParams, TaskResponse, never, Record<string, string>> = (
  req,
  res
) => {
  // TODO
};

// =============================================================================
// EXERCISE 4 — Type a POST route handler
// =============================================================================
// TODO: Define `CreateTaskBody` with: title (string), priority (optional string)
// TODO: Implement `createTaskHandler` as a RequestHandler:
//       - Params: { projectId: string }
//       - Response body: TaskResponse
//       - Request body: CreateTaskBody
//       - Query: never
//
//       The handler should return 201 with a mock Task.

interface CreateTaskBody {
  // TODO
}

const createTaskHandler: RequestHandler<{ projectId: string }, TaskResponse, CreateTaskBody, never> = (
  req,
  res
) => {
  // TODO
};

// =============================================================================
// EXERCISE 5 — Type a list handler with query params
// =============================================================================
// TODO: Define `ListTaskQuery` with optional string fields: status, priority,
//       and string fields: page, limit (always present from defaults)
//
// TODO: Implement `listTasksHandler` that:
//       1. Reads page and limit from req.query, parses to numbers with defaults (1, 20)
//       2. Reads optional status filter
//       3. Returns TaskListResponse with empty data array and correct meta

interface ListTaskQuery {
  // TODO
}

const listTasksHandler: RequestHandler<{ projectId: string }, TaskListResponse, never, ListTaskQuery> = (
  req,
  res
) => {
  // TODO
};

// =============================================================================
// EXERCISE 6 — Extend Express Request with req.user
// =============================================================================
// TODO: Define an `AuthUser` interface with: id (number), email (string), role (string)
//
// In a real project this would be in src/types/express.d.ts using declaration merging.
// For this exercise, define a typed function that reads req.user safely.

interface AuthUser {
  // TODO
}

// TODO: Implement `getCurrentUser` — takes a Request and returns AuthUser | undefined.
//       The function should read `(req as any).user` and cast it properly.

function getCurrentUser(req: Request): AuthUser | undefined {
  // TODO
  return undefined;
}

// =============================================================================
// EXERCISE 7 — Router factory function signature
// =============================================================================
// TODO: Define a `RouterFactory<T>` generic type — a function that takes
//       a dependency of type T and returns Express Router.
//       Use: import { Router } from "express"

import { Router } from "express";

type RouterFactory<T> = (dep: T) => Router;

// TODO: Define `TaskService` interface with a `list` method:
//       list(projectId: string): Promise<Task[]>

interface TaskService {
  // TODO
}

// TODO: Create a `taskRouterFactory` constant of type `RouterFactory<TaskService>`
//       that creates a router with one GET "/" route that calls service.list()
//       (stub — you don't need to actually call it, just make it type-correct)

const taskRouterFactory: RouterFactory<TaskService> = (service) => {
  const router = Router({ mergeParams: true });
  // TODO: add a GET "/" route that returns tasks from service.list()
  return router;
};

// =============================================================================
// VERIFICATION
// =============================================================================

function verify(): void {
  // Exercise 3 — check the handler is typed as RequestHandler
  const _h: RequestHandler = getTaskHandler;
  console.assert(typeof getTaskHandler === "function", "Ex3: getTaskHandler should be a function");

  // Exercise 4
  console.assert(typeof createTaskHandler === "function", "Ex4: createTaskHandler should be a function");

  // Exercise 6
  const mockReq = { user: { id: 1, email: "a@b.com", role: "member" } } as unknown as Request;
  const user = getCurrentUser(mockReq);
  console.assert(user?.id === 1,            "Ex6: should return user with id 1");
  console.assert(user?.email === "a@b.com", "Ex6: should return user with correct email");

  // Exercise 7
  const router = taskRouterFactory({ list: async () => [] });
  console.assert(typeof router === "object", "Ex7: factory should return a Router");

  console.log("Chapter 2 verification complete ✓");
}

verify();
