# Chapter 23 — Portfolio Project: Enterprise Customer Service Agent Platform

## Learning Objectives

By the end of this chapter you will have built a production-ready agent platform that:
- Integrates every major pattern from chapters 1–22
- Passes the security baseline checklist (Ch. 22)
- Meets the performance SLA requirements (Ch. 21)
- Stays within a defined cost budget with per-session attribution (Ch. 18)
- Provides complete observability via structured traces (Ch. 20)

---

## 23.1 Project Overview

**Aria** — an enterprise-grade AI customer service agent for Acme Corp.

### Features

| Feature | Chapters applied |
|---------|-----------------|
| Multi-intent classification | 11 |
| Order, catalogue, delivery sub-agents | 12 |
| RAG product knowledge base | 13 |
| Session memory (in-memory + Supabase) | 8 |
| Streaming responses | 9 |
| Human handoff / escalation | 17 |
| Cost tracking + budget guard | 18 |
| Structured traces + Langfuse export | 20 |
| Result cache + parallel sub-agents | 21 |
| Layered security + rate limiting | 22 |
| JWT authentication | 22 |

---

## 23.2 Architecture

```
Client (HTTP POST /api/chat)
    │
    ▼
Express server
├── authenticateJWT           ← Ch. 22
├── chatRateLimiter           ← Ch. 22
│
▼
handleCustomerMessage(message, sessionId)
├── validateInput()           ← Ch. 22
│
├── loadSession()             ← Ch. 8
│
├── classifyIntents()         ← Ch. 11  (cached, FAST model)
│
├── routeToSubAgents()        ← Ch. 12  (parallel dispatch)
│   ├── orderStatusAgent()    ← Ch. 4/5
│   ├── catalogueRagAgent()   ← Ch. 13
│   └── deliveryAgent()       ← Ch. 4/5
│
├── mergeAndRespond()         ← Ch. 11  (BALANCED model)
│
├── shouldEscalate() → HandoffPackage  ← Ch. 17
│
├── validateOutput()          ← Ch. 22
│
├── saveSession()             ← Ch. 8
│
└── finishTrace()             ← Ch. 20
```

---

## 23.3 Core Pipeline Implementation

```typescript
import express from "express";
import { generateText, streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { tool } from "ai";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";
import "dotenv/config";

const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey:  process.env.OPENROUTER_API_KEY!,
});

// Model tiers
const MODELS = {
  fast:     "anthropic/claude-3-haiku",
  balanced: "anthropic/claude-3-5-sonnet",
};

const app = express();
app.use(express.json());

// --- Auth middleware ---
function authenticateJWT(req: express.Request, res: express.Response, next: express.NextFunction) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "No token" });
  try {
    (req as any).auth = jwt.verify(token, process.env.JWT_SECRET!);
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

// --- Rate limiter ---
const limiter = rateLimit({
  windowMs: 60_000, max: 20,
  keyGenerator: (req) => (req as any).auth?.customerId ?? req.ip,
});

// --- Main chat endpoint ---
app.post("/api/chat", authenticateJWT, limiter, async (req, res) => {
  const { message, sessionId } = req.body;
  const { customerId } = (req as any).auth;

  try {
    const response = await handleCustomerMessage(message, sessionId, customerId);
    res.json({ reply: response.reply, traceId: response.traceId });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.listen(3000, () => console.log("Aria running on :3000"));
```

---

## 23.4 Full handleCustomerMessage

