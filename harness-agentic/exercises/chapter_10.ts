/**
 * Chapter 10 — Error Handling & Retries
 *
 * Run: tsx exercises/chapter_10.ts
 */

import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import "dotenv/config";

const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY!,
});
const FAST = "anthropic/claude-3-haiku";

// =============================================================================
// EXERCISE 1 — isTransientError classifier
// =============================================================================
//
// TODO: Implement `isTransientError(error)` that returns true for:
//   - Any error with "rate limit" or "429" in the message
//   - Any error with "timeout" or "ETIMEDOUT" in the message
//   - Any error with "503" or "502" in the message
//   - Any error with "network" in the message
// Returns false for: 401, 403, 400, non-Error values

function isTransientError(error: unknown): boolean {
  // TODO
  return false;
}

// =============================================================================
// EXERCISE 2 — Retry with exponential backoff + jitter
// =============================================================================
//
// TODO: Implement `withRetry<T>(fn, options)`:
//   - options: { maxAttempts?: number (default 3), baseDelayMs?: number (default 500),
//               maxDelayMs?: number (default 10_000), retryOn?: (err) => boolean }
//   - On failure: if retryOn(err) is true AND not the last attempt, wait and retry
//   - Delay: min(baseDelayMs * 2^(attempt-1) + random jitter, maxDelayMs)
//   - Jitter: random number between 0 and 30% of the exponential delay
//   - On last attempt or non-retryable error: throw

interface RetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?:  number;
  retryOn?:     (error: unknown) => boolean;
}

async function withRetry<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<T> {
  // TODO
  return fn(); // placeholder — replace with retry logic
}

// =============================================================================
// EXERCISE 3 — Result pattern
// =============================================================================
//
// TODO: Define `AgentError` as a discriminated union with these variants:
//   - { kind: "rate_limit";     retryAfterMs: number }
//   - { kind: "model_error";    message: string }
//   - { kind: "max_iterations"; iterations: number }
//   - { kind: "budget_exceeded"; spentUSD: number }
//   - { kind: "tool_failure";   toolName: string; message: string }
//   - { kind: "unknown";        raw: unknown }
//
// TODO: Define `Result<T, E = AgentError>` as a discriminated union:
//   - { ok: true;  value: T }
//   - { ok: false; error: E }
//
// TODO: Implement `classifyError(err)` returning an AgentError
//
// TODO: Implement `runAgentSafe(prompt)` that calls generateText, wraps in Result,
//       classifies errors, and never throws.

type AgentError = never; // TODO — replace with discriminated union

type Result<T, E = AgentError> = never; // TODO — replace with discriminated union

function classifyError(err: unknown): AgentError {
  // TODO
  return { kind: "unknown", raw: err } as AgentError;
}

async function runAgentSafe(prompt: string): Promise<Result<string>> {
  // TODO
  return { ok: false, error: classifyError("not implemented") } as Result<string>;
}

// =============================================================================
// EXERCISE 4 — Circuit breaker
// =============================================================================
//
// TODO: Implement the `CircuitBreaker` class with:
//   - constructor(failureThreshold: number = 3, cooldownMs: number = 5_000)
//   - call<T>(fn: () => Promise<T>): Promise<T>
//     • If circuit is "open" and cooldown hasn't passed: throw "Circuit open"
//     • If circuit is "open" and cooldown has passed: set to "half-open" and try
//     • On success in "half-open": reset to "closed", reset failure count
//     • On failure: increment count; if count >= threshold, open circuit
//   - get isOpen(): boolean
//   - get state(): "closed" | "open" | "half-open"

class CircuitBreaker {
  // TODO
  get isOpen(): boolean { return false; }
  get state(): "closed" | "open" | "half-open" { return "closed"; }
  async call<T>(fn: () => Promise<T>): Promise<T> { return fn(); }
}

