/**
 * Chapter 14 — Security Hardening
 *
 * Run: tsx exercises/chapter_14.ts
 */

// =============================================================================
// EXERCISE 1 — CORS origin validator
// =============================================================================
// TODO: Implement `isCorsAllowed(origin: string | undefined, allowedOrigins: Set<string>, isDev: boolean): boolean`
//       - If origin is undefined: allow (curl/Postman in dev, but only if isDev)
//       - Actually: allow undefined origin always (server-to-server, Postman)
//       - If origin is in allowedOrigins: allow
//       - Otherwise: deny

export function isCorsAllowed(
  origin:         string | undefined,
  allowedOrigins: Set<string>,
  isDev:          boolean
): boolean {
  // TODO
  return false;
}

// =============================================================================
// EXERCISE 2 — Rate limiter (in-memory sliding window)
// =============================================================================
// TODO: Implement `RateLimiter` class:
//       - Constructor: (maxRequests: number, windowMs: number)
//       - `check(key: string): { allowed: boolean; remaining: number; resetAt: number }`
//         Tracks requests per key in the window, increments count
//         remaining = maxRequests - count (min 0)
//         resetAt = timestamp (ms) when the window resets for this key

export class RateLimiter {
  private store = new Map<string, { count: number; resetAt: number }>();

  constructor(
    private maxRequests: number,
    private windowMs:    number
  ) {}

  check(key: string): { allowed: boolean; remaining: number; resetAt: number } {
    // TODO
    return { allowed: true, remaining: this.maxRequests, resetAt: Date.now() + this.windowMs };
  }
}

// =============================================================================
// EXERCISE 3 — Input sanitiser
// =============================================================================
// TODO: Implement `sanitiseString(input: string): string`
//       - Trim whitespace
//       - Remove null bytes (\0)
//       - Collapse multiple spaces into one
//       - Return the result

export function sanitiseString(input: string): string {
  // TODO
  return input;
}

// =============================================================================
// EXERCISE 4 — Security header checker
// =============================================================================
// TODO: Define `SecurityHeader` interface: { name: string; value: string }
// TODO: Define `REQUIRED_SECURITY_HEADERS` as an array of SecurityHeader names
//       that every response must include:
//       "X-Content-Type-Options", "X-Frame-Options", "Strict-Transport-Security"
//
// TODO: Implement `checkSecurityHeaders(headers: Record<string, string>): string[]`
//       Returns an array of missing header names from REQUIRED_SECURITY_HEADERS

export const REQUIRED_SECURITY_HEADERS: string[] = [
  // TODO
];

export function checkSecurityHeaders(headers: Record<string, string>): string[] {
  // TODO
  return [];
}

// =============================================================================
// EXERCISE 5 — Mass assignment protection
// =============================================================================
// TODO: Implement `pickAllowed<T extends object>(body: Record<string, unknown>, allowedKeys: (keyof T)[]): Partial<T>`
//       Returns a new object containing ONLY the keys from allowedKeys that exist in body
//       Ignores all other keys silently

export function pickAllowed<T extends object>(
  body:        Record<string, unknown>,
  allowedKeys: (keyof T)[]
): Partial<T> {
  // TODO
  return {};
}

// =============================================================================
// EXERCISE 6 — Password strength checker
// =============================================================================
// TODO: Define `PasswordStrength` union: "weak" | "fair" | "strong" | "very_strong"
// TODO: Implement `checkPasswordStrength(password: string): PasswordStrength`
//       Score points:
//       +1 length >= 8
//       +1 length >= 12
//       +1 contains uppercase
//       +1 contains lowercase
//       +1 contains number
//       +1 contains special char (!@#$%^&*()_+-=[])
//       0–1 pts = "weak", 2–3 = "fair", 4–5 = "strong", 6 = "very_strong"

export type PasswordStrength = never; // replace

export function checkPasswordStrength(password: string): PasswordStrength {
  // TODO
  return "weak";
}

// =============================================================================
// VERIFICATION
// =============================================================================

function verify(): void {
  // Exercise 1 — CORS
  const origins = new Set(["https://app.example.com", "https://admin.example.com"]);
  console.assert(isCorsAllowed("https://app.example.com",   origins, false) === true,  "Ex1: allowed origin");
  console.assert(isCorsAllowed("https://evil.com",          origins, false) === false, "Ex1: blocked origin");
  console.assert(isCorsAllowed(undefined,                   origins, true)  === true,  "Ex1: undefined origin allowed");

  // Exercise 2 — rate limiter
  const limiter = new RateLimiter(3, 60000);
  const r1 = limiter.check("user:1");
  console.assert(r1.allowed === true,   "Ex2: first request allowed");
  console.assert(r1.remaining === 2,    "Ex2: 2 remaining after 1st");

  limiter.check("user:1");
  limiter.check("user:1");
  const r4 = limiter.check("user:1");
  console.assert(r4.allowed === false,  "Ex2: 4th request blocked");
  console.assert(r4.remaining === 0,    "Ex2: 0 remaining");

  // Different keys are independent
  const r_other = limiter.check("user:2");
  console.assert(r_other.allowed === true, "Ex2: different key starts fresh");

  // Exercise 3 — sanitise
  console.assert(sanitiseString("  hello  ")         === "hello",       "Ex3: trim");
  console.assert(sanitiseString("hello\0world")      === "helloworld",  "Ex3: null byte removed");
  console.assert(sanitiseString("hello   world")     === "hello world", "Ex3: collapse spaces");

  // Exercise 4 — security headers
  const goodHeaders = {
    "X-Content-Type-Options":     "nosniff",
    "X-Frame-Options":            "DENY",
    "Strict-Transport-Security":  "max-age=31536000",
  };
  console.assert(checkSecurityHeaders(goodHeaders).length === 0, "Ex4: all headers present");

  const missingHeaders = { "X-Content-Type-Options": "nosniff" };
  const missing = checkSecurityHeaders(missingHeaders);
  console.assert(missing.length > 0,                               "Ex4: missing headers reported");
  console.assert(missing.includes("Strict-Transport-Security"),    "Ex4: HSTS should be missing");

  // Exercise 5 — mass assignment
  interface User { name: string; email: string; role: string }
  const body   = { name: "Alice", email: "a@b.com", role: "owner", evil: "injection" };
  const picked = pickAllowed<User>(body, ["name", "email"]);
  console.assert(picked.name  === "Alice",     "Ex5: name should be picked");
  console.assert(picked.email === "a@b.com",   "Ex5: email should be picked");
  console.assert(!("role"  in picked),         "Ex5: role should be excluded");
  console.assert(!("evil"  in picked),         "Ex5: evil should be excluded");

  // Exercise 6 — password strength
  console.assert(checkPasswordStrength("abc")             === "weak",       "Ex6: short → weak");
  console.assert(checkPasswordStrength("password1")       === "fair",       "Ex6: common → fair");
  console.assert(checkPasswordStrength("Password1!")      === "strong",     "Ex6: mixed → strong");
  console.assert(checkPasswordStrength("P@ssword123!xyz") === "very_strong","Ex6: very strong");

  console.log("Chapter 14 verification complete ✓");
}

verify();
