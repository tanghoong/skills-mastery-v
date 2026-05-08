/**
 * Chapter 5 — The Agent Loop — ReAct Pattern
 *
 * Run: tsx exercises/chapter_05.ts
 */

import { generateText, tool } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import type { CoreMessage, CoreAssistantMessage, CoreToolMessage } from "ai";
import { z } from "zod";
import "dotenv/config";

const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY!,
});
const FAST     = "anthropic/claude-3-haiku";
const BALANCED = "anthropic/claude-3-5-sonnet";

// =============================================================================
// MOCK TOOLS (re-used from Ch. 4 pattern)
// =============================================================================

const mockOrders: Record<string, object> = {
  "A8812": { status: "shipped",    eta: "2026-05-12", carrier: "ups",   tracking: "1Z999AA1" },
  "B4401": { status: "processing", eta: null,         carrier: null,    tracking: null       },
};

const lookupOrder = tool({
  description: "Look up order status by order ID",
  parameters: z.object({ orderId: z.string().describe("Order ID e.g. 'A8812'") }),
  execute: async ({ orderId }) => {
    const order = mockOrders[orderId.toUpperCase()];
    return order ? JSON.stringify(order) : JSON.stringify({ error: "Order not found" });
  },
});

const checkDelivery = tool({
  description: "Check delivery tracking for a shipped order",
  parameters: z.object({
    tracking: z.string().describe("Tracking number"),
    carrier:  z.enum(["ups", "fedex", "dhl"]),
  }),
  execute: async ({ tracking, carrier }) => {
    if (carrier === "dhl") return JSON.stringify({ error: "DHL service temporarily unavailable" });
    return JSON.stringify({ status: "In transit", location: "Sydney facility", eta: "2026-05-12" });
  },
});

const tools = { lookupOrder, checkDelivery };

// =============================================================================
// EXERCISE 1 — Run the built-in SDK loop and print the ReAct trace
// =============================================================================
//
// TODO: Implement `runWithTrace(userMessage)` that:
//   - Uses the BALANCED model
//   - Has a simple customer service system prompt
//   - Provides both tools
//   - Sets maxSteps: 8
//   - Iterates result.steps and prints:
//       For each tool call step: "→ [toolName] args: ..."
//       For each tool result:    "← result: ..."
//       For the final text step: "✓ Answer: ..."
//   - Returns the final text

async function runWithTrace(userMessage: string): Promise<string> {
  // TODO
  return "";
}

// =============================================================================
// EXERCISE 2 — Build a custom agent loop with cost guard
// =============================================================================
//
// TODO: Implement `runCustomLoop(userMessage, maxIterations, maxCostUSD)` that:
//   - Starts with a system + user message
//   - Loops: call LLM (maxSteps: 1), check termination, execute tools, append results
//   - Terminates when: model produces text-only response, OR iterations exceeded,
//     OR estimatedCost > maxCostUSD
//   - Estimates cost using: (promptTokens * 0.25 + completionTokens * 1.25) / 1_000_000
//     (haiku pricing)
//   - Returns { answer: string, iterations: number, estimatedCostUSD: number }

interface LoopResult {
  answer: string;
  iterations: number;
  estimatedCostUSD: number;
}

async function runCustomLoop(
  userMessage: string,
  maxIterations: number = 8,
  maxCostUSD: number = 0.05
): Promise<LoopResult> {
  // TODO
  return { answer: "", iterations: 0, estimatedCostUSD: 0 };
}

// =============================================================================
// EXERCISE 3 — Parallel tool call detection
// =============================================================================
//
// TODO: Implement `countParallelToolCalls(userMessage)` that:
//   - Runs generateText with both tools, maxSteps: 5
//   - Iterates result.steps and counts how many steps had > 1 tool call
//   - Returns { totalSteps: number, parallelSteps: number }
//
// Test it with a message that asks about TWO different orders at once —
// the model may issue parallel lookupOrder calls.

async function countParallelToolCalls(
  userMessage: string
): Promise<{ totalSteps: number; parallelSteps: number }> {
  // TODO
  return { totalSteps: 0, parallelSteps: 0 };
}

// =============================================================================
// EXERCISE 4 — Max iteration guard
// =============================================================================
//
// TODO: Implement `runWithIterationGuard(userMessage, maxIterations)` that:
//   - Wraps runCustomLoop
//   - If the loop hits maxIterations without finishing, returns a graceful
//     fallback message: "I'm sorry, I wasn't able to complete this request.
//     Please try rephrasing or contact support."
//   - Returns the answer string

async function runWithIterationGuard(
  userMessage: string,
  maxIterations: number = 3
): Promise<string> {
  // TODO
  return "";
}

// =============================================================================
// MAIN
// =============================================================================

async function main(): Promise<void> {
  console.log("=== Exercise 1: ReAct trace ===");
  const trace = await runWithTrace(
    "I need to know the status of order A8812 and where exactly it is in transit."
  );
  console.log("\nFinal answer:", trace.trim());

  console.log("\n=== Exercise 2: Custom loop with cost guard ===");
  const loopResult = await runCustomLoop(
    "Where is order A8812?",
    8,
    0.05
  );
  console.log(`Answer: ${loopResult.answer.trim()}`);
  console.log(`Iterations used: ${loopResult.iterations}`);
  console.log(`Estimated cost: $${loopResult.estimatedCostUSD.toFixed(6)}`);

  console.log("\n=== Exercise 3: Parallel tool calls ===");
  const parallel = await countParallelToolCalls(
    "Can you check both order A8812 and order B4401 at the same time?"
  );
  console.log(`Total steps: ${parallel.totalSteps}, Steps with parallel calls: ${parallel.parallelSteps}`);

  console.log("\n=== Exercise 4: Iteration guard ===");
  const guarded = await runWithIterationGuard(
    "Where is order A8812?",
    2   // intentionally low to test guard
  );
  console.log("Guarded result:", guarded.trim());
}

main().catch(console.error);
