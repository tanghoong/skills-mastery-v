/**
 * Chapter 15 — Testing Express
 *
 * Run: tsx exercises/chapter_15.ts
 *
 * These exercises build test helpers and test patterns WITHOUT a real test runner.
 * In practice you'd use Vitest + Supertest. Here we simulate the patterns.
 */

// =============================================================================
// EXERCISE 1 — Test assertion helpers
// =============================================================================
// TODO: Implement `assertStatus(response: { status: number }, expected: number): void`
//       Throws if response.status !== expected

export function assertStatus(response: { status: number }, expected: number): void {
  // TODO
}

// TODO: Implement `assertBody<T>(response: { body: unknown }, expected: Partial<T>): void`
//       Checks that each key in `expected` is present and equal in response.body
//       Throws a descriptive error if any mismatch

export function assertBody<T>(response: { body: unknown }, expected: Partial<T>): void {
  // TODO
}

// =============================================================================
// EXERCISE 2 — Mock HTTP response
// =============================================================================
// TODO: Define `MockResponse` class that simulates Express's Response:
//       - Constructor: no args
//       - Properties: statusCode (default 200), body (unknown), headers Record<string,string>
//       - Methods:
//         status(code: number): this
//         json(data: unknown): this   (sets body)
//         set(name: string, value: string): this
//         send(data?: unknown): this

export class MockResponse {
  statusCode = 200;
  body:    unknown = undefined;
  headers: Record<string, string> = {};

  status(code: number): this {
    // TODO
    return this;
  }

  json(data: unknown): this {
    // TODO
    return this;
  }

  set(name: string, value: string): this {
    // TODO
    return this;
  }

  send(data?: unknown): this {
    // TODO
    return this;
  }
}

// =============================================================================
// EXERCISE 3 — Mock Request builder
// =============================================================================
// TODO: Define `MockRequestOptions` interface:
//       method?, path?, body?, params?, query?, headers?, user?
//       (all optional, typed with Record<string,unknown> or any)
//
// TODO: Implement `buildMockRequest(opts: MockRequestOptions): Record<string, unknown>`
//       Returns an object that looks like an Express Request

export interface MockRequestOptions {
  method?:  string;
  path?:    string;
  body?:    unknown;
  params?:  Record<string, string>;
  query?:   Record<string, string>;
  headers?: Record<string, string>;
  user?:    { id: number; email: string; role: string; orgId: number };
}

export function buildMockRequest(opts: MockRequestOptions = {}): Record<string, unknown> {
  // TODO
  return {};
}

// =============================================================================
// EXERCISE 4 — Test data factory
// =============================================================================
// TODO: Define `Task` interface:
//       id, projectId, title, status ("BACKLOG"|"TODO"|"IN_PROGRESS"|"DONE"), priority ("HIGH"|"MEDIUM"|"LOW"|"NONE"),
//       createdAt (Date), updatedAt (Date), assigneeId? (number)
//
// TODO: Implement `createMockTask(overrides?: Partial<Task>): Task`
//       Returns a task with sensible defaults, merged with overrides

export interface Task {
  id:          number;
  projectId:   number;
  title:       string;
  status:      "BACKLOG" | "TODO" | "IN_PROGRESS" | "DONE";
  priority:    "HIGH" | "MEDIUM" | "LOW" | "NONE";
  createdAt:   Date;
  updatedAt:   Date;
  assigneeId?: number;
}

let mockTaskIdCounter = 1;

export function createMockTask(overrides: Partial<Task> = {}): Task {
  // TODO: return a Task with defaults, merged with overrides
  return {} as Task;
}

// =============================================================================
// EXERCISE 5 — Coverage tracker
// =============================================================================
// TODO: Implement `CoverageTracker` class:
//       - Constructor takes an array of route strings (e.g. ["GET /tasks", "POST /tasks"])
//       - `cover(method: string, path: string): void` marks a route as covered
//       - `report(): { covered: string[]; uncovered: string[]; percentage: number }`

export class CoverageTracker {
  private covered = new Set<string>();

  constructor(private routes: string[]) {}

