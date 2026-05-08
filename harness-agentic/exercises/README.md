# Harness Agentic — Exercise Progress Tracker

## How to Run Exercises

```bash
# Install dependencies (once)
cd harness-agentic
npm install

# Run a chapter exercise
tsx exercises/chapter_01.ts
tsx exercises/chapter_22.ts
# etc.
```

**Prerequisite:** Create a `.env` file in `harness-agentic/` with:
```
OPENROUTER_API_KEY=sk-or-...
```

---

## Progress Tracker

| # | Chapter | Theory | Exercise | Status |
|---|---------|--------|----------|--------|
| 01 | What Is an Agentic System? | ✅ | ✅ | |
| 02 | OpenRouter Setup & Model Routing | ✅ | ✅ | |
| 03 | The Claude API & Message Structure | ✅ | ✅ | |
| 04 | Tool Use & Function Calling | ✅ | ✅ | |
| 05 | The Agent Loop — ReAct Pattern | ✅ | ✅ | |
| 06 | Prompt Engineering for Agents | ✅ | ✅ | |
| 07 | Structured Output with Zod | ✅ | ✅ | |
| 08 | Memory Patterns & Session Management | ✅ | ✅ | |
| 09 | Streaming Responses | ✅ | ✅ | |
| 10 | Error Handling & Retries | ✅ | ✅ | |
| 11 | Intent Detection & Conversation Routing | ✅ | ✅ | |
| 12 | Multi-Agent Orchestration | ✅ | ✅ | |
| 13 | RAG — Retrieval Augmented Generation | ✅ | ✅ | |
| 14 | Code Execution Agents | ✅ | ✅ | |
| 15 | Web & File System Agents | ✅ | ✅ | |
| 16 | Model Context Protocol (MCP) | ✅ | ✅ | |
| 17 | Human Handoff & Escalation | ✅ | ✅ | |
| 18 | Cost Optimisation & Token Budgeting | ✅ | ✅ | |
| 19 | Evaluation & Testing Agents | ✅ | ✅ | |
| 20 | Observability & Tracing | ✅ | ✅ | |
| 21 | Performance Optimisation | ✅ | ✅ | |
| 22 | Security, Safety & Guardrails | ✅ | ✅ | |
| 23 | Portfolio Project | ✅ | ✅ | |
| 24 | Calling OpenRouter from Laravel | ✅ | ✅ | |
| 25 | Laravel as Agent Orchestrator | ✅ | ✅ | |
| 26 | The Hybrid Architecture | ✅ | ✅ | |

Mark each row **Done** as you complete it.

---

## Exercise Workflow

1. **Read the theory chapter** (`chapter_NN_topic.md`) first
2. **Open the exercise file** (`exercises/chapter_NN.ts`)
3. **Implement the TODOs** — each exercise has a matching `main()` that runs assertions
4. **Run with `tsx`** to verify assertions pass
5. **Ask for a review** — "Review my chapter N exercise" in this chat

---

## Production Pillars Coverage

| Pillar | Chapters |
|--------|----------|
| **Performance** | 09 (streaming), 10 (retries), 12 (parallel agents), 18 (model tiering), 21 (dedicated) |
| **Security** | 06 (prompt hardening), 15 (URL allowlist), 16 (MCP trust), 17 (escalation), 22 (dedicated) |
| **Cost** | 02 (cost awareness), 05 (budget guard), 10 (circuit breaker), 18 (dedicated), 21 (caching) |
| **Observability** | 20 (dedicated), 23 (portfolio integration) |

---

## Quick Reference — Key Patterns

| Pattern | Chapter | File |
|---------|---------|------|
| First LLM call | 02 | `chapter_02.ts` |
| Tool use | 04 | `chapter_04.ts` |
| ReAct loop | 05 | `chapter_05.ts` |
| Structured output | 07 | `chapter_07.ts` |
| Session memory | 08 | `chapter_08.ts` |
| Streaming | 09 | `chapter_09.ts` |
| Error + retry | 10 | `chapter_10.ts` |
| Multi-intent routing | 11 | `chapter_11.ts` |
| Multi-agent fan-out | 12 | `chapter_12.ts` |
| RAG pipeline | 13 | `chapter_13.ts` |
| Escalation | 17 | `chapter_17.ts` |
| Cost tracking | 18 | `chapter_18.ts` |
| LLM-as-judge eval | 19 | `chapter_19.ts` |
| Tracing | 20 | `chapter_20.ts` |
| Result caching + SLA | 21 | `chapter_21.ts` |
| Prompt injection defence | 22 | `chapter_22.ts` |
| Full pipeline (portfolio) | 23 | `chapter_23.ts` |
| Laravel bridge | 24–26 | `chapter_24–26.ts` |
