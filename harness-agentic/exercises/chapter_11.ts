/**
 * Chapter 11 — Intent Detection & Conversation Routing
 *
 * Run: tsx exercises/chapter_11.ts
 */

import { generateObject, generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import "dotenv/config";

const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY!,
});
const FAST     = "anthropic/claude-3-haiku";
const BALANCED = "anthropic/claude-3-5-sonnet";

// =============================================================================
// EXERCISE 1 — Intent classification schema + classifier
// =============================================================================
//
// TODO: Define `IntentClassificationSchema` — a Zod object with:
//   - intents: array of objects, each with:
//       type: enum ["order_status", "delivery_tracking", "product_search", "compatibility", "return", "complaint", "general"]
//       confidence: number 0–1
//       entities: object with orderId, partNumber, modelCode, productQuery (all nullable strings)
//   - requiresHumanHandoff: boolean
//   - overallSentiment: enum ["positive", "neutral", "frustrated", "angry"]
//
// TODO: Implement `classifyIntents(message)` using generateObject + FAST model.
//       Return the typed result.

const IntentClassificationSchema = z.object({
  // TODO
});

type IntentClassification = z.infer<typeof IntentClassificationSchema>;

async function classifyIntents(message: string): Promise<IntentClassification> {
  // TODO
  return {} as IntentClassification;
}

// =============================================================================
// EXERCISE 2 — Mock sub-agents
// =============================================================================
//
// TODO: Implement these three mock async functions that simulate sub-agent responses.
//       Each should call generateText with the FAST model (maxTokens: 100) using a
//       brief, relevant system prompt and return the response.

async function orderStatusAgent(orderId: string): Promise<string> {
  // TODO — respond as if you looked up the order. If orderId is empty, ask for it.
  return "";
}

async function productSearchAgent(query: string): Promise<string> {
  // TODO — respond as if you searched the Acme Corp product catalogue
  return "";
}

async function generalAgent(query: string): Promise<string> {
  // TODO — respond as a general customer service agent
  return "";
}

// =============================================================================
// EXERCISE 3 — Parallel routing
// =============================================================================
//
// TODO: Implement `routeAndExecute(classification)` that:
//   - Filters intents with confidence >= 0.7
//   - For each high-confidence intent, calls the appropriate sub-agent:
//       order_status → orderStatusAgent(entities.orderId ?? "")
//       product_search / compatibility → productSearchAgent(entities.productQuery ?? entities.modelCode ?? "")
//       general / complaint → generalAgent(message for this intent)
//   - Executes ALL handler calls in PARALLEL using Promise.all
//   - Returns an array of { intentType: string, result: string }

type IntentResult = { intentType: string; result: string };

async function routeAndExecute(classification: IntentClassification): Promise<IntentResult[]> {
  // TODO
  return [];
}

// =============================================================================
// EXERCISE 4 — Response merger
// =============================================================================
//
// TODO: Implement `mergeResponses(originalMessage, results)` that:
//   - If results.length === 1, returns results[0].result directly
//   - If results.length > 1, calls generateText (BALANCED model, maxTokens: 350) to
//     merge the sub-agent results into a single coherent reply
//   - The merged reply should address all topics without repeating information
//   - Returns the final string

async function mergeResponses(
  originalMessage: string,
  results: IntentResult[]
): Promise<string> {
  // TODO
  return results[0]?.result ?? "";
}

// =============================================================================
// EXERCISE 5 — Full pipeline + performance measurement
// =============================================================================
//
// TODO: Implement `handleCustomerMessage(message)` that:
//   1. Classifies intents (track time taken)
//   2. If requiresHumanHandoff, returns "ESCALATE: [sentiment]"
//   3. Routes + executes in parallel (track time taken)
//   4. Merges responses (track time taken)
//   5. Returns { reply, metrics: { classifyMs, agentsMs, mergeMs, totalMs, intentsDetected: number } }

interface PipelineMetrics {
  classifyMs: number;
  agentsMs:   number;
  mergeMs:    number;
  totalMs:    number;
  intentsDetected: number;
}

async function handleCustomerMessage(
  message: string
): Promise<{ reply: string; metrics: PipelineMetrics }> {
  // TODO
  return {
    reply: "",
    metrics: { classifyMs: 0, agentsMs: 0, mergeMs: 0, totalMs: 0, intentsDetected: 0 },
  };
}

// =============================================================================
// MAIN
// =============================================================================

async function main(): Promise<void> {
  const messages = [
    "Where is order A8812?",
    "Do you have hinge replacements for the XR-200 door?",
    "I'm really frustrated! My order A8812 hasn't arrived AND the XR-200 hinge I ordered last month is broken. I want a refund!",
    "I need to cancel my order immediately! This is illegal!",
  ];

  for (const msg of messages) {
    console.log(`\n${"─".repeat(60)}`);
    console.log(`Customer: "${msg}"`);

    const { reply, metrics } = await handleCustomerMessage(msg);

    console.log(`Reply: ${reply.trim()}`);
    console.log(`Metrics: classify=${metrics.classifyMs}ms | agents=${metrics.agentsMs}ms | merge=${metrics.mergeMs}ms | total=${metrics.totalMs}ms | intents=${metrics.intentsDetected}`);
  }
}

main().catch(console.error);
