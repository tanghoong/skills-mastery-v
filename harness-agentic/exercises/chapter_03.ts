/**
 * Chapter 3 — The Claude API & Message Structure
 *
 * Run: tsx exercises/chapter_03.ts
 */

import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import type { CoreMessage } from "ai";
import "dotenv/config";

const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY!,
});
const FAST_MODEL = "anthropic/claude-3-haiku";

// =============================================================================
// EXERCISE 1 — Build history helpers
// =============================================================================
//
// TODO: Implement these three pure functions (no mutation):
//   createHistory(systemPrompt)  → CoreMessage[] with one system message
//   addUserMessage(history, content) → new array with user message appended
//   addAssistantMessage(history, content) → new array with assistant message appended

function createHistory(systemPrompt: string): CoreMessage[] {
  // TODO
  return [];
}

function addUserMessage(history: CoreMessage[], content: string): CoreMessage[] {
  // TODO
  return history;
}

function addAssistantMessage(history: CoreMessage[], content: string): CoreMessage[] {
  // TODO
  return history;
}

// =============================================================================
// EXERCISE 2 — Multi-turn chat
// =============================================================================
//
// TODO: Implement `chat(history, userInput)` that:
//   1. Appends the user message to history
//   2. Calls generateText with maxTokens: 200, temperature: 0.1
//   3. Returns { reply: string, history: CoreMessage[] } where history includes
//      the assistant reply appended

async function chat(
  history: CoreMessage[],
  userInput: string
): Promise<{ reply: string; history: CoreMessage[] }> {
  // TODO
  return { reply: "", history };
}

// =============================================================================
// EXERCISE 3 — Sliding window history trim
// =============================================================================
//
// TODO: Implement `trimHistory(history, maxNonSystemMessages)` that:
//   - Keeps ALL system messages (there may be more than one)
//   - Keeps only the LAST maxNonSystemMessages non-system messages
//   - Returns a new array in the correct order: system messages first, then trimmed history

function trimHistory(history: CoreMessage[], maxNonSystemMessages: number): CoreMessage[] {
  // TODO
  return history;
}

// =============================================================================
// EXERCISE 4 — Token estimation
// =============================================================================
//
// A rough rule of thumb: 1 token ≈ 4 characters.
// TODO: Implement `estimateTokens(history)` that estimates the total token count
//       for a conversation history by summing all content lengths divided by 4,
//       rounding up to the nearest integer.

function estimateTokens(history: CoreMessage[]): number {
  // TODO
  return 0;
}

// =============================================================================
// EXERCISE 5 — Build a customer service system prompt
// =============================================================================
//
// TODO: Write a `buildSystemPrompt(agentName, companyName, capabilities)` function
//       that returns a formatted system prompt string covering:
//         - Agent identity (name + company)
//         - Capabilities (from the array)
//         - At least two hard constraints
//         - Tone guidelines
//
// The returned string should be non-empty and mention the agentName and companyName.

function buildSystemPrompt(
  agentName: string,
  companyName: string,
  capabilities: string[]
): string {
  // TODO
  return "";
}

// =============================================================================
// MAIN
// =============================================================================

async function main(): Promise<void> {
  // Exercise 1 — verify history helpers
  const h0 = createHistory("You are a helpful assistant.");
  console.assert(h0.length === 1 && h0[0].role === "system", "Exercise 1: createHistory");

  const h1 = addUserMessage(h0, "Hello");
  console.assert(h1.length === 2 && h1[1].role === "user", "Exercise 1: addUserMessage");
  console.assert(h0.length === 1, "Exercise 1: original history must be immutable");

  const h2 = addAssistantMessage(h1, "Hi there!");
  console.assert(h2.length === 3 && h2[2].role === "assistant", "Exercise 1: addAssistantMessage");

  // Exercise 3 — trim
  const longHistory = createHistory("System");
  let h = longHistory;
  for (let i = 0; i < 10; i++) {
    h = addUserMessage(h, `Turn ${i}`);
    h = addAssistantMessage(h, `Reply ${i}`);
  }
  const trimmed = trimHistory(h, 4);
  const nonSystem = trimmed.filter(m => m.role !== "system");
  console.assert(nonSystem.length === 4, `Exercise 3: expected 4 non-system messages, got ${nonSystem.length}`);
  console.assert(trimmed[0].role === "system", "Exercise 3: system message must be first");

  // Exercise 4 — token estimate
  const sample: CoreMessage[] = [
    { role: "system", content: "You are helpful." },   // 16 chars → 4 tokens
    { role: "user",   content: "Hello there" },         // 11 chars → 3 tokens (ceil)
  ];
  const est = estimateTokens(sample);
  console.assert(est > 0, "Exercise 4: token estimate must be > 0");

  // Exercise 5 — system prompt
  const prompt = buildSystemPrompt("Aria", "Acme Corp", ["order lookup", "returns"]);
  console.assert(prompt.includes("Aria"),      "Exercise 5: must mention agent name");
  console.assert(prompt.includes("Acme Corp"), "Exercise 5: must mention company name");
  console.assert(prompt.length > 100,          "Exercise 5: prompt must be substantial");

  console.log("Exercises 1, 3, 4, 5 — all assertions passed.\n");

  // Exercise 2 — live multi-turn call
  console.log("=== Exercise 2: Multi-turn conversation ===");
  const systemPrompt = buildSystemPrompt("Aria", "Acme Corp", ["order lookup"]);
  let history = createHistory(systemPrompt);

  const t1 = await chat(history, "Hi! What is the capital of France?");
  console.log("Turn 1:", t1.reply.trim());
  history = t1.history;

  const t2 = await chat(history, "What is the population of that city?");
  console.log("Turn 2:", t2.reply.trim());

  console.log(`\nTotal messages in history: ${history.length}`);
  console.log(`Estimated tokens: ${estimateTokens(history)}`);
}

main().catch(console.error);
