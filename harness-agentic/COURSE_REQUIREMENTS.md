# Harness Agentic — Course Requirements & Decisions

A reference document capturing all agreed decisions, scope, and structure for the Harness Agentic course before content is built.

---

## Course Purpose

Build production-grade agentic AI systems from first principles, targeting real enterprise use cases. By the end, the learner can design, build, test, and deploy a multi-agent customer service platform that handles complex, multi-intent conversations — and integrate it into an existing Laravel organisation.

---

## Language Strategy

| Track | Language | Role |
|-------|----------|------|
| Primary | **TypeScript** | All chapters — every concept, every exercise, every pattern |
| Secondary | **Python** | Callout sidebars per chapter where the ecosystem is significantly richer (LangGraph, LlamaIndex, DSPy, etc.) |
| Add-on | **PHP / Laravel** | Dedicated Phase 5 chapters (Ch. 23–25) — integration patterns only, not reimplementing agent logic in PHP |

### Why TypeScript as Primary
- Builds directly on the existing TypeScript Mastery course in this repo
- Vercel AI SDK has native OpenRouter support with a unified interface across all models
- Type safety across the full agent pipeline is a production advantage
- Full-stack coherence — agent service, web UI, and API in one language
- Laravel orgs will run TypeScript as a microservice alongside PHP, not replace it

---

## Backend — OpenRouter

OpenRouter is the model backend throughout the course. It provides:
- A single API endpoint that routes to any model (Claude, GPT-4, Gemini, Llama, Mistral, etc.)
- OpenAI-compatible API — works with Vercel AI SDK, LangChain.js, and raw fetch
- Per-request model selection — route cheap tasks to fast/cheap models, complex reasoning to powerful models
- Cost visibility across all providers in one dashboard

**Primary SDK:** Vercel AI SDK (TypeScript) — native OpenRouter support, streaming, tool use, structured output.

---

## Enterprise Use Cases Covered

The course is anchored to four real enterprise customer service scenarios:

| Use Case | Key Chapters | Cost Notes | Security Notes | Performance Notes |
|----------|-------------|------------|----------------|-------------------|
| **RAG for customer chat support** | Ch. 8, 11, 12, 13 | Embedding costs; cheap retrieval model + expensive synthesis model | Input sanitisation before retrieval; source attribution required | Retrieval latency budget; cache frequent queries |
| **Order status enquiry** | Ch. 4, 5, 7, 11 | High-volume; route to cheapest capable model | Order IDs must be validated; no raw DB errors to user | Tool call latency dominates; p95 target < 2 s |
| **Delivery tracker enquiry** | Ch. 4, 7, 11, 15 | External API calls add cost variability | Carrier API auth; scraping rate limits | Parallel carrier lookups; streaming status updates |
| **Product catalogue — components, spare parts, accessories** | Ch. 7, 11, 13 | Large catalogue = high embedding cost at ingest | Prevent catalogue data leakage; validate part numbers | Vector search latency; pre-warm index for popular queries |

### Multi-Intent Requirement
A customer may ask about an order status *and* a spare part compatibility in the same message. Ch. 11 (Intent Detection & Conversation Routing) addresses this directly:
- Classify multiple intents from a single message
- Extract structured slots (order numbers, model codes, part numbers) from natural language
- Route to the correct sub-agent(s) in parallel
- Merge responses into a single coherent reply

### Cost Visibility Requirement
Cost must be trackable per agent, per session, and per use case from Ch. 18 onward:
- Every LLM call tagged with agent name, use case, and session ID
- Aggregate cost dashboards in Ch. 20 (Observability)
- Budget guards that abort or downgrade model if a per-session cost ceiling is hit
- Prompt caching strategy documented and measured for each use case

### Performance SLA Requirement
Agentic flows must meet real enterprise latency expectations:
- Intent classification: < 500 ms p95
- Single-agent responses: < 3 s p95
- Multi-agent parallel resolution: < 6 s p95
- Streaming must begin within 800 ms of first token
- Ch. 21 defines these SLAs and shows how to measure and hit them

