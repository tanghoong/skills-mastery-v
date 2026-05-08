/**
 * Chapter 2 — OpenRouter Setup & Model Routing
 *
 * Run: tsx exercises/chapter_02.ts
 *
 * Prerequisites:
 *   npm install ai @ai-sdk/openai zod dotenv
 *   cp .env.example .env   # then add your OPENROUTER_API_KEY
 */

import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import "dotenv/config";

// =============================================================================
// SETUP — shared client (do not modify)
// =============================================================================

if (!process.env.OPENROUTER_API_KEY) {
  throw new Error(
    "OPENROUTER_API_KEY is not set.\nCreate a .env file with: OPENROUTER_API_KEY=sk-or-v1-..."
  );
}

const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  headers: {
    "HTTP-Referer": "https://harness-agent.local",
    "X-Title": "Harness Agentic Course",
  },
});

// Model tiers — use these throughout the course
export const MODELS = {
  fast:     "anthropic/claude-3-haiku"    as const,
  balanced: "anthropic/claude-3-5-sonnet" as const,
  powerful: "anthropic/claude-opus-4"     as const,
} satisfies Record<string, string>;

// =============================================================================
// EXERCISE 1 — Your first OpenRouter call
// =============================================================================
//
// TODO: Call generateText with the "fast" model tier.
//       Prompt: "Name one benefit of using an LLM router like OpenRouter. One sentence."
//       Log the response text to the console.

async function exercise1(): Promise<void> {
  // TODO
}

// =============================================================================
// EXERCISE 2 — Capture and log usage metadata
// =============================================================================
//
// TODO: Call generateText with the "fast" model.
//       Prompt: "What is prompt caching? One sentence."
//       Destructure `usage` from the result and log:
//         - promptTokens
//         - completionTokens
//         - totalTokens

async function exercise2(): Promise<void> {
  // TODO
}

// =============================================================================
// EXERCISE 3 — Model routing by task type
// =============================================================================
//
// TODO: Implement `routedCall(task, prompt)` that:
//   - Uses the "fast" model   when task === "classify" or task === "extract"
//   - Uses the "balanced" model when task === "synthesise" or task === "draft"
//   - Uses the "powerful" model when task === "analyse"
//   - Returns the response text
//
// Accepted task values: "classify" | "extract" | "synthesise" | "draft" | "analyse"

type TaskType = "classify" | "extract" | "synthesise" | "draft" | "analyse";

async function routedCall(task: TaskType, prompt: string): Promise<string> {
  // TODO
  return "";
}

// =============================================================================
// EXERCISE 4 — Cost estimator
// =============================================================================
//
// Pricing table (per million tokens, approximate as of 2025):
const PRICING: Record<string, { input: number; output: number }> = {
  "anthropic/claude-3-haiku":    { input: 0.25,  output: 1.25  },
  "anthropic/claude-3-5-sonnet": { input: 3.00,  output: 15.00 },
  "anthropic/claude-opus-4":     { input: 15.00, output: 75.00 },
};

// TODO: Implement `calculateCallCost(modelId, inputTokens, outputTokens)`
//       Returns the cost in USD as a number, or throws if the model is unknown.

function calculateCallCost(
  modelId: string,
  inputTokens: number,
  outputTokens: number
): number {
  // TODO
  return 0;
}

// =============================================================================
// EXERCISE 5 — Model fallback
// =============================================================================
//
// TODO: Implement `callWithFallback(prompt, preferredModel, fallbackModel)`.
//       Try the preferredModel first. If it throws, try the fallbackModel.
//       If the fallback also throws, re-throw the last error.
//       Return the response text.

async function callWithFallback(
  prompt: string,
  preferredModel: string,
  fallbackModel: string
): Promise<string> {
  // TODO
  return "";
}

// =============================================================================
// MAIN — run all exercises
// =============================================================================

async function main(): Promise<void> {
  console.log("=== Exercise 1: First call ===");
  await exercise1();

  console.log("\n=== Exercise 2: Usage metadata ===");
  await exercise2();

  console.log("\n=== Exercise 3: Model routing ===");
  const classifyResult = await routedCall(
    "classify",
    "Classify: 'Where is order #1234?' — one word answer: order_status, delivery, product, or general"
  );
  console.log("Classify result:", classifyResult.trim());

  console.log("\n=== Exercise 4: Cost estimator ===");
  const cost = calculateCallCost("anthropic/claude-3-haiku", 1500, 200);
  console.log(`Cost for 1500 input + 200 output (haiku): $${cost.toFixed(6)}`);

  console.log("\n=== Exercise 5: Fallback ===");
  const result = await callWithFallback(
    "Say 'fallback works' and nothing else.",
    MODELS.fast,
    MODELS.balanced
  );
  console.log("Fallback result:", result.trim());
}

main().catch(console.error);
