/**
 * Chapter 26 — The Hybrid Architecture: TypeScript Agents + Laravel API
 *
 * Run: tsx exercises/chapter_26.ts
 *
 * These exercises implement the TypeScript side of the hybrid architecture:
 * the internal agent service that Laravel forwards requests to.
 */

import { generateText, generateObject } from "ai";
import { tool } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import "dotenv/config";

const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey:  process.env.OPENROUTER_API_KEY!,
});

const MODELS = {
  fast:     "anthropic/claude-3-haiku",
  balanced: "anthropic/claude-3-5-sonnet",
};

// =============================================================================
// EXERCISE 1 — Internal authentication middleware (shared secret)
// =============================================================================
//
// TODO: Implement `validateInternalRequest(headers, secret)` that:
//   - Returns { authorized: true }  if headers["x-agent-secret"] === secret
//   - Returns { authorized: false, error: "Missing secret" }  if header absent
//   - Returns { authorized: false, error: "Invalid secret" }  if header wrong

interface InternalAuthResult {
  authorized: boolean;
  error?:     string;
}

function validateInternalRequest(
  headers: Record<string, string | undefined>,
  secret:  string
): InternalAuthResult {
  // TODO
  return { authorized: false, error: "Missing secret" };
}

// =============================================================================
// EXERCISE 2 — Redis-style session store (in-memory for exercises)
// =============================================================================
//
// In production this talks to Redis. Implement an in-memory stand-in:
//
// TODO: Implement `HybridSessionStore` class with:
//   - load(sessionId): ChatMessage[]       — returns [] if not found
//   - save(sessionId, history, ttlMs?): void  — trims to last 20 messages
//   - delete(sessionId): void

interface ChatMessage { role: "user" | "assistant" | "system"; content: string; }

class HybridSessionStore {
  // TODO
  load(_sessionId: string): ChatMessage[] { return []; }
  save(_sessionId: string, _history: ChatMessage[], _ttlMs?: number): void {}
  delete(_sessionId: string): void {}
}

// =============================================================================
// EXERCISE 3 — Internal agent handler (TypeScript side of the hybrid boundary)
// =============================================================================
//
// TODO: Implement `handleInternalChat(payload, secret, store)` that:
//   1. Calls validateInternalRequest(payload.headers, secret)
//      If not authorized: return { error: "Unauthorized", status: 401 }
//   2. Validates message length (> 5000 chars → { error: "Input too long", status: 422 })
//   3. Loads session history from store
//   4. Calls generateText with FAST model, maxTokens 300, including:
//      - System: "You are Aria, Acme Corp AI. Be concise."
//      - History messages
//      - User message
//   5. Appends user + assistant messages and saves back to store
//   6. Returns { reply: string, sessionId, status: 200 }

interface InternalChatPayload {
  headers:    Record<string, string | undefined>;
  message:    string;
  sessionId:  string;
  customerId: string;
}

async function handleInternalChat(
  payload: InternalChatPayload,
  secret:  string,
  store:   HybridSessionStore
): Promise<{ reply?: string; sessionId?: string; error?: string; status: number }> {
  // TODO
  return { error: "Not implemented", status: 500 };
}

// =============================================================================
// EXERCISE 4 — Health check response builder
// =============================================================================
//
// TODO: Implement `buildHealthResponse(agentServiceReachable?)` that:
//   Returns an object:
//   {
//     status: "ok" | "degraded",
//     service: "typescript-agent",
//     agentService: "ok" | "unreachable",
//     timestamp: ISO string (Date.now())
//   }
//   status = "ok" when agentServiceReachable === true (or undefined)
//   status = "degraded" when agentServiceReachable === false

function buildHealthResponse(agentServiceReachable?: boolean): {
  status:       "ok" | "degraded";
  service:      string;
  agentService: "ok" | "unreachable";
  timestamp:    string;
} {
  // TODO
  return {
    status:       "ok",
    service:      "typescript-agent",
    agentService: "ok",
    timestamp:    new Date().toISOString(),
  };
}

// =============================================================================
// EXERCISE 5 — Full hybrid request lifecycle simulation
// =============================================================================
//
// Simulate the full lifecycle described in section 26.8:
//
// TODO: Implement `simulateHybridLifecycle(message, sessionId, customerId)` that:
//   1. Simulates Laravel auth (checks a hardcoded JWT token = "valid-jwt")
//      — if token !== "valid-jwt": return { error: "Unauthorized at gateway" }
//   2. Validates input length (> 5000: return { error: "Input too long at gateway" })
//   3. Calls handleInternalChat (uses INTERNAL_SECRET = "test-secret")
//   4. Returns { reply, sessionId, costEstimate: 0.00001, traceId: "trace-" + sessionId }

const INTERNAL_SECRET = "test-secret";
const store = new HybridSessionStore();

