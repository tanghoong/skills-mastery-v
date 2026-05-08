# Chapter 1 — What is an Agentic System?

## Learning Objectives

By the end of this chapter you will be able to:
- Define what an agent is and how it differs from a plain LLM API call
- Explain the Perceive → Think → Act → Observe loop
- Identify the four types of agents covered in this course
- Describe when to use an agent versus a simpler approach
- Understand the enterprise use cases that anchor the rest of the course

---

## 1.1 From API Call to Agent

When you call an LLM directly, the interaction is stateless and one-shot:

```
You send a prompt → The model returns text → Done
```

That is useful for summarisation, classification, or drafting. But real-world tasks are rarely one-shot. Consider a customer asking:

> "Where is my order #A8812? And do you have a replacement hinge for the XR-200 door?"

Answering this requires:
1. Understanding there are *two* distinct requests in one message
2. Looking up order #A8812 in an order management system
3. Searching a product catalogue for part compatibility
4. Merging both results into a coherent reply

No single LLM call does all of this. You need a system that can **reason about what to do next, take actions, observe results, and loop** until the task is complete. That system is an **agent**.

---

## 1.2 The Core Definition

An **agentic system** is a software architecture in which a language model drives a loop that:

1. **Perceives** — receives input (user message, tool result, external event)
2. **Thinks** — reasons about the current state and decides what to do next
3. **Acts** — calls a tool, queries an API, delegates to another agent
4. **Observes** — receives the result of that action and updates its state

The loop continues until the agent decides the task is complete or a stopping condition is met.

```
┌─────────────────────────────────────────────┐
│                  Agent Loop                  │
│                                              │
│   Input ──► Think ──► Act ──► Observe ──►   │
│               ▲                        │     │
│               └────────────────────────┘     │
│                                              │
│   (exits when task complete or max steps)    │
└─────────────────────────────────────────────┘
```

---

## 1.3 Agents vs. Chains vs. Single Calls

It helps to place agents on a spectrum:

| Pattern | Description | When to use |
|---------|-------------|-------------|
| **Single call** | One prompt, one response | Summarisation, classification, simple Q&A |
| **Chain** | Fixed sequence of LLM calls, no branching | Multi-step pipelines with known structure |
| **Agent** | LLM decides the sequence dynamically | Open-ended tasks, tool use, unknown number of steps |
| **Multi-agent** | Multiple agents collaborate or compete | Complex tasks that benefit from specialisation or parallelism |

The key distinguisher for an agent: **the LLM decides what to do next at each step**. A chain has the control flow hard-coded. An agent has the control flow emerge from reasoning.

---

## 1.4 The Four Agent Types in This Course

### Reactive Agent
Responds to a single input, uses tools if needed, returns a single response. No persistent memory across conversations.

```
User message → [Agent: classify + lookup] → Response
```

*Enterprise use*: order status enquiry (Ch. 4, 5).

### Stateful Agent
Maintains conversation history and session state. Knows what was said earlier in the same conversation.

```
Turn 1: "Where is my order?"   → Agent fetches order status
Turn 2: "Can I cancel it?"     → Agent knows which order without being told again
```

*Enterprise use*: customer service chat (Ch. 8, 11).

### Multi-Agent System
An orchestrator delegates sub-tasks to specialised agents and merges results.

```
Customer message
  → Orchestrator
    ├── Order Agent (fast/cheap model)
    ├── Delivery Agent (fast/cheap model)
    └── Catalogue Agent (embedding + RAG)
  → Response Merger
  → Unified reply
```

*Enterprise use*: the portfolio project (Ch. 12, 23).

### Autonomous Agent
Runs without a human in the loop for many steps. Plans, executes, observes, and self-corrects.

```
"Audit the product catalogue for missing spare parts and generate a report"
→ Agent runs for N steps, reads files, queries DB, writes report
→ Returns result when done
```

*Enterprise use*: code execution and web scraping agents (Ch. 14, 15).

---

## 1.5 Tools — The Agent's Hands

An agent without tools is just a chatbot. Tools are what give agents real-world reach:

| Tool category | Examples |
|--------------|----------|
| **Data lookup** | Order management API, CRM, product DB |
| **Web** | HTTP requests, web scraping, carrier tracking |
| **Computation** | Code execution, maths, data transformation |
| **Memory** | Vector search, session store, file read/write |
| **Agent delegation** | Calling a sub-agent, spawning a worker |
| **Human** | Escalation to a support agent via CRM webhook |

Tool calls are how an agent moves from *knowing* to *doing*. The LLM decides **which tool to call**, **with what arguments**, and **what to do with the result**. You define the available tools — the agent decides whether and how to use them.

---

