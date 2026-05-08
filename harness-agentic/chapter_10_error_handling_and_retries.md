# Chapter 10 — Error Handling & Retries

## Learning Objectives

By the end of this chapter you will be able to:
- Identify and handle the three categories of agent errors
- Implement exponential backoff with jitter for API retries
- Build a circuit breaker to prevent cascading failures
- Return `Result<T, E>` from agent functions instead of throwing
- Avoid leaking error details to users

---

## 10.1 Three Categories of Agent Errors

| Category | Examples | Strategy |
|----------|---------|----------|
| **Transient** | Rate limit (429), network timeout, temporary API outage | Retry with backoff |
| **Permanent** | Invalid API key (401), bad request (400), model not found | Fail immediately, surface to operator |
| **Agent logic** | Max iterations exceeded, tool returns unexpected data, context window overflow | Graceful degradation, fallback response |

Treating all errors the same (retry everything) or (fail immediately) is wrong. The strategy depends on the category.

---

## 10.2 Retry with Exponential Backoff and Jitter

```typescript
interface RetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  retryOn?: (error: unknown) => boolean;
}

async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelayMs = 500,
    maxDelayMs  = 10_000,
    retryOn     = isTransientError,
  } = options;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      if (!retryOn(err) || attempt === maxAttempts) throw err;

      const exponential = baseDelayMs * Math.pow(2, attempt - 1);
      const jitter      = Math.random() * exponential * 0.3;
      const delay       = Math.min(exponential + jitter, maxDelayMs);

      console.warn(`Attempt ${attempt} failed. Retrying in ${Math.round(delay)}ms...`);
      await new Promise(r => setTimeout(r, delay));
    }
  }

  throw lastError;
}

function isTransientError(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("rate limit") || msg.includes("429")) return true;
    if (msg.includes("timeout") || msg.includes("network"))  return true;
    if (msg.includes("503") || msg.includes("502"))          return true;
    if (msg.includes("500") && msg.includes("openrouter"))   return true;
  }
  return false;
}
```

**Jitter** is important: without it, multiple agents retrying simultaneously (thundering herd) all hit the API again at the same time, compounding the overload.

---

## 10.3 Wrapping generateText with Retry

```typescript
async function generateTextWithRetry(
  params: Parameters<typeof generateText>[0]
): Promise<Awaited<ReturnType<typeof generateText>>> {
  return withRetry(() => generateText(params), {
    maxAttempts: 3,
    baseDelayMs: 1000,
  });
}
```

---

## 10.4 The Result Pattern

Agents that throw errors are hard to compose. Use the `Result<T, E>` pattern instead:

```typescript
type AgentError =
  | { kind: "rate_limit";   retryAfterMs: number }
  | { kind: "model_error";  message: string }
  | { kind: "max_iterations"; iterations: number }
  | { kind: "budget_exceeded"; spentUSD: number }
  | { kind: "tool_failure"; toolName: string; message: string }
  | { kind: "unknown"; raw: unknown };

type Result<T, E = AgentError> =
  | { ok: true;  value: T }
  | { ok: false; error: E };

async function runAgent(
  userMessage: string
): Promise<Result<string, AgentError>> {
  try {
    const { text } = await generateTextWithRetry({
      model: openrouter(MODELS.balanced),
      system: SYSTEM_PROMPT,
      prompt: userMessage,
      tools,
      maxSteps: 10,
    });
    return { ok: true, value: text };
  } catch (err) {
    return { ok: false, error: classifyError(err) };
  }
}

function classifyError(err: unknown): AgentError {
  if (!(err instanceof Error)) return { kind: "unknown", raw: err };

  const msg = err.message.toLowerCase();
  if (msg.includes("rate limit"))     return { kind: "rate_limit", retryAfterMs: 5000 };
  if (msg.includes("max iterations")) return { kind: "max_iterations", iterations: 10 };
  return { kind: "model_error", message: err.message };
}
```