```typescript
import { Tracer } from "./tracer";
import { CostTracker } from "./costTracker";
import { SessionStore } from "./sessionStore";
import { validateInput, validateOutput } from "./security";
import { classifyIntents } from "./intents";
import { routeToSubAgents } from "./router";
import { mergeResponses } from "./merger";
import { assessEscalation } from "./escalation";
import { ResultCache } from "./cache";

const tracer       = new Tracer();
const costTracker  = new CostTracker();
const sessionStore = new SessionStore();
const intentCache  = new ResultCache<any>();

async function handleCustomerMessage(
  message:    string,
  sessionId:  string,
  customerId: string
): Promise<{ reply: string; traceId: string }> {
  const traceId  = crypto.randomUUID();
  const pipe     = tracer.startSpan(traceId, "customer_message_pipeline", "pipeline");

  // 1. Security — input validation
  const validation = validateInput(message);
  if (!validation.safe) {
    pipe.finish({ blocked: true, reason: validation.reason });
    return { reply: "I'm sorry, I can't help with that.", traceId };
  }

  // 2. Load session
  const session  = sessionStore.getOrCreate(sessionId, customerId);
  const history  = session.history;

  // 3. Intent classification (cached)
  const classifySpan = tracer.startSpan(traceId, "intent_classification", "llm", pipe.spanId);
  const intentKey    = message.trim().toLowerCase();
  let classification = intentCache.get(intentKey);
  if (!classification) {
    classification = await classifyIntents(message);
    intentCache.set(intentKey, classification, 30_000);
  }
  classifySpan.finish(classification);

  // 4. Route to sub-agents in parallel
  const routeSpan = tracer.startSpan(traceId, "parallel_routing", "agent", pipe.spanId);
  const agentResults = await routeToSubAgents(classification, history, traceId, routeSpan.spanId, tracer, costTracker, customerId);
  routeSpan.finish(agentResults);

  // 5. Merge responses
  const mergeSpan = tracer.startSpan(traceId, "response_merge", "llm", pipe.spanId);
  const rawReply  = await mergeResponses(message, agentResults, history);
  mergeSpan.finish(rawReply);

  // 6. Escalation check
  const escalation = await assessEscalation(message, rawReply, agentResults);
  if (escalation.shouldEscalate) {
    sessionStore.save(session);
    pipe.finish({ escalated: true });
    return {
      reply: escalation.handoffMessage ?? "I'm connecting you with a human agent.",
      traceId,
    };
  }

  // 7. Output validation
  const { sanitised } = validateOutput(rawReply);

  // 8. Save session
  session.history.push({ role: "user",      content: message    });
  session.history.push({ role: "assistant", content: sanitised  });
  sessionStore.save(session);

  pipe.finish(sanitised);
  return { reply: sanitised, traceId };
}
```

---

## 23.5 Security Baseline — Final Checklist

Before submitting the portfolio project, all items below must be checked:

- [ ] **Input validation** — all messages pass through `validateInput()` before any LLM call
- [ ] **System prompt hardening** — HARDENED_SYSTEM_PROMPT with immutable security instructions
- [ ] **Output validation** — `validateOutput()` applied before every response sent to client
- [ ] **PII redaction** — `redactPII()` applied before writing to logs and Langfuse
- [ ] **JWT authentication** — `authenticateJWT` middleware on all endpoints
- [ ] **Rate limiting** — `chatRateLimiter` per customer, 20 req/min
- [ ] **No secrets in prompts** — DB credentials, API keys only in env vars
- [ ] **Tool input validation** — `sanitiseOrderId()` (or equivalent) in every tool `execute()`
- [ ] **URL allowlist** — HTTP tools restrict to approved domains
- [ ] **`maxSteps` set** — prevents runaway ReAct loops
- [ ] **Budget guard** — `callWithBudget()` wraps all LLM calls with per-session cost ceiling

---

## 23.6 Performance Checklist

- [ ] Intent classification uses FAST model (haiku)
- [ ] Sub-agents run in parallel via `Promise.all`
- [ ] Intent classification results cached 30 s with `ResultCache`
- [ ] System prompt uses prompt caching headers (`cacheControl: { type: "ephemeral" }`)
- [ ] `maxTokens` set on every call
- [ ] Streaming enabled on final synthesis response
- [ ] Traced latency shows all stages within SLA (classify < 500 ms, total < 6,000 ms)

---

## 23.7 Cost Attribution Report

```typescript
function printCostReport(tracker: CostTracker): void {
  const totals = tracker.totals();
  console.log("\n╔═══════════════════════════════════╗");
  console.log("║     Session Cost Attribution       ║");
  console.log("╠═══════════════════════════════════╣");
  for (const [key, usd] of Object.entries(totals)) {
    console.log(`║  ${key.padEnd(20)}  $${usd.toFixed(5)}  ║`);
  }
  console.log("╚═══════════════════════════════════╝");
}
```

---

## Chapter Summary

The portfolio project ties every chapter together into a single production pipeline. The measure of success is not just "it works" but:

| Dimension | Target |
|-----------|--------|
| Security baseline | All 11 checks pass |
| Performance | p95 end-to-end < 6,000 ms |
| Cost | < $0.015 per session average |
| Observability | 100% of requests traced |
| Test coverage | LLM-as-judge score ≥ 0.85 on golden set |

---

*Next: Chapter 24 — Calling OpenRouter from Laravel*
