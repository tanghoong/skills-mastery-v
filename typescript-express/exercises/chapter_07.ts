/**
 * Chapter 7 — REST API Design
 *
 * Run: tsx exercises/chapter_07.ts
 */

// =============================================================================
// EXERCISE 1 — ApiSuccess and ApiError envelopes
// =============================================================================
// TODO: Define generic `ApiSuccess<T>` interface: { ok: true; data: T }
// TODO: Define `ApiError` interface:
//       { ok: false; error: { code: string; message: string; statusCode: number; details?: unknown } }
// TODO: Define `ApiList<T>` interface: { ok: true; data: T[]; meta: PaginationMeta }
// TODO: Define `PaginationMeta` interface:
//       { page, limit, total, totalPages, hasNext, hasPrev: all numbers/booleans }

export interface PaginationMeta {
  // TODO
}

export interface ApiSuccess<T> {
  // TODO
}

export interface ApiError {
  // TODO
}

export interface ApiList<T> {
  // TODO
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// =============================================================================
// EXERCISE 2 — buildMeta
// =============================================================================
// TODO: Implement `buildMeta(page: number, limit: number, total: number): PaginationMeta`
//       - totalPages = Math.ceil(total / limit)
//       - hasNext    = page < totalPages
//       - hasPrev    = page > 1

export function buildMeta(page: number, limit: number, total: number): PaginationMeta {
  // TODO
  return {} as PaginationMeta;
}

// =============================================================================
// EXERCISE 3 — HTTP method validator
// =============================================================================
// TODO: Define `HttpMethod` as a union: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
// TODO: Define `RouteDefinition` interface: { method: HttpMethod; path: string; auth: boolean; description: string }
// TODO: Implement `validateRoutes(routes: RouteDefinition[]): string[]`
//       Returns an array of validation error messages for:
//       - GET routes that have a body (check description for "body")
//       - Routes with path params (:id) that also need auth=true
//       - DELETE routes that return 200 instead of 204 (check description for "200")

export type HttpMethod = never; // replace

export interface RouteDefinition {
  // TODO
}

export function validateRoutes(routes: RouteDefinition[]): string[] {
  const errors: string[] = [];
  // TODO
  return errors;
}

// =============================================================================
// EXERCISE 4 — URL designer
// =============================================================================
// TODO: Implement `designUrl(resource: string, subResource?: string, action?: string): string`
//       Rules:
//       - resource is plural (add "s" if not ending in "s")
//       - subResource is nested: /resources/:resourceId/subResources
//       - action is appended as a sub-path: /resources/:resourceId/action
//       - Examples:
//         designUrl("task")           → "/tasks"
//         designUrl("task", "comment") → "/tasks/:taskId/comments"
//         designUrl("task", undefined, "complete") → "/tasks/:taskId/complete"

export function designUrl(resource: string, subResource?: string, action?: string): string {
  // TODO
  return "";
}

// =============================================================================
// EXERCISE 5 — Pagination calculator
// =============================================================================
// TODO: Implement `paginate<T>(items: T[], page: number, limit: number): ApiList<T>`
//       Returns the correct slice of items with proper meta.

export function paginate<T>(items: T[], page: number, limit: number): ApiList<T> {
  // TODO
  return {} as ApiList<T>;
}

// =============================================================================
// EXERCISE 6 — PATCH body validator
// =============================================================================
// TODO: Implement `validatePatchBody<T extends object>(body: Partial<T>, allowedFields: (keyof T)[]): string[]`
//       Returns validation errors:
//       - If body is empty ({})         → ["At least one field must be provided"]
//       - If body has unknown fields    → ["Unknown field: {fieldName}"] for each

export function validatePatchBody<T extends object>(
  body: Partial<T>,
  allowedFields: (keyof T)[]
): string[] {
  // TODO
  return [];
}

// =============================================================================
// VERIFICATION
// =============================================================================

function verify(): void {
  // Exercise 2 — buildMeta
  const meta = buildMeta(2, 10, 35);
  console.assert(meta.totalPages === 4,    "Ex2: totalPages should be 4");
  console.assert(meta.hasNext   === true,  "Ex2: page 2 of 4 has next");
  console.assert(meta.hasPrev   === true,  "Ex2: page 2 has prev");
  console.assert(meta.total     === 35,    "Ex2: total should be 35");

  const firstPage = buildMeta(1, 20, 15);
  console.assert(firstPage.totalPages === 1,     "Ex2: 15 items / limit 20 = 1 page");
  console.assert(firstPage.hasNext    === false,  "Ex2: only 1 page, no next");
  console.assert(firstPage.hasPrev    === false,  "Ex2: first page has no prev");

  // Exercise 4 — URL design
  console.assert(designUrl("task")                      === "/tasks",                  "Ex4: singular → plural");
  console.assert(designUrl("project")                   === "/projects",               "Ex4: project → projects");
  console.assert(designUrl("task", "comment")           === "/tasks/:taskId/comments", "Ex4: nested resource");
  console.assert(designUrl("task", undefined, "complete") === "/tasks/:taskId/complete", "Ex4: action sub-path");

  // Exercise 5 — paginate
  const items  = Array.from({ length: 25 }, (_, i) => i + 1);
  const page2  = paginate(items, 2, 10);
  console.assert(page2.ok === true,               "Ex5: should be ok");
  console.assert(page2.data.length === 10,        "Ex5: page 2 should have 10 items");
  console.assert(page2.data[0] === 11,            "Ex5: page 2 starts at item 11");
  console.assert(page2.meta.totalPages === 3,     "Ex5: 25 items / 10 = 3 pages");
  console.assert(page2.meta.hasNext === true,     "Ex5: page 2 of 3 has next");
  console.assert(page2.meta.hasPrev === true,     "Ex5: page 2 has prev");

  const lastPage = paginate(items, 3, 10);
  console.assert(lastPage.data.length === 5,      "Ex5: last page has 5 items");
  console.assert(lastPage.meta.hasNext === false,  "Ex5: last page has no next");

  // Exercise 6 — PATCH validation
  interface Task { title: string; status: string; priority: string }
  const noFields = validatePatchBody<Task>({}, ["title","status","priority"]);
  console.assert(noFields.length > 0,              "Ex6: empty body should fail");

  const unknown = validatePatchBody({ title: "ok", unknown: "x" } as any, ["title","status","priority"]);
  console.assert(unknown.some((e) => e.includes("unknown")), "Ex6: unknown field should be reported");

  const valid = validatePatchBody<Task>({ title: "New title" }, ["title","status","priority"]);
  console.assert(valid.length === 0, "Ex6: valid patch should have no errors");

  console.log("Chapter 7 verification complete ✓");
}

verify();