// =============================================================================
// EXERCISE 5 — Safe user-facing error message
// =============================================================================
//
// TODO: Implement `toUserMessage(error: AgentError)` that returns a friendly,
//       non-technical string appropriate for showing to a customer.
//       Rules:
//       - Never mention internal system details
//       - Never suggest the customer is at fault
//       - Include an actionable next step for each error kind
//       - rate_limit: suggest waiting and retrying
//       - tool_failure: suggest contacting support
//       - all others: generic helpful message

function toUserMessage(error: AgentError): string {
  // TODO
  return "Something went wrong. Please try again.";
}

// =============================================================================
// MAIN
// =============================================================================

async function main(): Promise<void> {
  // Exercise 1 — classifier
  console.assert( isTransientError(new Error("Rate limit exceeded (429)")), "Ex1: rate limit");
  console.assert( isTransientError(new Error("Request timeout")),           "Ex1: timeout");
  console.assert( isTransientError(new Error("503 Service Unavailable")),   "Ex1: 503");
  console.assert(!isTransientError(new Error("401 Unauthorized")),          "Ex1: not 401");
  console.assert(!isTransientError(new Error("400 Bad Request")),           "Ex1: not 400");
  console.assert(!isTransientError("string error"),                         "Ex1: not string");
  console.log("Exercise 1 ✓ — isTransientError correct");

  // Exercise 2 — retry (test with a function that fails twice then succeeds)
  let callCount = 0;
  const flaky = async () => {
    callCount++;
    if (callCount < 3) throw new Error("503 Service Unavailable");
    return "success";
  };
  const retryResult = await withRetry(flaky, { maxAttempts: 3, baseDelayMs: 10, retryOn: isTransientError });
  console.assert(retryResult === "success", "Exercise 2: should succeed after retries");
  console.assert(callCount === 3,           "Exercise 2: should have called fn 3 times");
  console.log("Exercise 2 ✓ — retry logic correct");

  // Exercise 2 — should not retry non-transient errors
  let errCount = 0;
  try {
    await withRetry(() => {
      errCount++;
      throw new Error("401 Unauthorized");
    }, { maxAttempts: 3, baseDelayMs: 10, retryOn: isTransientError });
  } catch { /* expected */ }
  console.assert(errCount === 1, "Exercise 2: should not retry non-transient errors");
  console.log("Exercise 2 ✓ — no retry on permanent error");

  // Exercise 3 — Result pattern (live call)
  console.log("\n=== Exercise 3: Result pattern ===");
  const good = await runAgentSafe("Say 'hello' and nothing else.");
  console.assert(good.ok === true, "Exercise 3: successful call should return ok: true");
  if (good.ok) console.log("Good result:", good.value.trim());

  // Exercise 4 — Circuit breaker
  const cb = new CircuitBreaker(2, 100);
  console.assert(cb.state === "closed", "Exercise 4: initial state is closed");
  // Trip the circuit
  try { await cb.call(() => { throw new Error("service down"); }); } catch {}
  try { await cb.call(() => { throw new Error("service down"); }); } catch {}
  console.assert(cb.isOpen, "Exercise 4: circuit should be open after threshold failures");
  console.log("Exercise 4 ✓ — circuit breaker trips correctly");

  // Exercise 5 — user messages
  const msg1 = toUserMessage({ kind: "rate_limit", retryAfterMs: 5000 } as AgentError);
  const msg2 = toUserMessage({ kind: "tool_failure", toolName: "lookupOrder", message: "DB error" } as AgentError);
  console.assert(msg1.length > 10, "Exercise 5: rate_limit message must be non-trivial");
  console.assert(msg2.length > 10, "Exercise 5: tool_failure message must be non-trivial");
  console.assert(!msg1.toLowerCase().includes("rate limit"),  "Exercise 5: should not expose technical term");
  console.assert(!msg2.toLowerCase().includes("db error"),    "Exercise 5: should not expose internal error");
  console.log("Exercise 5 ✓ — user messages are clean");
  console.log("  Rate limit msg:", msg1);
  console.log("  Tool failure msg:", msg2);
}

main().catch(console.error);