### Security Baseline Requirement
All agent APIs built in the course meet this baseline by Ch. 22:
- All inputs validated and prompt-injection-hardened before reaching the LLM
- No secrets in prompts, tool call parameters, or agent state
- API endpoints protected with authentication (JWT or API key) and rate limiting
- PII redacted from logs and trace exports
- Agent outputs sanitised before returning to caller

### Human Handoff Requirement
Ch. 17 (Human Handoff & Escalation) covers:
- Detecting when the agent cannot confidently resolve a query
- Packaging full conversation context and intent summary for the human agent
- CRM webhook integration (Zendesk, Freshdesk, or custom)
- Graceful re-entry when the human resolves and passes back to the agent

---

## Portfolio Project — Ch. 22

**Enterprise Customer Service Agent Platform**

A production-ready multi-agent system that handles all four use cases as one unified platform:

```
Customer Message
       ↓
  Intent Classifier (Ch. 11)
  ├── Order Status Agent    → Order Management API
  ├── Delivery Agent        → Shipping Carrier API
  ├── Catalogue/RAG Agent   → Vector store (product catalogue)
  └── General Support Agent → RAG (knowledge base) + Human Handoff
       ↓
  Response Merger → Single coherent reply to customer
```

Every pattern from Phases 1–4 appears in this project.

---

## Production Pillars — Cross-Cutting Coverage

Three pillars run through the entire course and receive dedicated treatment in Phase 4. Earlier chapters flag relevant patterns as they arise.

| Pillar | Primary Chapters | Supporting Chapters |
|--------|-----------------|---------------------|
| **Performance** | Ch. 21 | Ch. 9 (streaming), Ch. 10 (retries/timeouts), Ch. 12 (parallel agents), Ch. 20 (tracing latency) |
| **Security** | Ch. 22 | Ch. 6 (prompt injection surface), Ch. 7 (output validation), Ch. 10 (error leakage), Ch. 16 (MCP server trust) |
| **Cost** | Ch. 18 | Ch. 2 (model tiers), Ch. 6 (prompt compression), Ch. 8 (context window management), Ch. 13 (embedding costs) |

---

## Full 26-Chapter Structure

### Phase 1 — Foundations (Ch. 1–5)
| # | Title |
|---|-------|
| 1 | What is an Agentic System? |
| 2 | OpenRouter Setup & Model Routing |
| 3 | The Claude API & Message Structure |
| 4 | Tool Use & Function Calling |
| 5 | The Agent Loop — ReAct Pattern |

### Phase 2 — Building Blocks (Ch. 6–11)
| # | Title | Notes |
|---|-------|-------|
| 6 | Prompt Engineering for Agents | |
| 7 | Structured Output with Zod | |
| 8 | Memory Patterns & Session Management | Expanded — persistent session state, context carryover |
| 9 | Streaming Responses | |
| 10 | Error Handling & Retries | |
| 11 | Intent Detection & Conversation Routing | Multi-intent, slot filling, parallel sub-agent routing |

### Phase 3 — Advanced Patterns (Ch. 12–17)
| # | Title | Notes |
|---|-------|-------|
| 12 | Multi-Agent Orchestration | Orchestrator + subagents, parallel execution, handoffs |
| 13 | RAG — Retrieval-Augmented Generation | Embeddings, vector search, product catalogue ingestion |
| 14 | Code Execution Agents | Sandboxing, eval loops, self-correcting code |
| 15 | Web & File System Agents | Scraping, file I/O, carrier tracking pages |
| 16 | Model Context Protocol (MCP) | Building custom MCP servers, connecting tools |
| 17 | Human Handoff & Escalation | Escalation detection, CRM integration, context packaging |

### Phase 4 — Production (Ch. 18–23)
| # | Title | Notes |
|---|-------|-------|
| 18 | Cost Optimisation & Token Budgeting | Model tiering, prompt caching, token budgets, cost alerting, attribution per agent |
| 19 | Evaluation & Testing Agents | |
| 20 | Observability & Tracing | Latency tracing, token-usage dashboards, cost-per-request metrics |
| 21 | Performance Optimisation | Latency budgets, parallel vs sequential agent execution, prompt caching, connection pooling, streaming tradeoffs, token efficiency |
| 22 | Security, Safety & Guardrails | Prompt injection & jailbreak defence, OWASP AI Top 10, output sanitisation, secrets management, API auth, rate limiting, PII redaction |
| 23 | Portfolio Project — Enterprise Customer Service Agent Platform | |

