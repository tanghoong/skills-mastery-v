# Chapter 21 — Performance Optimisation

## Learning Objectives

By the end of this chapter you will be able to:
- Set and measure latency budgets for each pipeline stage
- Apply parallel tool execution and parallel sub-agent dispatch to cut wall-clock time
- Use prompt caching to reduce time-to-first-token on repeated calls
- Implement result caching for frequent identical queries
- Profile a slow agent pipeline and identify the bottlenecks to fix first

---

## 21.1 Why Performance Matters

Agents are inherently slower than single API calls. Each LLM call adds 0.5–3 seconds. An unchecked pipeline can hit 10–15 seconds — unacceptable for real-time customer service.

**Performance SLAs for the portfolio project:**

| Stage | p95 latency target |
|-------|--------------------|
| Intent classification | < 500 ms |
| Single-agent (with 1-2 tools) | < 3,000 ms |
| Multi-agent parallel | < 6,000 ms |
| Time to first streaming token | < 800 ms |

---

## 21.2 Parallel Tool Execution

The single biggest performance win for most agents. Instead of sequential tool calls:

```
Sequential (3 tools):    A → B → C           = 1.5s + 1.5s + 1.5s = 4.5s
Parallel (3 tools):      A + B + C in parallel = max(1.5s, 1.2s, 1.8s) = 1.8s
```

The Vercel AI SDK executes parallel tool calls automatically when the model requests multiple tools in one step. Ensure your tools are side-effect independent so they can safely run concurrently.

```typescript
// The SDK handles this automatically with maxSteps > 1
const { text } = await generateText({
  model: openrouter(MODELS.balanced),
  messages,
  tools: { lookupOrder, checkDelivery, searchProducts },
  maxSteps: 5,
  // When the model calls lookupOrder AND checkDelivery in the same step,
  // both execute() functions run via Promise.all internally
});
```

For a custom loop, execute all tool calls in a step in parallel explicitly:

```typescript
const results = await Promise.all(
  step.toolCalls.map(tc =>
    tools[tc.toolName].execute(tc.args).catch(err => ({
      error: (err as Error).message,
    }))
  )
);
```

---

## 21.3 Parallel Sub-Agent Dispatch

From Chapter 12: fan-out to sub-agents via `Promise.all`. Reiterated here as a performance pattern:

```typescript
const [orderResult, catalogueResult] = await Promise.all([
  orderStatusSubAgent(orderTask),
  catalogueSubAgent(catalogueTask),
]);
// Total time ≈ max(orderTime, catalogueTime) — not orderTime + catalogueTime
```

**Rule:** Any two tasks that do not depend on each other's output should be executed in parallel.

---

## 21.4 Prompt Caching — Latency Benefits

Prompt caching (covered for cost in Ch. 18) also improves latency. Cached tokens are processed faster by the API:

| Token type | Typical processing time |
|-----------|------------------------|
| Normal input | ~1 ms / 1000 tokens |
| Cached input | ~0.3 ms / 1000 tokens |

For a 1,000-token system prompt: 0.7 ms saved per call. Marginal on its own, but compounds across many calls and becomes significant at scale.

**To cache aggressively:**
- Put the system prompt at the start of messages (the most stable part)
- Mark it with `cacheControl: { type: "ephemeral" }` (lasts 5 minutes)
- Use the same exact text — even a single character change invalidates the cache

---

## 21.5 Result Caching

Some queries are asked repeatedly with identical inputs. Cache their results:

```typescript
class ResultCache<T> {
  private cache = new Map<string, { value: T; expiresAt: number }>();

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry || entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: T, ttlMs: number = 60_000): void {
    this.cache.set(key, { value, expiresAt: Date.now() + ttlMs });
  }
}

const intentCache = new ResultCache<IntentClassification>();

async function classifyWithCache(message: string): Promise<IntentClassification> {
  const key    = message.trim().toLowerCase();
  const cached = intentCache.get(key);
  if (cached) return cached;

  const result = await classifyIntents(message);
  intentCache.set(key, result, 30_000);  // cache for 30 seconds
  return result;
}
```

Good candidates for caching:
- Intent classification (common questions have common intents)
- Product catalogue lookups (catalogue changes infrequently)
- RAG results for common queries
- Model responses to frequently asked identical questions

---

## 21.6 Streaming for Perceived Latency

Even if total processing time is 4 seconds, the user sees the first token in < 1 second with streaming. Perceived latency is dramatically lower.

The key: start streaming the synthesis response as soon as the first tool result arrives, without waiting for all parallel tools to complete.

