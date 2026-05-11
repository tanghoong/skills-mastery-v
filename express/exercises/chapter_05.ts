/**
 * Chapter 5 — Error Handling
 *
 * Run: tsx exercises/chapter_05.ts
 */

// =============================================================================
// EXERCISE 1 — ErrorCode union
// =============================================================================
// TODO: Define `ErrorCode` as a union of string literals:
//       "VALIDATION_ERROR" | "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND"
//       | "CONFLICT" | "INTERNAL_ERROR" | "RATE_LIMITED"

export type ErrorCode = never; // replace with union

// =============================================================================
// EXERCISE 2 — AppError class
// =============================================================================
// TODO: Implement `AppError extends Error` with:
//       - Properties: code (ErrorCode), statusCode (number), details? (unknown)
//       - Constructor: (code, message, statusCode, details?)
//       - Set this.name = "AppError"
//       - Call Object.setPrototypeOf(this, new.target.prototype)

export class AppError extends Error {
  readonly code:       ErrorCode;
  readonly statusCode: number;
  readonly details?:   unknown;

  constructor(code: ErrorCode, message: string, statusCode: number, details?: unknown) {
    super(message);
    // TODO
  }
}

// =============================================================================
// EXERCISE 3 — Convenience error subclasses
// =============================================================================
// TODO: Implement these subclasses of AppError:
//
//   NotFoundError(resource: string, id: number | string)
//     → code: "NOT_FOUND", statusCode: 404
//     → message: `${resource} ${id} not found`
//
//   UnauthorizedError(message = "Authentication required")
//     → code: "UNAUTHORIZED", statusCode: 401
//
//   ForbiddenError(message = "Insufficient permissions")
//     → code: "FORBIDDEN", statusCode: 403
//
//   ConflictError(resource: string, field: string, value: string)
//     → code: "CONFLICT", statusCode: 409
//     → message: `${resource} with ${field} '${value}' already exists`

