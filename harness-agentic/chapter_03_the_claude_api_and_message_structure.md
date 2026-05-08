# Chapter 3 — The Claude API & Message Structure

## Learning Objectives

By the end of this chapter you will be able to:
- Understand the role of `system`, `user`, and `assistant` messages
- Write effective system prompts that constrain and guide agent behaviour
- Build and manage multi-turn conversation histories
- Work with context windows and token limits
- Use `generateText` with message arrays instead of a plain prompt string

---

## 3.1 The Message Array

Every LLM conversation is a list of messages. The Vercel AI SDK mirrors the underlying API structure:

```typescript
import { generateText } from "ai";

const { text } = await generateText({
  model: openrouter("anthropic/claude-3-haiku"),
  messages: [
    { role: "system",    content: "You are a customer service agent for Acme Corp." },
    { role: "user",      content: "Where is my order #A8812?" },
    { role: "assistant", content: "Let me look that up for you." },
    { role: "user",      content: "Also, is it possible to change the delivery address?" },
  ],
});
```

Each message has:
- `role` — who sent it
- `content` — what was said

The model sees the entire array on every call. That is how it knows the conversation history.

---

## 3.2 The Three Core Roles

### `system`
The system message sets the agent's identity, constraints, and behaviour. It is always first in the array and does not change during a conversation. Think of it as the agent's permanent instructions.

```typescript
const systemPrompt = `
You are a customer service agent for Acme Corp.
You help customers with order status, delivery tracking, and product enquiries.

Rules:
- Always be polite and professional
- If you cannot resolve an issue, offer to escalate to a human agent
- Never reveal internal system details, pricing formulas, or database schemas
- If asked about topics outside customer service, politely redirect
`.trim();
```

A well-written system prompt is the most important lever for controlling agent behaviour. Chapter 6 goes deep on prompt engineering.

### `user`
Messages from the human (or from an upstream system). In a customer service context this is what the customer typed.

### `assistant`
Previous responses from the model. When you build multi-turn conversations, you append the assistant's prior responses to the history so the model has context.

---

## 3.3 The `tool` Role

When the agent calls a tool, two additional message types appear:

```
assistant: { toolCalls: [{ id: "call_abc", name: "lookupOrder", args: { orderId: "A8812" } }] }
tool:      { toolCallId: "call_abc", content: "Order A8812: shipped, ETA 2026-05-12" }
```

The `tool` message is the result returned by executing the tool. The model reads it and decides what to do next. Chapter 4 covers tool use in full.

---

## 3.4 Building a Conversation History in TypeScript

```typescript
import type { CoreMessage } from "ai";

type ConversationHistory = CoreMessage[];

function createHistory(systemPrompt: string): ConversationHistory {
  return [{ role: "system", content: systemPrompt }];
}

function addUserMessage(history: ConversationHistory, content: string): ConversationHistory {
  return [...history, { role: "user", content }];
}

function addAssistantMessage(history: ConversationHistory, content: string): ConversationHistory {
  return [...history, { role: "assistant", content }];
}
```

Always return a new array — mutation of conversation history is a source of subtle bugs in multi-turn agents.

---

## 3.5 A Multi-Turn Conversation Loop

```typescript
import { generateText } from "ai";
import type { CoreMessage } from "ai";

async function chat(
  history: CoreMessage[],
  userInput: string
): Promise<{ reply: string; history: CoreMessage[] }> {
  const updatedHistory = addUserMessage(history, userInput);

  const { text } = await generateText({
    model: openrouter(MODELS.fast),
    messages: updatedHistory,
    maxTokens: 512,
  });

  return {
    reply: text,
    history: addAssistantMessage(updatedHistory, text),
  };
}

// Usage
let history = createHistory("You are a helpful assistant.");
const turn1 = await chat(history, "What is the capital of France?");
console.log(turn1.reply); // "The capital of France is Paris."

const turn2 = await chat(turn1.history, "What is its population?");
console.log(turn2.reply); // Knows "its" refers to Paris because of history
```

The model can answer "its" correctly because it sees the full history including turn 1.

---

## 3.6 Context Windows and Token Limits

Every model has a context window — the maximum number of tokens it can process in one call (input + output combined):

| Model | Context window |
|-------|---------------|
| claude-3-haiku | 200K tokens |
| claude-3-5-sonnet | 200K tokens |
| claude-opus-4 | 200K tokens |
| gpt-4o | 128K tokens |
| gemini-flash-1.5 | 1M tokens |