### Phase 5 — Laravel Add-on (Ch. 24–26)
| # | Title | Notes |
|---|-------|-------|
| 24 | Calling OpenRouter from Laravel | HTTP client, streaming SSE, queue-based jobs |
| 25 | Laravel as Agent Orchestrator | Dispatching tasks, storing results, webhooks, polling |
| 26 | The Hybrid Architecture — Laravel + TypeScript Agent Microservice | API contracts, deployment, Docker |

---

## Exercise Format

Same structure as the TypeScript Mastery course:
- One `.ts` exercise file per chapter (`exercises/chapter_NN.ts`)
- `// TODO` blocks to implement
- Run with: `tsx exercises/chapter_NN.ts`
- Python equivalents where noted will be in `exercises/chapter_NN.py`

## Progress Tracker

| Chapter | Status |
|---------|--------|
| Ch. 01 — What is an Agentic System? | ⬜ Not started |
| Ch. 02 — OpenRouter Setup & Model Routing | ⬜ Not started |
| Ch. 03 — The Claude API & Message Structure | ⬜ Not started |
| Ch. 04 — Tool Use & Function Calling | ⬜ Not started |
| Ch. 05 — The Agent Loop — ReAct Pattern | ⬜ Not started |
| Ch. 06 — Prompt Engineering for Agents | ⬜ Not started |
| Ch. 07 — Structured Output with Zod | ⬜ Not started |
| Ch. 08 — Memory Patterns & Session Management | ⬜ Not started |
| Ch. 09 — Streaming Responses | ⬜ Not started |
| Ch. 10 — Error Handling & Retries | ⬜ Not started |
| Ch. 11 — Intent Detection & Conversation Routing | ⬜ Not started |
| Ch. 12 — Multi-Agent Orchestration | ⬜ Not started |
| Ch. 13 — RAG — Retrieval-Augmented Generation | ⬜ Not started |
| Ch. 14 — Code Execution Agents | ⬜ Not started |
| Ch. 15 — Web & File System Agents | ⬜ Not started |
| Ch. 16 — Model Context Protocol (MCP) | ⬜ Not started |
| Ch. 17 — Human Handoff & Escalation | ⬜ Not started |
| Ch. 18 — Cost Optimisation & Token Budgeting | ⬜ Not started |
| Ch. 19 — Evaluation & Testing Agents | ⬜ Not started |
| Ch. 20 — Observability & Tracing | ⬜ Not started |
| Ch. 21 — Performance Optimisation | ⬜ Not started |
| Ch. 22 — Security, Safety & Guardrails | ⬜ Not started |
| Ch. 23 — Portfolio Project | ⬜ Not started |
| Ch. 24 — Calling OpenRouter from Laravel | ⬜ Not started |
| Ch. 25 — Laravel as Agent Orchestrator | ⬜ Not started |
| Ch. 26 — The Hybrid Architecture | ⬜ Not started |

---

## Deployment Target (Portfolio Project)

| Layer | Service | Notes |
|-------|---------|-------|
| Agent API (NestJS/Express) | Railway or Render | TypeScript agent microservice |
| Web chat UI (Next.js) | Vercel | Customer-facing chat interface |
| Vector store | Supabase pgvector or Pinecone | Product catalogue + knowledge base |
| Database | Supabase PostgreSQL | Session history, escalation logs |
| CRM webhook | Zendesk / custom | Human handoff integration |
| Model routing | OpenRouter | All LLM calls |

---

*Original structure agreed: 2026-05-07. Enhanced with Performance (Ch. 21), expanded Cost (Ch. 18) and Security (Ch. 22) chapters: 2026-05-08. Now 26 chapters. Ready to proceed with content build.*