## 1.6 Why Not Just Use a Bigger Prompt?

A common reaction: "Can't I just stuff everything into a massive system prompt and skip the agent loop?"

Sometimes yes — for simple cases. But agents solve problems that prompts alone cannot:

| Problem | Why prompts can't solve it | How agents solve it |
|---------|---------------------------|---------------------|
| Real-time data | Training data has a cutoff | Tool call fetches live data |
| Multi-step reasoning | Context window limits deep chains | Loop allows incremental progress |
| Unpredictable task length | Can't know upfront how many steps | Loop runs until done |
| Parallel sub-tasks | Sequential by nature | Multi-agent parallelism |
| External side effects | Prompt can't write to a database | Tool call can |

---

## 1.7 Production Concerns — A Preview

The course treats three concerns as first-class throughout every phase:

### Cost
Every LLM call has a price. Agents run loops, call multiple models, and generate more tokens than single calls. Unchecked, costs compound. From the first chapter, we think in terms of:
- Which tasks need a powerful (expensive) model?
- Which can use a cheap/fast model?
- How many loop iterations is too many?

Chapter 18 gives this a full treatment. Earlier chapters flag cost implications as they arise.

### Security
Agents act on behalf of users and interact with real systems. A malicious user can try to manipulate the agent via the input (prompt injection). A poorly designed agent can leak sensitive data through its outputs. Chapter 22 covers defences systematically. Earlier chapters flag the attack surface as it grows.

### Performance
Agents are slower than single API calls by definition — they loop. An enterprise customer waiting 10 seconds for an order status is not acceptable. We set latency targets from the start:
- Intent classification: < 500 ms p95
- Single-agent response: < 3 s p95
- Multi-agent parallel: < 6 s p95

Chapter 21 shows how to hit these targets. Streaming (Ch. 9) keeps perceived latency low even when total latency is high.

---

## 1.8 The Course Architecture — Enterprise Customer Service Platform

Every pattern in this course builds toward one production system:

```
Customer Message
       ↓
  Intent Classifier         ← Ch. 11
  ├── Order Status Agent    ← Ch. 4, 5, 7       → Order Management API
  ├── Delivery Agent        ← Ch. 4, 7, 15       → Shipping Carrier API
  ├── Catalogue/RAG Agent   ← Ch. 7, 11, 13      → Vector store
  └── General Support Agent ← Ch. 8, 13, 17      → Knowledge base + Human Handoff
       ↓
  Response Merger           ← Ch. 12
       ↓
  Single coherent reply to customer
```

The platform will:
- Handle multiple intents in a single message
- Route to specialised agents in parallel
- Stream responses to the user
- Hand off to human agents when confidence is low
- Track cost per session and per use case
- Meet sub-3-second p95 latency for single-agent flows

---

## 1.9 Technology Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Language | TypeScript | Type-safe agent pipelines, full-stack coherence |
| LLM backend | OpenRouter | Any model, one API, cost visibility |
| Primary SDK | Vercel AI SDK | Streaming, tool use, structured output, OpenRouter native |
| Validation | Zod | Runtime type safety for all tool inputs and outputs |
| Database | Supabase (pgvector + PostgreSQL) | Sessions, embeddings, escalation logs |
| Deployment | Railway / Render + Vercel | Agent microservice + web UI |

---

## 1.10 Chapter Summary

| Concept | One-line definition |
|---------|---------------------|
| Agent | A system where the LLM drives a Perceive → Think → Act → Observe loop |
| Tool | A function the agent can call to interact with the real world |
| Reactive agent | Stateless: one request, one response, tools as needed |
| Stateful agent | Maintains conversation history and session context |
| Multi-agent | Orchestrator + specialised sub-agents |
| Autonomous agent | Runs many steps without human intervention |
| ReAct pattern | Interleaved Reasoning and Acting (Ch. 5) |

---

## Further Reading

- [Anthropic: Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) — the definitive guide to agentic patterns
- [Vercel AI SDK Docs](https://sdk.vercel.ai/docs) — the SDK used throughout this course
- [OpenRouter Docs](https://openrouter.ai/docs) — model routing reference

---

> **Python Sidebar**
>
> The Python ecosystem has mature agentic frameworks worth knowing:
> - **LangGraph** — graph-based agent state machines with explicit nodes and edges
> - **LlamaIndex** — RAG-first agents with strong document processing
> - **CrewAI** — role-based multi-agent collaboration
> - **AutoGen** (Microsoft) — conversational multi-agent patterns
>
> This course uses TypeScript + Vercel AI SDK for its production and type-safety advantages. The Python alternatives are noted in sidebars when their patterns differ meaningfully.

---

*Next: Chapter 2 — OpenRouter Setup & Model Routing*
