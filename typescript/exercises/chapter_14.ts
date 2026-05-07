// ============================================================
// Chapter 14 — Error Handling Patterns
// Run: tsx exercises/chapter_14.ts
// ============================================================

// ----------------------------------------------------------------
// Exercise 1: Custom error classes
// Create three custom error classes:
//   ValidationError(field: string, message: string)
//   NotFoundError(resource: string, id: number | string)
//   UnauthorizedError(message?: string)
//
// Each should set `this.name` correctly and extend Error.
// Write a function `handleError(error: unknown): void` that narrows
// and logs a descriptive message for each type.
// ----------------------------------------------------------------

// TODO: implement ValidationError, NotFoundError, UnauthorizedError, handleError

// handleError(new ValidationError("email", "must be a valid email"));
// handleError(new NotFoundError("User", 42));
// handleError(new UnauthorizedError());
// handleError(new Error("generic error"));
// handleError("something weird");


// ----------------------------------------------------------------
// Exercise 2: The Result type
// Define: type Result<T, E = Error> = { success: true; value: T } | { success: false; error: E }
// And helpers: ok<T>(value: T): Result<T, never>
//              fail<E>(error: E): Result<never, E>
//
// Then implement:
//   parsePosInt(input: string): Result<number, string>
//   — succeeds with the parsed integer if input is a valid positive integer
//   — fails with a descriptive error message otherwise
// ----------------------------------------------------------------

// TODO: define Result, ok, fail, and implement parsePosInt

// const r1 = parsePosInt("42");
// const r2 = parsePosInt("-5");
// const r3 = parsePosInt("abc");
// if (r1.success) console.log(r1.value);  // 42
// if (!r2.success) console.log(r2.error); // "must be a positive integer"
// if (!r3.success) console.log(r3.error); // "not a valid number"


// ----------------------------------------------------------------
// Exercise 3: Discriminated union errors
// Model the errors a login flow can produce:
//   WRONG_PASSWORD | ACCOUNT_LOCKED (with lockedUntil: Date) | TOO_MANY_ATTEMPTS (with waitSeconds: number)
//
// Write `login(email: string, password: string): Result<{ token: string }, LoginError>`
// Simulate each error case based on the email:
//   "locked@test.com"   → ACCOUNT_LOCKED
//   "attempts@test.com" → TOO_MANY_ATTEMPTS
//   correct password is "secret123" → success
//   anything else       → WRONG_PASSWORD
// ----------------------------------------------------------------

// TODO: define LoginError union and implement login


// ----------------------------------------------------------------
// Exercise 4: tryCatch wrapper
// Write `tryCatch<T>(fn: () => T): Result<T>`
// and `tryCatchAsync<T>(fn: () => Promise<T>): Promise<Result<T>>`
// that wrap any throwing function into a Result, so callers
// never need to write try/catch themselves.
// ----------------------------------------------------------------

// TODO: implement tryCatch and tryCatchAsync

// const result1 = tryCatch(() => JSON.parse('{"ok":true}'));
// const result2 = tryCatch(() => JSON.parse("invalid{{{"));
// console.log(result1); // { success: true, value: { ok: true } }
// console.log(result2); // { success: false, error: SyntaxError }


// ----------------------------------------------------------------
// Exercise 5: Refactor with Result
// The function below throws — refactor it to return Result<number, string>
// instead of throwing, so callers can handle errors without try/catch.
// ----------------------------------------------------------------

function divide(a: number, b: number): number {
    if (b === 0) throw new Error("Cannot divide by zero");
    if (!Number.isFinite(a) || !Number.isFinite(b)) throw new Error("Inputs must be finite numbers");
    return a / b;
}

// TODO: rewrite as `safeDivide(a, b): Result<number, string>`

// const r = safeDivide(10, 0);
// if (!r.success) console.log(r.error); // "Cannot divide by zero"
// const r2 = safeDivide(10, 2);
// if (r2.success) console.log(r2.value); // 5