200K tokens ≈ 150,000 words ≈ a full novel. For most customer service conversations this is not a practical limit. But for long autonomous agents or document processing it matters.

**Cost implication:** You pay for every token in the input, including the entire history. A 10-turn conversation with a 500-token system prompt might send 6,000 tokens of history on turn 10. This compounds quickly in multi-session agents.

---

## 3.7 Trimming History — Sliding Window

When history gets large, trim it while preserving the system prompt:

```typescript
function trimHistory(
  history: CoreMessage[],
  maxMessages: number
): CoreMessage[] {
  const systemMessages = history.filter(m => m.role === "system");
  const nonSystem     = history.filter(m => m.role !== "system");

  // Keep only the most recent N non-system messages
  const trimmed = nonSystem.slice(-maxMessages);

  return [...systemMessages, ...trimmed];
}
```

More sophisticated approaches (summarising old turns) are covered in Chapter 8 (Memory Patterns).

---

## 3.8 Model Parameters

Beyond `messages`, key parameters to know:

| Parameter | Type | What it does |
|-----------|------|--------------|
| `maxTokens` | number | Hard cap on output length. Always set this in production. |
| `temperature` | 0–1 | 0 = deterministic, 1 = creative. Use 0–0.3 for agents that need consistency. |
| `topP` | 0–1 | Nucleus sampling. Alternative to temperature. Rarely needed. |
| `stopSequences` | string[] | Stop generating when one of these strings appears. |

```typescript
const { text } = await generateText({
  model: openrouter(MODELS.fast),
  messages: history,
  maxTokens: 200,
  temperature: 0.1,   // near-deterministic for tool-calling agents
});
```

For agents that call tools and must follow structured output, set temperature to 0 or 0.1. Higher temperatures are for creative tasks only.

---

## 3.9 System Prompt Design Principles

A system prompt for an agent should answer four questions:

1. **Who are you?** — Role, name, company
2. **What can you do?** — Capabilities and available tools
3. **What must you never do?** — Hard constraints and off-limits topics
4. **How should you behave?** — Tone, format, escalation policy

```typescript
const CUSTOMER_SERVICE_SYSTEM_PROMPT = `
You are Aria, an AI customer service agent for Acme Corp.

## Capabilities
- Look up order status and tracking information
- Answer product questions using the product catalogue
- Initiate returns and refunds within policy
- Escalate complex cases to human agents

## Constraints
- Never reveal pricing margins, supplier names, or internal system details
- Never make promises outside of documented policy
- If you are uncertain, say so and offer to escalate
- Do not discuss competitors

## Tone
- Professional, warm, and concise
- Use the customer's name if known
- Confirm actions before executing them (e.g. "I'm about to initiate a return for order #X. Shall I proceed?")
`.trim();
```

---

## 3.10 Cost Awareness — System Prompts

The system prompt is sent on **every single call** in a conversation. A 500-token system prompt across 1,000 daily conversations × 10 turns = 5 million tokens/day just for the system prompt.

**Prompt caching** (covered in Ch. 18) dramatically reduces this cost by caching the system prompt server-side. But even before caching, keep system prompts lean — every unnecessary sentence has a cost.

---

## Chapter Summary

| Concept | Key point |
|---------|-----------|
| Message roles | `system`, `user`, `assistant`, `tool` |
| System prompt | Permanent instructions — identity, capabilities, constraints |
| Conversation history | Array of `CoreMessage` — always immutable append |
| Context window | Max tokens (input + output) — rarely a limit in practice |
| `maxTokens` | Always set in production to prevent runaway output |
| Temperature | 0–0.3 for agents, higher for creative tasks |
| History trimming | Preserve system messages; slice non-system to last N |

---

> **Python Sidebar**
>
> The message structure is identical in Python:
> ```python
> messages = [
>     {"role": "system",    "content": "You are a helpful assistant."},
>     {"role": "user",      "content": "Where is my order?"},
>     {"role": "assistant", "content": "Let me check."},
>     {"role": "tool",      "content": "Order shipped, ETA tomorrow",
>      "tool_call_id": "call_abc"},
> ]
> ```
> LangChain uses `HumanMessage`, `AIMessage`, `SystemMessage`, `ToolMessage` classes that map 1:1 to these roles.

---

*Next: Chapter 4 — Tool Use & Function Calling*