```typescript
// Advanced: stream partial synthesis while remaining tools execute
const result = streamText({
  model: openrouter(MODELS.balanced),
  messages: [...history, toolResultsMessage],
  // The model streams tokens as it synthesises, even if some tools are still running
  // (ensure tool results are all available before synthesis — or use a two-phase approach)
});
```

---

## 21.7 Latency Budget Distribution

For a 6-second total budget for a multi-agent call:

```
Total budget: 6,000 ms
├── Intent classification: 500 ms     (10% of budget)
├── Parallel agents: 3,500 ms         (58%)
│   ├── Order agent: 1,500 ms
│   ├── Catalogue agent: 3,500 ms    (slowest; dominates)
│   └── Delivery agent: 1,200 ms
├── Response merge: 1,000 ms          (17%)
└── Network overhead: 500 ms         (8%)
                                      ─────
Total (parallel agents dominate):    6,000 ms ✓
```

The slowest sub-agent (catalogue/RAG) sets the floor. Optimise it first:
- Pre-warm the vector index for common product queries
- Cache top-K retrieved chunks for the most common searches
- Use the fast model for RAG synthesis where accuracy allows

---

## 21.8 Profiling Your Pipeline

Instrument with the tracer from Ch. 20, then find the bottleneck:

```typescript
async function profilePipeline(testMessages: string[]): Promise<void> {
  const tracer = new Tracer();

  for (const message of testMessages) {
    await tracedPipeline(tracer, message, `profile-${Date.now()}`);
  }

  const report = buildLatencyReport(tracer.allSpans());

  const sorted = Object.entries(report).sort((a, b) => b[1].p95 - a[1].p95);
  console.log("\n=== Latency Bottlenecks (p95, slowest first) ===");
  sorted.forEach(([name, stats]) => {
    const bar = "█".repeat(Math.ceil(stats.p95 / 200));
    console.log(`  ${name.padEnd(30)} ${stats.p95}ms ${bar}`);
  });

  // Flag SLA breaches
  const slaMap: Record<string, number> = {
    intent_classification: 500,
    parallel_routing:      3500,
    response_merge:        1000,
  };
  for (const [stage, threshold] of Object.entries(slaMap)) {
    const stats = report[stage];
    if (stats && stats.p95 > threshold) {
      console.warn(`⚠ SLA BREACH: ${stage} p95=${stats.p95}ms > ${threshold}ms target`);
    }
  }
}
```

---

## 21.9 Connection Pooling and Keep-Alive

HTTP connection overhead is a hidden latency source. The `fetch` API in Node 18+ reuses connections by default when hitting the same host (OpenRouter). Ensure you're not creating a new HTTP agent per request:

```typescript
// Good — single shared client, reuses connections
const openrouter = createOpenAI({ baseURL: "...", apiKey: "..." });
// openrouter is created once and used for all calls

// Bad — creates new HTTP connections on every call (do not do this)
for (const msg of messages) {
  const client = createOpenAI({ ... });  // don't create per-call
  await generateText({ model: client("..."), ... });
}
```

---

## 21.10 Summary: Performance Checklist

Before deploying to production, check each item:

- [ ] All independent tool calls execute in parallel (not sequential)
- [ ] All independent sub-agents dispatch in parallel (`Promise.all`)
- [ ] System prompts > 1,024 tokens use prompt caching
- [ ] Result caching for frequent identical queries
- [ ] All customer-facing responses use `streamText` (not `generateText`)
- [ ] AbortSignal.timeout() set on all HTTP tool calls
- [ ] `maxSteps` set to minimum needed (don't over-allow iterations)
- [ ] `maxTokens` set on all calls (don't let the model generate unbounded output)
- [ ] Classification uses the fast model (haiku), not balanced
- [ ] RAG retrieval uses top-K ≤ 5 (not 10+)
- [ ] Traced latency shows no stage exceeding its SLA

---

## Chapter Summary

| Technique | Latency reduction | Effort |
|-----------|------------------|--------|
| Parallel tools | 2–5× for multi-tool calls | Low (SDK default) |
| Parallel sub-agents | 2–3× for multi-intent | Low (`Promise.all`) |
| Streaming | TTFT from 3s to <1s | Low (swap `streamText`) |
| Result caching | 100% for cache hits | Medium |
| Prompt caching | 10–15% TTFT reduction | Low (add cache control) |
| Model tiering (haiku) | 2–3× per step | Low |
| maxTokens cap | 20–30% for wordy models | Low |
| RAG top-K reduction | 10–20% retrieval time | Low |

---

*Next: Chapter 22 — Security, Safety & Guardrails*
