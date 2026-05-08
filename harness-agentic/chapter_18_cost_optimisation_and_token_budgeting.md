# Chapter 18 — Cost Optimisation & Token Budgeting

## Learning Objectives

By the end of this chapter you will be able to:
- Instrument every LLM call with cost tracking tagged by agent and use case
- Implement per-session and per-day token budgets with hard stops
- Enable Anthropic prompt caching to reduce repetitive token costs by up to 90%
- Apply model tiering strategically to cut costs without losing quality
- Build a cost dashboard that shows spend by agent, model, and use case

---

## 18.1 Why Cost is a First-Class Concern

Unlike a traditional software API (fixed cost per request), LLM costs scale with:
- Number of tokens in the input (including conversation history)
- Number of tokens in the output
- Which model you chose
- How many agent loop iterations ran

Unchecked, a 10-agent parallel pipeline with a 5-turn history can cost 50× a single stateless call. At 10,000 daily customer sessions, a 5× cost reduction through optimisation saves tens of thousands of dollars per month.

---

## 18.2 Cost Instrumentation

Tag every LLM call with enough metadata to attribute costs:

```typescript
interface LLMCallMetrics {
  callId:       string;
  timestamp:    Date;
  agentName:    string;       // "order_status_agent", "catalogue_agent"
  useCase:      string;       // "order_status", "product_search", "classification"
  sessionId:    string;
  model:        string;
  inputTokens:  number;
  outputTokens: number;
  cachedTokens: number;       // tokens served from cache (cost ~10% of normal)
  durationMs:   number;
  costUSD:      number;
}

class CostTracker {
  private calls: LLMCallMetrics[] = [];

  record(metrics: LLMCallMetrics): void {
    this.calls.push(metrics);
  }

  sessionCost(sessionId: string): number {
    return this.calls
      .filter(c => c.sessionId === sessionId)
      .reduce((sum, c) => sum + c.costUSD, 0);
  }

  agentCost(agentName: string, since: Date): number {
    return this.calls
      .filter(c => c.agentName === agentName && c.timestamp >= since)
      .reduce((sum, c) => sum + c.costUSD, 0);
  }

  summary(): Record<string, number> {
    const byAgent: Record<string, number> = {};
    for (const c of this.calls) {
      byAgent[c.agentName] = (byAgent[c.agentName] ?? 0) + c.costUSD;
    }
    return byAgent;
  }
}
```

---

## 18.3 OpenRouter Pricing Table (2025)

```typescript
const PRICING: Record<string, { inputPerMillion: number; outputPerMillion: number; cachedInputPerMillion: number }> = {
  "anthropic/claude-3-haiku":    { inputPerMillion: 0.25,  outputPerMillion: 1.25,  cachedInputPerMillion: 0.03  },
  "anthropic/claude-3-5-sonnet": { inputPerMillion: 3.00,  outputPerMillion: 15.00, cachedInputPerMillion: 0.30  },
  "anthropic/claude-opus-4":     { inputPerMillion: 15.00, outputPerMillion: 75.00, cachedInputPerMillion: 1.50  },
  "openai/gpt-4o-mini":          { inputPerMillion: 0.15,  outputPerMillion: 0.60,  cachedInputPerMillion: 0.075 },
  "openai/gpt-4o":               { inputPerMillion: 2.50,  outputPerMillion: 10.00, cachedInputPerMillion: 1.25  },
};

function calculateCost(
  modelId:      string,
  inputTokens:  number,
  outputTokens: number,
  cachedTokens: number = 0
): number {
  const pricing = PRICING[modelId];
  if (!pricing) return 0;

  const normalInputTokens = inputTokens - cachedTokens;
  return (
    (normalInputTokens * pricing.inputPerMillion +
     cachedTokens      * pricing.cachedInputPerMillion +
     outputTokens      * pricing.outputPerMillion) / 1_000_000
  );
}
```

---

## 18.4 Prompt Caching

Anthropic's prompt caching stores the system prompt server-side after the first call. Subsequent calls with the same system prompt pay ~10% of the normal input token price.

For a 500-token system prompt called 1,000 times per day:
- Without caching: 500 × 1,000 × $3/1M = **$1.50/day**
- With caching:    ~10% × $1.50/day  = **$0.15/day** (after first call per 5 minutes)

To enable caching with the Vercel AI SDK on Anthropic models:

```typescript
import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";

// Use the Anthropic provider directly (not via OpenRouter) for cache control
const { text, usage } = await generateText({
  model: anthropic("claude-3-haiku-20240307"),
  messages: [
    {
      role:    "system",
      content: [
        {
          type:        "text",
          text:        CUSTOMER_SERVICE_SYSTEM_PROMPT,  // 500 tokens
          experimental_providerMetadata: {
            anthropic: { cacheControl: { type: "ephemeral" } },
          },
        },
      ],
    },
    { role: "user", content: userMessage },
  ],
});

// usage.experimental_providerMetadata?.anthropic?.cacheCreationInputTokens
// usage.experimental_providerMetadata?.anthropic?.cacheReadInputTokens
```

**When to cache:**
- System prompts > 1,024 tokens (minimum for Anthropic caching)
- Prompt templates used for more than ~20 calls per hour
- RAG context injected into every call for the same query

---

## 18.5 Token Budget Guards

Prevent runaway costs with per-session and per-call limits:

