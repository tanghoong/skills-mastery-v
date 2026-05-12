/**
 * Chapter 14 — Error Boundaries & Suspense
 *
 * Type-check: npx tsc --noEmit --strict exercises/chapter_14.tsx
 * Run:        tsx exercises/chapter_14.tsx
 *
 * These exercises implement typed error handling patterns including
 * the Result<T, E> wrapper and error classification used in DevLink.
 */

// =============================================================================
// EXERCISE 1 — ErrorInfo shape
// =============================================================================
// TODO: Define interface `ComponentErrorInfo` matching React's ErrorInfo:
//   - componentStack: string
//   - digest?:        string  (React 18+ server-side error id)

interface ComponentErrorInfo {
  // TODO
}

// =============================================================================
// EXERCISE 2 — Typed error classes
// =============================================================================
// TODO: Define class `AppError` extending Error with:
//   - code:    string   (e.g. "NOT_FOUND", "UNAUTHORIZED")
//   - status:  number   (HTTP status equivalent)
//   - context?: Record<string, unknown>  (additional debug info)
//
// TODO: Define class `NetworkError` extending AppError with:
//   - url:    string
//   - method: string
//   Constructor should call super with message, code: "NETWORK_ERROR", status: 0

class AppError extends Error {
  // TODO
  constructor(message: string, code: string, status: number, context?: Record<string, unknown>) {
    super(message);
    this.name = "AppError";
  }
}

class NetworkError extends AppError {
  // TODO
  constructor(message: string, url: string, method: string) {
    super(message, "NETWORK_ERROR", 0);
  }
}

// =============================================================================
// EXERCISE 3 — Result<T, E> pattern
// =============================================================================
// TODO: Define `Result<T, E = AppError>` as a discriminated union:
//   - { ok: true;  value: T }
//   - { ok: false; error: E }
//
// TODO: Implement helper functions:
//   - `ok<T>(value: T): Result<T>` — wraps a success value
//   - `err<E extends Error = AppError>(error: E): Result<never, E>` — wraps an error
//   - `fromPromise<T>(p: Promise<T>): Promise<Result<T>>` — converts a Promise

type Result<T, E extends Error = AppError> = never; // replace with discriminated union

function ok<T>(value: T): Result<T> {
  // TODO
  return {} as Result<T>;
}

function err<E extends Error = AppError>(error: E): Result<never, E> {
  // TODO
  return {} as Result<never, E>;
}

async function fromPromise<T>(p: Promise<T>): Promise<Result<T>> {
  // TODO
  return {} as Result<T>;
}

// =============================================================================
// EXERCISE 4 — Error boundary state machine
// =============================================================================
// TODO: Define `ErrorBoundaryState` as a discriminated union:
//   - { phase: "ok" }
//   - { phase: "error"; error: Error; info: ComponentErrorInfo }
//
// TODO: Implement `errorBoundaryReducer` that handles:
//   - action "caught": transitions to "error" state
//   - action "reset":  transitions back to "ok" state

type ErrorBoundaryState = never; // replace

type ErrorBoundaryAction =
  | { type: "caught"; error: Error; info: ComponentErrorInfo }
  | { type: "reset" };

function errorBoundaryReducer(
  state: ErrorBoundaryState,
  action: ErrorBoundaryAction
): ErrorBoundaryState {
  // TODO
  return state;
}

// =============================================================================
// EXERCISE 5 — Lazy load registry
// =============================================================================
// DevLink lazy-loads admin sections. Model the registry.
// TODO: Define type `LazySection` as a union:
//   "dashboard" | "profile" | "projects" | "links" | "settings"
//
// TODO: Define `LazySectionRegistry` as Record<LazySection, string>
//       where each value is a module path string (e.g. "./features/admin/Dashboard")
//
// TODO: Create the actual `lazySections` registry with all 5 entries

type LazySection = never; // replace

type LazySectionRegistry = Record<LazySection, string>;

const lazySections: LazySectionRegistry = {
  // TODO
};

// =============================================================================
// VERIFICATION
// =============================================================================

async function verify(): Promise<void> {
  // Exercise 2 — AppError
  const appErr = new AppError("Not found", "NOT_FOUND", 404, { id: "123" });
  console.assert(appErr.message === "Not found",    "Ex2: message should be set");
  console.assert(appErr.name === "AppError",        "Ex2: name should be AppError");
  console.assert(appErr instanceof Error,            "Ex2: should extend Error");

  const netErr = new NetworkError("Fetch failed", "https://api.devlink.app/profile", "GET");
  console.assert(netErr instanceof AppError,         "Ex2: NetworkError extends AppError");

  // Exercise 3 — Result<T>
  const success = ok(42);
  console.assert(success.ok === true,   "Ex3: ok() should have ok: true");
  if (success.ok) {
    console.assert(success.value === 42, "Ex3: value should be 42");
  }

  const failure = err(new AppError("fail", "FAIL", 500));
  console.assert(failure.ok === false, "Ex3: err() should have ok: false");
  if (!failure.ok) {
    console.assert(failure.error.message === "fail", "Ex3: error message preserved");
  }

  // fromPromise — success
  const r1 = await fromPromise(Promise.resolve("hello"));
  console.assert(r1.ok === true, "Ex3: resolved promise → ok");
  if (r1.ok) console.assert(r1.value === "hello", "Ex3: value is 'hello'");

  // fromPromise — failure
  const r2 = await fromPromise(Promise.reject(new Error("boom")));
  console.assert(r2.ok === false, "Ex3: rejected promise → error");
  if (!r2.ok) console.assert(r2.error.message === "boom", "Ex3: error message preserved");

  // Exercise 4 — error boundary reducer
  const init: ErrorBoundaryState = { phase: "ok" } as ErrorBoundaryState;
  const error = new Error("Render crash");
  const info: ComponentErrorInfo = { componentStack: "\n  at ProjectList" };

  const errState = errorBoundaryReducer(init, { type: "caught", error, info });
  console.assert((errState as { phase: string }).phase === "error", "Ex4: should transition to error");

  const resetState = errorBoundaryReducer(errState, { type: "reset" });
  console.assert((resetState as { phase: string }).phase === "ok", "Ex4: should reset to ok");

  // Exercise 5 — lazy sections
  const sections: LazySection[] = ["dashboard", "profile", "projects", "links", "settings"];
  sections.forEach((s) => {
    console.assert(s in lazySections, `Ex5: ${s} should be in registry`);
    console.assert(typeof lazySections[s] === "string", `Ex5: ${s} value should be a string path`);
  });

  console.log("Chapter 14 verification complete ✓");
}

verify().catch(console.error);
