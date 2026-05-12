/**
 * Chapter 10 — Routing & Guards
 *
 * Type-check: npx tsc --noEmit --strict exercises/chapter_10.tsx
 * Run:        tsx exercises/chapter_10.tsx
 *
 * These exercises build the typed route param parsers, guard logic,
 * and redirect helpers used in DevLink's routing layer.
 */

// =============================================================================
// EXERCISE 1 — Route param types
// =============================================================================
// TODO: Define typed interfaces for each route's params:
//   - `PublicProfileParams`:  { username: string }
//   - `ProjectEditorParams`:  { id: string }
//   - `AdminSectionParams`:   { section: "profile" | "projects" | "links" | "settings" }
//
// These are what `useParams<T>()` would return.

interface PublicProfileParams {
  // TODO
}

interface ProjectEditorParams {
  // TODO
}

interface AdminSectionParams {
  // TODO
}

// =============================================================================
// EXERCISE 2 — Safe param extraction
// =============================================================================
// `useParams` returns T where all values are `string | undefined`.
// TODO: Implement `requireParam` that:
//   - Takes `params: Record<string, string | undefined>`
//   - Takes `key: string`
//   - Returns the value as `string` if present
//   - Throws an Error with message `"Missing required route param: <key>"` if absent

function requireParam(params: Record<string, string | undefined>, key: string): string {
  // TODO
  return "";
}

// =============================================================================
// EXERCISE 3 — Search param utilities
// =============================================================================
// TODO: Implement `parseSearchParams` that takes a `URLSearchParams` (or plain object)
//       and a schema definition, and returns typed values.
//
// Define `SearchParamSchema<T>` where each key maps to a parser:
//   - `{ type: "string"; default?: string }`
//   - `{ type: "number"; default?: number }`
//   - `{ type: "boolean"; default?: boolean }`
//
// Implement `parseSearchParam(params: URLSearchParams, key: string, schema: ParamDef)`
// that returns the correctly typed value.

type ParamDef =
  | { type: "string";  default?: string }
  | { type: "number";  default?: number }
  | { type: "boolean"; default?: boolean };

function parseSearchParam(
  params: URLSearchParams,
  key: string,
  schema: ParamDef
): string | number | boolean {
  // TODO: get the value, parse based on schema.type, return schema.default if absent
  if (schema.type === "string")  return schema.default ?? "";
  if (schema.type === "number")  return schema.default ?? 0;
  if (schema.type === "boolean") return schema.default ?? false;
  return "";
}

// =============================================================================
// EXERCISE 4 — Auth guard logic
// =============================================================================
// TODO: Define interface `GuardResult` as a discriminated union:
//   - { allow: true }
//   - { allow: false; redirectTo: string; state?: Record<string, unknown> }
//
// TODO: Implement `checkAuthGuard(user: User | null, currentPath: string): GuardResult`
//   - If user is null: redirect to "/login" with state { from: currentPath }
//   - Otherwise: allow

interface User {
  id: string;
  name: string;
  role: "admin" | "viewer";
}

type GuardResult = never; // replace with discriminated union

function checkAuthGuard(user: User | null, currentPath: string): GuardResult {
  // TODO
  return { allow: false, redirectTo: "/login" } as GuardResult;
}

// =============================================================================
// EXERCISE 5 — Role guard
// =============================================================================
// TODO: Implement `checkRoleGuard(user: User | null, allowedRoles: User["role"][]): GuardResult`
//   - If no user: redirect to "/login"
//   - If user role not in allowedRoles: redirect to "/403"
//   - Otherwise: allow

function checkRoleGuard(user: User | null, allowedRoles: User["role"][]): GuardResult {
  // TODO
  return { allow: false, redirectTo: "/login" } as GuardResult;
}

// =============================================================================
// EXERCISE 6 — Navigation state helpers
// =============================================================================
// TODO: Define `LoginRedirectState` interface with:
//   - from: string  (the path the user was trying to visit)
//
// TODO: Implement `getRedirectTarget(state: unknown, fallback: string): string`
//   - Safely reads `state.from` if state is a LoginRedirectState
//   - Returns fallback if state is not the expected shape

interface LoginRedirectState {
  // TODO
}

function getRedirectTarget(state: unknown, fallback: string): string {
  // TODO: type-narrow state before accessing .from
  return fallback;
}

// =============================================================================
// VERIFICATION
// =============================================================================

function verify(): void {
  // Exercise 2 — requireParam
  const params = { username: "charlie", id: undefined };
  console.assert(requireParam(params, "username") === "charlie", "Ex2: should return param value");

  let threw = false;
  try { requireParam(params, "id"); }
  catch (e) {
    threw = true;
    console.assert(e instanceof Error && e.message.includes("id"), "Ex2: error mentions key name");
  }
  console.assert(threw, "Ex2: should throw for undefined param");

  // Exercise 3 — parseSearchParam
  const url = new URLSearchParams("page=3&q=react&featured=true");
  const page     = parseSearchParam(url, "page",     { type: "number",  default: 1 });
  const query    = parseSearchParam(url, "q",        { type: "string",  default: "" });
  const featured = parseSearchParam(url, "featured", { type: "boolean", default: false });
  const missing  = parseSearchParam(url, "sort",     { type: "string",  default: "newest" });

  console.assert(page === 3,          "Ex3: page should be 3 (number)");
  console.assert(query === "react",   "Ex3: query should be 'react'");
  console.assert(featured === true,   "Ex3: featured should be true (boolean)");
  console.assert(missing === "newest","Ex3: missing param should use default");

  // Exercise 4 — auth guard
  const noUser = checkAuthGuard(null, "/admin/profile");
  console.assert(noUser.allow === false, "Ex4: no user → don't allow");
  if (!noUser.allow) {
    console.assert(noUser.redirectTo === "/login",         "Ex4: redirect to /login");
    console.assert(noUser.state?.from === "/admin/profile", "Ex4: from should be preserved");
  }

  const withUser = checkAuthGuard({ id: "1", name: "Charlie", role: "admin" }, "/admin");
  console.assert(withUser.allow === true, "Ex4: user present → allow");

  // Exercise 5 — role guard
  const viewer: User = { id: "2", name: "Bob", role: "viewer" };
  const admin: User  = { id: "1", name: "Charlie", role: "admin" };

  const viewerAdmin = checkRoleGuard(viewer, ["admin"]);
  console.assert(viewerAdmin.allow === false, "Ex5: viewer accessing admin route → deny");
  if (!viewerAdmin.allow) {
    console.assert(viewerAdmin.redirectTo === "/403", "Ex5: should redirect to /403");
  }

  const adminAdmin = checkRoleGuard(admin, ["admin"]);
  console.assert(adminAdmin.allow === true, "Ex5: admin accessing admin route → allow");

  // Exercise 6 — redirect state
  const result1 = getRedirectTarget({ from: "/admin/projects" }, "/admin");
  console.assert(result1 === "/admin/projects", "Ex6: should extract 'from' from state");

  const result2 = getRedirectTarget(null, "/admin");
  console.assert(result2 === "/admin", "Ex6: null state → fallback");

  const result3 = getRedirectTarget({ someOtherKey: "value" }, "/admin");
  console.assert(result3 === "/admin", "Ex6: wrong shape → fallback");

  console.log("Chapter 10 verification complete ✓");
}

verify();