export class NotFoundError extends AppError {
  constructor(resource: string, id: number | string) {
    // TODO
    super("NOT_FOUND", "", 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required") {
    // TODO
    super("UNAUTHORIZED", message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Insufficient permissions") {
    // TODO
    super("FORBIDDEN", message, 403);
  }
}

export class ConflictError extends AppError {
  constructor(resource: string, field: string, value: string) {
    // TODO
    super("CONFLICT", "", 409);
  }
}

// =============================================================================
// EXERCISE 4 — Result type
// =============================================================================
// TODO: Define `Result<T, E = AppError>` as a discriminated union:
//       | { ok: true;  value: T }
//       | { ok: false; error: E }
//
// TODO: Implement `ok<T>(value: T): Result<T, never>`
// TODO: Implement `err<E>(error: E): Result<never, E>`

export type Result<T, E = AppError> = never; // replace with the union

export function ok<T>(value: T): Result<T, never> {
  return {} as Result<T, never>; // TODO
}

export function err<E>(error: E): Result<never, E> {
  return {} as Result<never, E>; // TODO
}

// =============================================================================
// EXERCISE 5 — narrowError utility
// =============================================================================
// TODO: Implement `narrowError(e: unknown): AppError`
//       - If e is an AppError, return it
//       - If e is an Error, return new AppError("INTERNAL_ERROR", e.message, 500)
//       - Otherwise, return new AppError("INTERNAL_ERROR", "Unknown error", 500)

export function narrowError(e: unknown): AppError {
  // TODO
  return new AppError("INTERNAL_ERROR", "Unknown error", 500);
}

// =============================================================================
// EXERCISE 6 — HTTP status code mapper
// =============================================================================
// TODO: Implement `codeToStatus(code: ErrorCode): number` that returns the
//       correct HTTP status for each ErrorCode:
//       VALIDATION_ERROR → 422
//       UNAUTHORIZED     → 401
//       FORBIDDEN        → 403
//       NOT_FOUND        → 404
//       CONFLICT         → 409
//       RATE_LIMITED     → 429
//       INTERNAL_ERROR   → 500

export function codeToStatus(code: ErrorCode): number {
  // TODO
  return 500;
}

// =============================================================================
// EXERCISE 7 — Login service using Result pattern
// =============================================================================
// TODO: Implement `loginService(email: string, password: string): Result<string, UnauthorizedError>`
//       - If email is "admin@test.com" and password is "password123": return ok("fake-token")
//       - Otherwise: return err(new UnauthorizedError("Invalid credentials"))

export function loginService(email: string, password: string): Result<string, UnauthorizedError> {
  // TODO
  return err(new UnauthorizedError());
}

// =============================================================================
// VERIFICATION
// =============================================================================

function verify(): void {
  // Exercise 2 — AppError instanceof
  const appErr = new AppError("NOT_FOUND", "Task not found", 404);
  console.assert(appErr instanceof AppError,       "Ex2: should be instanceof AppError");
  console.assert(appErr instanceof Error,          "Ex2: should be instanceof Error");
  console.assert(appErr.code === "NOT_FOUND",      "Ex2: code should be NOT_FOUND");
  console.assert(appErr.statusCode === 404,        "Ex2: statusCode should be 404");
  console.assert(appErr.message === "Task not found", "Ex2: message should match");
  console.assert(appErr.name === "AppError",       "Ex2: name should be AppError");

  // Exercise 3
  const notFound = new NotFoundError("Task", 42);
  console.assert(notFound.statusCode === 404,                "Ex3: NotFoundError statusCode");
  console.assert(notFound.message === "Task 42 not found",   "Ex3: NotFoundError message");

  const conflict = new ConflictError("User", "email", "a@b.com");
  console.assert(conflict.statusCode === 409,                                    "Ex3: ConflictError statusCode");
  console.assert(conflict.message === "User with email 'a@b.com' already exists", "Ex3: ConflictError message");

  // Exercise 4 — Result pattern
  const success = ok(42);
  console.assert(success.ok === true,           "Ex4: ok() should set ok=true");
  console.assert((success as any).value === 42, "Ex4: ok() should carry value");

  const failure = err(new UnauthorizedError());
  console.assert(failure.ok === false,                        "Ex4: err() should set ok=false");
  console.assert((failure as any).error instanceof AppError, "Ex4: err() should carry error");

  // Exercise 5
  const narrowed = narrowError(new TypeError("bad type"));
  console.assert(narrowed instanceof AppError, "Ex5: should return AppError");
  console.assert(narrowed.message === "bad type", "Ex5: message should come from original Error");

  const narrowedUnknown = narrowError("a string error");
  console.assert(narrowedUnknown.message === "Unknown error", "Ex5: non-Error should get generic message");

  // Exercise 6
  console.assert(codeToStatus("NOT_FOUND")       === 404, "Ex6: NOT_FOUND → 404");
  console.assert(codeToStatus("UNAUTHORIZED")     === 401, "Ex6: UNAUTHORIZED → 401");
  console.assert(codeToStatus("VALIDATION_ERROR") === 422, "Ex6: VALIDATION_ERROR → 422");
  console.assert(codeToStatus("RATE_LIMITED")     === 429, "Ex6: RATE_LIMITED → 429");

  // Exercise 7 — Result pattern usage
  const good = loginService("admin@test.com", "password123");
  console.assert(good.ok === true,                           "Ex7: valid login should succeed");
  console.assert((good as any).value === "fake-token",      "Ex7: should return token");

  const bad = loginService("admin@test.com", "wrong");
  console.assert(bad.ok === false,                          "Ex7: wrong password should fail");
  console.assert((bad as any).error instanceof UnauthorizedError, "Ex7: should return UnauthorizedError");

  console.log("Chapter 5 verification complete ✓");
}

verify();