  cover(method: string, path: string): void {
    // TODO: normalise to "METHOD /path" format and mark as covered
  }

  report(): { covered: string[]; uncovered: string[]; percentage: number } {
    // TODO
    return { covered: [], uncovered: [], percentage: 0 };
  }
}

// =============================================================================
// EXERCISE 6 — Error scenario matrix
// =============================================================================
// TODO: Implement `generateErrorScenarios(fieldName: string): Array<{ label: string; value: unknown }>`
//       Returns test scenarios that would fail validation for a required string field:
//       - missing (undefined)
//       - null
//       - empty string ""
//       - number 42
//       - array []
//       - object {}

export function generateErrorScenarios(fieldName: string): Array<{ label: string; value: unknown }> {
  // TODO
  return [];
}

// =============================================================================
// VERIFICATION
// =============================================================================

function verify(): void {
  // Exercise 1 — assertStatus
  let threw = false;
  try { assertStatus({ status: 404 }, 200); } catch { threw = true; }
  console.assert(threw, "Ex1: assertStatus should throw on mismatch");

  let noThrow = true;
  try { assertStatus({ status: 200 }, 200); } catch { noThrow = false; }
  console.assert(noThrow, "Ex1: assertStatus should not throw on match");

  // Exercise 1 — assertBody
  let bodyMismatch = false;
  try { assertBody({ body: { ok: false } }, { ok: true }); } catch { bodyMismatch = true; }
  console.assert(bodyMismatch, "Ex1: assertBody should throw on mismatch");

  // Exercise 2 — MockResponse
  const res = new MockResponse();
  res.status(201).json({ ok: true, data: { id: 1 } });
  console.assert(res.statusCode === 201,      "Ex2: status should be 201");
  console.assert((res.body as any).ok === true, "Ex2: body should be set");

  res.set("X-Custom", "value");
  console.assert(res.headers["X-Custom"] === "value", "Ex2: header should be set");

  // Exercise 3 — buildMockRequest
  const req = buildMockRequest({ method: "GET", path: "/tasks", params: { taskId: "42" } });
  console.assert((req as any).method === "GET",       "Ex3: method should be set");
  console.assert((req as any).params?.taskId === "42","Ex3: params should be set");

  const defaultReq = buildMockRequest();
  console.assert((defaultReq as any).body !== undefined || true, "Ex3: should not throw on empty opts");

  // Exercise 4 — createMockTask
  const task1 = createMockTask();
  const task2 = createMockTask();
  console.assert(task1.id !== task2.id,         "Ex4: each mock task should have unique id");
  console.assert(task1.title !== undefined,      "Ex4: should have a default title");
  console.assert(task1.createdAt instanceof Date,"Ex4: createdAt should be a Date");

  const custom = createMockTask({ title: "Custom Task", status: "DONE" });
  console.assert(custom.title  === "Custom Task", "Ex4: override title should be used");
  console.assert(custom.status === "DONE",        "Ex4: override status should be used");

  // Exercise 5 — CoverageTracker
  const tracker = new CoverageTracker(["GET /tasks", "POST /tasks", "DELETE /tasks/:id"]);
  tracker.cover("GET",  "/tasks");
  tracker.cover("POST", "/tasks");
  const report = tracker.report();
  console.assert(report.covered.length   === 2, "Ex5: 2 covered routes");
  console.assert(report.uncovered.length === 1, "Ex5: 1 uncovered route");
  console.assert(Math.round(report.percentage) === 67, "Ex5: 2/3 ≈ 67%");

  // Exercise 6 — error scenarios
  const scenarios = generateErrorScenarios("title");
  console.assert(scenarios.length >= 5, "Ex6: should have at least 5 scenarios");
  console.assert(scenarios.some((s) => s.value === undefined), "Ex6: should include undefined");
  console.assert(scenarios.some((s) => s.value === null),      "Ex6: should include null");
  console.assert(scenarios.some((s) => s.value === ""),        "Ex6: should include empty string");

  console.log("Chapter 15 verification complete ✓");
}

verify();
