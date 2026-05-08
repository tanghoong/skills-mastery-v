# Chapter 8 — Memory Patterns & Session Management

## Learning Objectives

By the end of this chapter you will be able to:
- Distinguish between the four types of agent memory
- Implement persistent session state with a database
- Use conversation summarisation to compress long histories
- Build a session store that survives process restarts
- Apply context carryover across multi-turn customer service conversations

---

## 8.1 The Four Types of Agent Memory

Agents can remember things in four distinct ways:

| Memory Type | Where stored | Lifespan | Use case |
|-------------|-------------|----------|----------|
| **In-context** | LLM message array | Current request | Conversation history, tool results |
| **External (session)** | Database / cache | Session duration | Persistent conversation state |
| **Semantic** | Vector store | Long-term | Knowledge base, product catalogue |
| **Procedural** | System prompt / tools | Permanent | Agent capabilities, policies |

This chapter covers **in-context** and **external (session)** memory. Semantic memory (RAG) is Chapter 13.

---

## 8.2 In-Context Memory — the Message Array

Everything in the message array is "in-context" memory. The model can see and reference it. The limitation: it disappears when the process ends unless you persist it.

```typescript
// In-context: model remembers within this request
let history: CoreMessage[] = [
  { role: "system", content: systemPrompt },
  { role: "user",   content: "Where is order A8812?" },
  { role: "assistant", content: "Order A8812 is shipped, ETA 2026-05-12." },
];

// Follow-up — model knows about A8812 because it's in history
const { text } = await generateText({
  model: openrouter(MODELS.fast),
  messages: [...history, { role: "user", content: "Can I change the delivery address?" }],
});
```

---

## 8.3 Session State — Persisting History

Session memory bridges process restarts. Store the conversation history in a database keyed by session ID:

```typescript
import { createClient } from "@supabase/supabase-js";
import type { CoreMessage } from "ai";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

interface Session {
  id: string;
  customerId: string;
  history: CoreMessage[];
  createdAt: Date;
  updatedAt: Date;
  metadata: Record<string, unknown>;
}

async function loadSession(sessionId: string): Promise<Session | null> {
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  if (error || !data) return null;
  return data as Session;
}

async function saveSession(session: Session): Promise<void> {
  const { error } = await supabase
    .from("sessions")
    .upsert({
      ...session,
      updatedAt: new Date(),
    });

  if (error) throw new Error(`Failed to save session: ${error.message}`);
}

async function createSession(customerId: string, systemPrompt: string): Promise<Session> {
  const session: Session = {
    id: crypto.randomUUID(),
    customerId,
    history: [{ role: "system", content: systemPrompt }],
    createdAt: new Date(),
    updatedAt: new Date(),
    metadata: {},
  };
  await saveSession(session);
  return session;
}
```

---

## 8.4 Session-Aware Chat

A complete request handler that loads, updates, and saves session state:

```typescript
async function handleMessage(
  sessionId: string,
  userMessage: string,
  customerId: string
): Promise<{ reply: string; sessionId: string }> {
  // Load or create session
  let session = await loadSession(sessionId)
    ?? await createSession(customerId, CUSTOMER_SERVICE_SYSTEM_PROMPT);

  // Add user message
  session.history = [...session.history, { role: "user", content: userMessage }];

  // Run the agent
  const { text } = await generateText({
    model: openrouter(MODELS.balanced),
    messages: session.history,
    tools,
    maxSteps: 5,
  });

  // Append assistant reply and persist
  session.history = [...session.history, { role: "assistant", content: text }];
  await saveSession(session);

  return { reply: text, sessionId: session.id };
}
```

---

## 8.5 Conversation Summarisation

Long conversations are expensive (you pay for every history token) and eventually hit context limits. Summarise old turns instead of truncating them:

```typescript
async function summariseHistory(history: CoreMessage[]): Promise<string> {
  const conversationText = history
    .filter(m => m.role !== "system")
    .map(m => `${m.role}: ${typeof m.content === "string" ? m.content : JSON.stringify(m.content)}`)
    .join("\n");

  const { text } = await generateText({
    model: openrouter(MODELS.fast),
    system: "You are a conversation summariser. Produce a concise 2-3 sentence summary of the key facts from this customer service conversation. Focus on: what the customer needed, what was resolved, and any pending actions.",
    prompt: conversationText,
    maxTokens: 150,
  });

  return text;
}

async function compressSessionHistory(
  session: Session,
  keepRecentMessages: number = 6
): Promise<Session> {
  const systemMessages = session.history.filter(m => m.role === "system");
  const nonSystem      = session.history.filter(m => m.role !== "system");

  if (nonSystem.length <= keepRecentMessages) return session; // no compression needed

  const oldMessages    = nonSystem.slice(0, -keepRecentMessages);
  const recentMessages = nonSystem.slice(-keepRecentMessages);

  const summary = await summariseHistory(oldMessages);

  const summaryMessage: CoreMessage = {
    role: "system",
    content: `[Conversation summary — earlier context]: ${summary}`,
  };

  return {
    ...session,
    history: [...systemMessages, summaryMessage, ...recentMessages],
  };
}
```

---

## 8.6 Session Metadata

Store structured facts alongside the message history. These can be referenced without putting them in the context window:

```typescript
interface CustomerSession extends Session {
  metadata: {
    customerName?: string;
    tier?: "standard" | "premium" | "enterprise";
    resolvedIntents?: string[];
    pendingActions?: string[];
    escalationReason?: string;
    totalMessages?: number;
  };
}

// Update metadata during the conversation
session.metadata.resolvedIntents = [
  ...(session.metadata.resolvedIntents ?? []),
  "order_status_A8812",
];
```

Session metadata is useful for:
- Analytics (which intents are most common?)
- Routing decisions (has this session been escalated before?)
- Personalisation (insert customer name into system prompt without re-querying the DB)

---

## 8.7 Context Carryover

A customer's second message should not require them to repeat context from the first:

```
Turn 1: "Where is order A8812?"
Agent: "Order A8812 is shipped, ETA 12 May."

Turn 2: "Can I change the delivery address?"
— Without session memory: agent doesn't know which order
— With session memory: agent knows they're talking about A8812
```

Make this explicit in your system prompt:
```
You have access to the conversation history above. Do not ask the customer to repeat
information they have already provided. If an order ID was mentioned earlier,
use it without asking again.
```

---

## 8.8 Session Expiry and Cleanup

Sessions should expire after a period of inactivity:

```typescript
const SESSION_TTL_HOURS = 24;

function isSessionExpired(session: Session): boolean {
  const ageMs = Date.now() - new Date(session.updatedAt).getTime();
  const ageHours = ageMs / (1000 * 60 * 60);
  return ageHours > SESSION_TTL_HOURS;
}

async function getOrCreateSession(
  sessionId: string | null,
  customerId: string
): Promise<Session> {
  if (sessionId) {
    const existing = await loadSession(sessionId);
    if (existing && !isSessionExpired(existing)) {
      return existing;
    }
  }
  return createSession(customerId, CUSTOMER_SERVICE_SYSTEM_PROMPT);
}
```

---

## 8.9 In-Memory Session Store (for development)

For local development without a database:

```typescript
const sessions = new Map<string, Session>();

const devSessionStore = {
  load: (id: string) => sessions.get(id) ?? null,
  save: (session: Session) => { sessions.set(session.id, session); },
};
```

In production, replace with Supabase, Redis, or any key-value store.

---

## 8.10 Cost Awareness — Session Memory

| Scenario | Token cost per turn |
|----------|---------------------|
| No history (stateless) | ~100–300 tokens |
| 5-turn history | ~500–1500 tokens |
| 20-turn history | ~2000–6000 tokens |
| 20-turn + summarisation | ~500–1000 tokens |

Session memory multiplies LLM costs. A 20-turn conversation without summarisation can cost 10× a stateless call. Always:
1. Set a `keepRecentMessages` limit
2. Summarise history beyond that limit
3. Use prompt caching to offset the cost of repeated system prompt + summary tokens

---

## Chapter Summary

| Concept | Key point |
|---------|-----------|
| In-context memory | The message array — visible to model, disappears when process ends |
| Session memory | Persist history in DB, keyed by session ID |
| Summarisation | Compress old turns to control token cost |
| Session metadata | Structured facts alongside history — no context window cost |
| Context carryover | System prompt + history eliminates repeat-yourself UX |
| Session expiry | TTL-based cleanup prevents stale sessions accumulating |

---

*Next: Chapter 9 — Streaming Responses*