```typescript
interface TokenBudget {
  sessionMaxTokens: number;   // max tokens for a single conversation
  callMaxTokens:    number;   // max output tokens per LLM call
  dailyMaxUSD:      number;   // hard stop for daily spend
}

const DEFAULT_BUDGET: TokenBudget = {
  sessionMaxTokens: 50_000,
  callMaxTokens:    500,
  dailyMaxUSD:      100,
};

class BudgetedAgent {
  private sessionTokens = 0;

  constructor(
    private readonly tracker: CostTracker,
    private readonly budget: TokenBudget = DEFAULT_BUDGET
  ) {}

  async call(params: Parameters<typeof generateText>[0]): Promise<Awaited<ReturnType<typeof generateText>>> {
    // Daily spend guard
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todaySpend = this.tracker.agentCost("all", todayStart);
    if (todaySpend > this.budget.dailyMaxUSD) {
      throw new Error(`DAILY_BUDGET_EXCEEDED: spent $${todaySpend.toFixed(2)}`);
    }

    // Session token guard
    if (this.sessionTokens > this.budget.sessionMaxTokens) {
      throw new Error(`SESSION_TOKEN_BUDGET_EXCEEDED: ${this.sessionTokens} tokens`);
    }

    const result = await generateText({
      ...params,
      maxTokens: Math.min(params.maxTokens ?? this.budget.callMaxTokens, this.budget.callMaxTokens),
    });

    this.sessionTokens += result.usage.totalTokens;
    return result;
  }
}
```

---

## 18.6 Model Tiering — The Right Model for Each Task

The single most impactful cost lever. Decision guide:

| Task | Ideal model | Why |
|------|------------|-----|
| Intent classification | claude-3-haiku | Short, structured; haiku accuracy 85-90% |
| Slot extraction | claude-3-haiku | Simple pattern; fast and cheap |
| Simple order lookup | claude-3-haiku | 1-2 tool calls max |
| RAG synthesis | claude-3-5-sonnet | Complex reasoning over retrieved context |
| Multi-intent routing | claude-3-5-sonnet | Needs full context awareness |
| Escalation assessment | claude-3-haiku | Schema-constrained; haiku is accurate |
| Response merging | claude-3-5-sonnet | Quality matters for final user-facing reply |
| Human handoff message | claude-3-haiku | Short, templated; haiku handles well |

**Validation approach:** Run 100 representative test cases through both models. If haiku accuracy > 90%, use haiku. Upgrade to sonnet only where haiku fails.

---

## 18.7 Context Window Cost Optimisation

Every token in the input costs money. Reduce input tokens:

```typescript
// 1. Trim history aggressively
const trimmedHistory = trimHistory(session.history, 6);  // keep last 6 turns

// 2. Summarise old turns (Ch. 8)
const compressedSession = await compressSession(store, sessionId, 4);

// 3. Use filtered retrieval for RAG — don't dump the whole catalogue
const relevantChunks = await retrieve(question, 3);  // top-3 not top-10

// 4. Strip whitespace and redundant formatting from system prompts
const compactPrompt = systemPrompt.replace(/\s+/g, " ").trim();

// 5. Use structured output (generateObject) — models return tighter JSON than prose
const { object } = await generateObject({ schema, prompt });  // vs. generateText + manual parsing
```

---

## 18.8 Cost Dashboard — Reporting

A simple in-memory cost report:

```typescript
function printCostReport(tracker: CostTracker): void {
  const summary = tracker.summary();
  const total   = Object.values(summary).reduce((a, b) => a + b, 0);

  console.log("\n╔═══════════════════════════════╗");
  console.log("║      Cost Report               ║");
  console.log("╠═══════════════════════════════╣");
  for (const [agent, cost] of Object.entries(summary).sort((a, b) => b[1] - a[1])) {
    const pct = ((cost / total) * 100).toFixed(1);
    console.log(`║ ${agent.padEnd(20)} $${cost.toFixed(5)} (${pct}%) ║`);
  }
  console.log("╠═══════════════════════════════╣");
  console.log(`║ TOTAL                 $${total.toFixed(5)}     ║`);
  console.log("╚═══════════════════════════════╝");
}
```

In production, emit metrics to Prometheus/Datadog and alert when daily spend exceeds threshold.

---

## 18.9 Real-World Cost Targets

For the portfolio project — enterprise customer service at 10,000 sessions/day:

| Component | Target cost/session | Optimisation |
|-----------|--------------------|--------------| 
| Classification | $0.0001 | haiku + caching |
| Order lookup | $0.0003 | haiku, max 2 steps |
| RAG synthesis | $0.002  | sonnet, top-3 chunks, cached context |
| Response merge | $0.001  | sonnet, max 350 tokens |
| **Total** | **~$0.004/session** | |

At 10,000 sessions/day: **~$40/day** or **~$1,200/month**. Without optimisation (all sonnet, no caching, no trimming): ~$200/day.

---

## Chapter Summary

| Concept | Key point |
|---------|-----------|
| Cost instrumentation | Tag every call: agent, use case, session, model, tokens |
| `calculateCost` | Use the pricing table; account for cached tokens |
| Prompt caching | 90% reduction on repeated system prompts > 1024 tokens |
| Token budget guards | Session max, call max, daily max — hard stops |
| Model tiering | haiku for classification/extraction; sonnet for synthesis |
| Context trimming | Aggressive history trimming + summarisation |
| Cost target | ~$0.004/session for the portfolio project |

---

*Next: Chapter 19 — Evaluation & Testing Agents*
