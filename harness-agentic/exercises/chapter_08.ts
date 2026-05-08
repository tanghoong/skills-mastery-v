/**
 * Chapter 8 — Memory Patterns & Session Management
 *
 * Run: tsx exercises/chapter_08.ts
 *
 * This chapter uses an in-memory session store (no DB required).
 */

import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import type { CoreMessage } from "ai";
import "dotenv/config";

const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY!,
});
const FAST = "anthropic/claude-3-haiku";

// =============================================================================
// TYPES
// =============================================================================

interface Session {
  id: string;
  customerId: string;
  history: CoreMessage[];
  createdAt: Date;
  updatedAt: Date;
  metadata: {
    customerName?: string;
    tier?: "standard" | "premium" | "enterprise";
    resolvedIntents?: string[];
    pendingActions?: string[];
    messageCount?: number;
  };
}

// =============================================================================
// EXERCISE 1 — In-memory session store
// =============================================================================
//
// TODO: Implement a `SessionStore` class with:
//   - private map: Map<string, Session>
//   - load(id: string): Session | null
//   - save(session: Session): void
//   - delete(id: string): void
//   - list(): Session[]

class SessionStore {
  // TODO
  load(_id: string): Session | null { return null; }
  save(_session: Session): void {}
  delete(_id: string): void {}
  list(): Session[] { return []; }
}

// =============================================================================
// EXERCISE 2 — Session lifecycle helpers
// =============================================================================
//
// TODO: Implement `createSession(store, customerId, systemPrompt)` that:
//   - Creates a new Session with a UUID id (use crypto.randomUUID())
//   - Sets history to [{role:"system", content: systemPrompt}]
//   - Saves to store and returns the session
//
// TODO: Implement `isSessionExpired(session, ttlHours)` that returns true
//       if session.updatedAt is older than ttlHours hours.
//
// TODO: Implement `getOrCreateSession(store, sessionId, customerId, systemPrompt)`
//       that loads an existing non-expired session or creates a new one.

function createSession(
  store: SessionStore,
  customerId: string,
  systemPrompt: string
): Session {
  // TODO
  return {} as Session;
}

function isSessionExpired(session: Session, ttlHours: number = 24): boolean {
  // TODO
  return false;
}

function getOrCreateSession(
  store: SessionStore,
  sessionId: string | null,
  customerId: string,
  systemPrompt: string
): Session {
  // TODO
  return {} as Session;
}

// =============================================================================
// EXERCISE 3 — Session-aware chat
// =============================================================================
//
// TODO: Implement `chatWithSession(store, sessionId, customerId, userMessage)`
//       that:
//   1. Loads or creates a session
//   2. Appends the user message to history
//   3. Calls generateText with FAST model, maxTokens: 200, temperature: 0.1
//   4. Appends the assistant reply to history
//   5. Increments session.metadata.messageCount
//   6. Updates session.updatedAt
//   7. Saves the session
//   8. Returns { reply: string, sessionId: string }

const SYSTEM_PROMPT = `You are Aria, Acme Corp customer service AI.
Remember context from previous messages. Do not ask for information already provided.
Be concise (max 2 sentences).`;

async function chatWithSession(
  store: SessionStore,
  sessionId: string | null,
  customerId: string,
  userMessage: string
): Promise<{ reply: string; sessionId: string }> {
  // TODO
  return { reply: "", sessionId: "" };
}

// =============================================================================
// EXERCISE 4 — Conversation summarisation
// =============================================================================
//
// TODO: Implement `summariseConversation(history)` that:
//   - Filters out system messages
//   - Formats remaining messages as "role: content"
//   - Calls generateText to produce a 2-3 sentence summary
//   - Returns the summary string
//   - Use FAST model, maxTokens: 120

async function summariseConversation(history: CoreMessage[]): Promise<string> {
  // TODO
  return "";
}

// TODO: Implement `compressSession(store, sessionId, keepRecentMessages)` that:
//   - Loads the session
//   - If non-system history ≤ keepRecentMessages, returns without changes
//   - Otherwise: summarises old messages, adds a system message with the summary,
//     keeps only the last keepRecentMessages non-system messages
//   - Saves and returns the updated session

async function compressSession(
  store: SessionStore,
  sessionId: string,
  keepRecentMessages: number = 6
): Promise<Session | null> {
  // TODO
  return null;
}

// =============================================================================
// EXERCISE 5 — Context carryover test
// =============================================================================
//
// This exercise verifies that the model uses session history correctly.
// TODO: Implement `testContextCarryover(store)` that:
//   1. Creates a session and sends: "My name is Alice and I'm checking on order A8812"
//   2. Sends a follow-up: "Can I change the delivery address for it?"
//   3. Sends another follow-up: "What's my name again?"
//   4. Logs all three replies — verify the model knows the order and name without being told again
//   5. Returns the three replies as { turn1, turn2, turn3 }

async function testContextCarryover(
  store: SessionStore
): Promise<{ turn1: string; turn2: string; turn3: string }> {
  // TODO
  return { turn1: "", turn2: "", turn3: "" };
}

// =============================================================================
// MAIN
// =============================================================================

async function main(): Promise<void> {
  const store = new SessionStore();

  // Exercise 1 — session store
  const sess1 = createSession(store, "cust-001", "You are helpful.");
  console.assert(store.load(sess1.id) !== null, "Exercise 1: save and load works");
  console.assert(store.list().length === 1,      "Exercise 1: list returns 1 session");
  console.log("Exercise 1 ✓ — SessionStore working");

  // Exercise 2 — expiry
  const freshSession   = createSession(store, "cust-002", "Prompt");
  const expiredSession = { ...freshSession, updatedAt: new Date(Date.now() - 25 * 3600 * 1000) };
  console.assert(!isSessionExpired(freshSession,   24), "Exercise 2: fresh session not expired");
  console.assert( isSessionExpired(expiredSession, 24), "Exercise 2: old session is expired");
  console.log("Exercise 2 ✓ — expiry logic correct");

  // Exercise 3 — session-aware chat
  console.log("\n=== Exercise 3: Session-aware chat ===");
  let result = await chatWithSession(store, null, "cust-003", "Hi! Where is order A8812?");
  console.log("Turn 1:", result.reply.trim());
  const sid = result.sessionId;

  result = await chatWithSession(store, sid, "cust-003", "Can I change the delivery address?");
  console.log("Turn 2:", result.reply.trim());

  const session = store.load(sid)!;
  console.log("Message count:", session.metadata.messageCount);

  // Exercise 4 — summarisation
  console.log("\n=== Exercise 4: Summarisation ===");
  const summary = await summariseConversation(session.history);
  console.log("Summary:", summary.trim());

  const compressed = await compressSession(store, sid, 2);
  console.log("Compressed history length:", compressed?.history.length);

  // Exercise 5 — context carryover
  console.log("\n=== Exercise 5: Context carryover ===");
  const carryover = await testContextCarryover(store);
  console.log("Turn 1:", carryover.turn1.trim());
  console.log("Turn 2:", carryover.turn2.trim());
  console.log("Turn 3:", carryover.turn3.trim());
}

main().catch(console.error);