Usage:
```typescript
const result = await runAgent("Where is order A8812?");
if (!result.ok) {
  if (result.error.kind === "rate_limit") {
    await delay(result.error.retryAfterMs);
    // retry...
  } else {
    return errorResponse("Unable to process your request. Please try again.");
  }
}
const reply = result.value;
```

---

## 10.5 Circuit Breaker

When a downstream service (e.g. the order API) is consistently failing, a circuit breaker prevents the agent from hammering it:

```typescript
type CircuitState = "closed" | "open" | "half-open";

class CircuitBreaker {
  private state: CircuitState = "closed";
  private failureCount  = 0;
  private lastFailureAt = 0;

  constructor(
    private readonly failureThreshold: number = 3,
    private readonly cooldownMs:       number = 30_000
  ) {}

  async call<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === "open") {
      const sinceFailure = Date.now() - this.lastFailureAt;
      if (sinceFailure < this.cooldownMs) {
        throw new Error("Circuit open — service unavailable");
      }
      this.state = "half-open";
    }

    try {
      const result = await fn();
      if (this.state === "half-open") {
        this.state = "closed";
        this.failureCount = 0;
      }
      return result;
    } catch (err) {
      this.failureCount++;
      this.lastFailureAt = Date.now();
      if (this.failureCount >= this.failureThreshold) {
        this.state = "open";
        console.error(`Circuit opened after ${this.failureCount} failures`);
      }
      throw err;
    }
  }

  get isOpen() { return this.state === "open"; }
}
```

---

## 10.6 Error Leakage — What Not to Return to Users

**Never return raw errors to users.** They may contain:
- Internal system paths
- Database schema details
- API keys or credentials in error messages
- Stack traces with code structure

```typescript
// Bad — leaks internal details
catch (err) {
  return `Error: ${err.message}`;
  // "Error: ECONNREFUSED 127.0.0.1:5432 - connection to PostgreSQL failed"
}

// Good — generic user-facing message
catch (err) {
  logError(err);         // log full details internally
  return "I'm having trouble accessing your order details right now. Please try again in a moment, or contact support.";
}
```

---

## 10.7 Tool Error Handling — Recap

From Chapter 4: tool `execute` functions should never throw. Return error strings instead:

```typescript
execute: async ({ orderId }) => {
  try {
    const order = await db.getOrder(orderId);
    return JSON.stringify({ found: true, ...order });
  } catch (err) {
    logError("lookupOrder failed", err);
    return JSON.stringify({
      found:   false,
      error:   "ORDER_LOOKUP_FAILED",
      message: "Unable to retrieve order details. The order system may be temporarily unavailable.",
    });
  }
}
```

The model reads the error JSON and tells the user something appropriate. It never sees the raw exception.

---

## 10.8 Context Window Overflow

When conversation history exceeds the model's context window, the API returns an error. Detect and handle it:

```typescript
function isContextWindowError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  return msg.includes("context window") || msg.includes("context length") || msg.includes("too many tokens");
}

async function generateWithContextGuard(
  params: Parameters<typeof generateText>[0]
): Promise<Awaited<ReturnType<typeof generateText>>> {
  try {
    return await generateText(params);
  } catch (err) {
    if (isContextWindowError(err) && Array.isArray(params.messages)) {
      console.warn("Context window exceeded — trimming history and retrying");
      const trimmed = trimHistory(params.messages, 10);
      return generateText({ ...params, messages: trimmed });
    }
    throw err;
  }
}
```

---

## Chapter Summary

| Concept | Key point |
|---------|-----------|
| Error categories | Transient (retry), permanent (fail fast), logic (degrade gracefully) |
| Exponential backoff | Delay doubles each attempt; add jitter to prevent thundering herd |
| Result pattern | `{ ok: true, value }` or `{ ok: false, error }` — compose without throws |
| Circuit breaker | Stop hammering a failing service; open/half-open/closed states |
| Error leakage | Never expose raw errors to users — log internally, return generic message |
| Tool errors | Return error JSON strings, never throw from execute |
| Context overflow | Detect and trim history before retrying |

---

*Next: Chapter 11 — Intent Detection & Conversation Routing*
