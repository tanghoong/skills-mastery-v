# Chapter 14: Error Handling Patterns (Hour 14)

TypeScript does not make errors disappear, but it gives you tools to handle them in a type-safe, predictable way. This chapter covers patterns used in production-grade codebases.

## 1. The Problem with `try / catch`

In TypeScript's strict mode, the caught error is typed as `unknown`, not `Error`. This forces you to narrow it before use.

```typescript
try {
    JSON.parse("invalid json{{{");
} catch (error) {
    // error is `unknown` — you cannot call .message directly
    if (error instanceof Error) {
        console.error(error.message); // safe
    } else {
        console.error("Unknown error:", String(error));
    }
}
```

## 2. Custom Typed Error Classes

Extend the built-in `Error` class to create domain-specific errors you can distinguish with `instanceof`.

```typescript
class NetworkError extends Error {
    constructor(
        public readonly statusCode: number,
        message: string
    ) {
        super(message);
        this.name = "NetworkError";
    }
}

class ValidationError extends Error {
    constructor(
        public readonly field: string,
        message: string
    ) {
        super(message);
        this.name = "ValidationError";
    }
}

async function fetchUser(id: number) {
    const res = await fetch(`/api/users/${id}`);
    if (res.status === 404) throw new NetworkError(404, "User not found");
    if (!res.ok)            throw new NetworkError(res.status, "Request failed");
    return res.json();
}

try {
    await fetchUser(99);
} catch (error) {
    if (error instanceof NetworkError) {
        console.error(`[${error.statusCode}] ${error.message}`);
    } else if (error instanceof ValidationError) {
        console.error(`Invalid field "${error.field}": ${error.message}`);
    } else {
        throw error; // re-throw unknown errors
    }
}
```

## 3. The Result Pattern

Instead of throwing exceptions, return a value that is either a success or a failure. This makes error handling explicit and impossible to accidentally ignore.

```typescript
type Result<T, E = Error> =
    | { success: true;  value: T }
    | { success: false; error: E };

async function parseJSON<T>(raw: string): Promise<Result<T>> {
    try {
        return { success: true, value: JSON.parse(raw) as T };
    } catch (e) {
        return { success: false, error: e instanceof Error ? e : new Error(String(e)) };
    }
}

const result = await parseJSON<{ name: string }>('{"name":"Alice"}');

if (result.success) {
    console.log(result.value.name); // TypeScript knows value exists
} else {
    console.error(result.error.message); // TypeScript knows error exists
}
```

## 4. Typed Result with a Helper

You can make the Result pattern ergonomic with helper functions.

```typescript
function ok<T>(value: T): Result<T, never> {
    return { success: true, value };
}

function fail<E = Error>(error: E): Result<never, E> {
    return { success: false, error };
}

// Usage
function divide(a: number, b: number): Result<number, string> {
    if (b === 0) return fail("Cannot divide by zero");
    return ok(a / b);
}

const r = divide(10, 0);
if (r.success) {
    console.log(r.value);
} else {
    console.error(r.error); // "Cannot divide by zero"
}
```

## 5. Discriminated Union Errors

For operations with multiple possible failure modes, use discriminated unions to make each error case explicit.

```typescript
type AuthError =
    | { code: "INVALID_CREDENTIALS"; message: string }
    | { code: "ACCOUNT_LOCKED";      lockedUntil: Date }
    | { code: "RATE_LIMITED";        retryAfter: number };

type AuthResult = Result<{ token: string }, AuthError>;

async function login(email: string, password: string): Promise<AuthResult> {
    // ... authentication logic
    return fail({ code: "RATE_LIMITED", retryAfter: 30 });
}

const result = await login("alice@example.com", "password");

if (!result.success) {
    switch (result.error.code) {
        case "INVALID_CREDENTIALS":
            console.error(result.error.message);
            break;
        case "ACCOUNT_LOCKED":
            console.error(`Locked until ${result.error.lockedUntil.toISOString()}`);
            break;
        case "RATE_LIMITED":
            console.error(`Try again in ${result.error.retryAfter}s`);
            break;
    }
}
```

## 6. Wrapping Third-Party Calls Safely

A utility to convert any thrown exception into a `Result` without repeating try/catch everywhere.

```typescript
async function tryCatch<T>(
    fn: () => Promise<T>
): Promise<Result<T>> {
    try {
        return ok(await fn());
    } catch (e) {
        return fail(e instanceof Error ? e : new Error(String(e)));
    }
}

// Usage — no try/catch needed at the call site
const result = await tryCatch(() => fetch("/api/data").then(r => r.json()));

if (result.success) {
    console.log(result.value);
} else {
    console.error(result.error.message);
}
```

## Action Item for Hour 14:

- Refactor the `apiFetch<T>` function from Chapter 9 to return `Promise<Result<T, NetworkError>>` instead of throwing.
- Update the call sites to use the `Result` pattern — no try/catch blocks allowed at the call site.