async function simulateHybridLifecycle(
  message:    string,
  sessionId:  string,
  customerId: string,
  jwtToken:   string = "valid-jwt"
): Promise<{
  reply?:       string;
  sessionId?:   string;
  costEstimate?: number;
  traceId?:     string;
  error?:       string;
}> {
  // TODO
  return { error: "Not implemented" };
}

// =============================================================================
// MAIN
// =============================================================================

async function main(): Promise<void> {
  const SECRET = INTERNAL_SECRET;

  // Exercise 1 — internal auth
  const ok  = validateInternalRequest({ "x-agent-secret": SECRET }, SECRET);
  console.assert(ok.authorized === true,  "Exercise 1: correct secret authorized");

  const bad = validateInternalRequest({ "x-agent-secret": "wrong" }, SECRET);
  console.assert(bad.authorized === false, "Exercise 1: wrong secret denied");
  console.assert(bad.error === "Invalid secret", "Exercise 1: wrong error message");

  const missing = validateInternalRequest({}, SECRET);
  console.assert(missing.authorized === false,    "Exercise 1: missing header denied");
  console.assert(missing.error === "Missing secret", "Exercise 1: missing error message");
  console.log("Exercise 1 ✓ — internal auth correct");

  // Exercise 2 — session store
  const sessionStore = new HybridSessionStore();
  console.assert(sessionStore.load("s1").length === 0, "Exercise 2: empty session returns []");

  const hist: ChatMessage[] = [
    { role: "user",      content: "Hello" },
    { role: "assistant", content: "Hi there!" },
  ];
  sessionStore.save("s1", hist);
  console.assert(sessionStore.load("s1").length === 2, "Exercise 2: session saved and loaded");

  const longHistory: ChatMessage[] = Array.from({ length: 30 }, (_, i) => ({
    role: i % 2 === 0 ? "user" : "assistant",
    content: `msg ${i}`,
  }));
  sessionStore.save("s2", longHistory);
  console.assert(sessionStore.load("s2").length === 20, "Exercise 2: trimmed to 20 messages");

  sessionStore.delete("s1");
  console.assert(sessionStore.load("s1").length === 0, "Exercise 2: session deleted");
  console.log("Exercise 2 ✓ — session store correct");

  // Exercise 3 — internal chat handler
  console.log("\n=== Exercise 3: Internal chat handler ===");
  const authPayload: InternalChatPayload = {
    headers:    { "x-agent-secret": SECRET },
    message:    "Where is my order A8812?",
    sessionId:  "sess-hybrid-001",
    customerId: "cust-001",
  };
  const r1 = await handleInternalChat(authPayload, SECRET, sessionStore);
  console.log(`Reply: "${r1.reply?.slice(0, 80)}"`);
  console.assert(r1.status === 200,         "Exercise 3: status 200");
  console.assert(r1.reply !== undefined,    "Exercise 3: reply present");

  const unauth = await handleInternalChat(
    { ...authPayload, headers: { "x-agent-secret": "bad" } },
    SECRET, sessionStore
  );
  console.assert(unauth.status === 401, "Exercise 3: invalid secret → 401");

  const tooLong = await handleInternalChat(
    { ...authPayload, message: "a".repeat(5001) },
    SECRET, sessionStore
  );
  console.assert(tooLong.status === 422, "Exercise 3: too long → 422");
  console.log("Exercise 3 ✓ — internal handler correct");

  // Exercise 4 — health check
  const healthy = buildHealthResponse(true);
  console.assert(healthy.status === "ok",    "Exercise 4: reachable → ok");
  console.assert(healthy.service === "typescript-agent", "Exercise 4: service name");
  console.assert(healthy.timestamp.length > 0, "Exercise 4: timestamp present");

  const degraded = buildHealthResponse(false);
  console.assert(degraded.status === "degraded",     "Exercise 4: unreachable → degraded");
  console.assert(degraded.agentService === "unreachable", "Exercise 4: agentService unreachable");
  console.log("Exercise 4 ✓ — health response correct");

  // Exercise 5 — full lifecycle
  console.log("\n=== Exercise 5: Full hybrid lifecycle ===");
  const lifecycle = await simulateHybridLifecycle(
    "Where is order A8812?", "sess-lifecycle-001", "cust-001"
  );
  console.log(`Reply: "${lifecycle.reply?.slice(0, 80)}"`);
  console.assert(!lifecycle.error,          "Exercise 5: no error on valid request");
  console.assert(lifecycle.reply !== undefined, "Exercise 5: reply present");
  console.assert(lifecycle.traceId !== undefined, "Exercise 5: traceId present");

  const authFail = await simulateHybridLifecycle(
    "Hello", "sess-002", "cust-001", "bad-jwt"
  );
  console.assert(authFail.error !== undefined, "Exercise 5: bad JWT blocked at gateway");
  console.log("Exercise 5 ✓ — hybrid lifecycle correct");
}

main().catch(console.error);
