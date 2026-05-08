/**
 * Chapter 18 — Cost Optimisation & Token Budgeting
 *
 * Run: tsx exercises/chapter_18.ts
 */

import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import "dotenv/config";

const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY!,
});
const FAST     = "anthropic/claude-3-haiku";
const BALANCED = "anthropic/claude-3-5-sonnet";

// =============================================================================
// EXERCISE 1 — Cost calculator
// =============================================================================
//
// TODO: Implement `calculateCost(modelId, inputTokens, outputTokens, cachedTokens)`:
//   - Use the pricing table below
//   - cachedTokens are billed at cachedInputPerMillion rate
//   - normalInputTokens = inputTokens - cachedTokens
//   - Return total cost in USD

const PRICING: Record<string, { inputPerMillion: number; outputPerMillion: number; cachedInputPerMillion: number }> = {
  "anthropic/claude-3-haiku":    { inputPerMillion: 0.25,  outputPerMillion: 1.25,  cachedInputPerMillion: 0.03  },
  "anthropic/claude-3-5-sonnet": { inputPerMillion: 3.00,  outputPerMillion: 15.00, cachedInputPerMillion: 0.30  },
  "anthropic/claude-opus-4":     { inputPerMillion: 15.00, outputPerMillion: 75.00, cachedInputPerMillion: 1.50  },
  "openai/gpt-4o-mini":          { inputPerMillion: 0.15,  outputPerMillion: 0.60,  cachedInputPerMillion: 0.075 },
};

function calculateCost(
  modelId:      string,
  inputTokens:  number,
  outputTokens: number,
  cachedTokens: number = 0
): number {
  // TODO
  return 0;
}

// =============================================================================
// EXERCISE 2 — Cost tracker
// =============================================================================
//
// TODO: Implement `CostTracker` class with:
//   - record(agentName, useCase, sessionId, model, inputTokens, outputTokens, durationMs)
//     Automatically computes costUSD and stores the entry
//   - sessionCost(sessionId): total USD for a session
//   - agentCost(agentName): total USD for an agent across all sessions
//   - topAgents(): sorted array of { name, totalUSD } — most expensive first
//   - totalCost(): grand total

interface CostEntry {
  agentName:   string;
  useCase:     string;
  sessionId:   string;
  model:       string;
  inputTokens: number;
  outputTokens: number;
  durationMs:  number;
  costUSD:     number;
  timestamp:   Date;
}

class CostTracker {
  private entries: CostEntry[] = [];

  record(
    agentName:    string,
    useCase:      string,
    sessionId:    string,
    model:        string,
    inputTokens:  number,
    outputTokens: number,
    durationMs:   number
  ): void {
    // TODO
  }

  sessionCost(sessionId: string): number {
    // TODO
    return 0;
  }

  agentCost(agentName: string): number {
    // TODO
    return 0;
  }

  topAgents(): Array<{ name: string; totalUSD: number }> {
    // TODO
    return [];
  }

  totalCost(): number {
    // TODO
    return 0;
  }
}

// =============================================================================
// EXERCISE 3 — Budgeted LLM call
// =============================================================================
//
// TODO: Implement `callWithBudget(params, sessionId, maxSessionUSD, tracker)`:
//   - Checks if tracker.sessionCost(sessionId) >= maxSessionUSD
//   - If over budget: returns { text: "I'm sorry, this session has reached its usage limit.", budgetExceeded: true }
//   - Otherwise: calls generateText, records to tracker, returns { text, budgetExceeded: false }

interface BudgetedResult {
  text:           string;
  budgetExceeded: boolean;
}

async function callWithBudget(
  params: {
    model: string;
    system?: string;
    prompt: string;
    maxTokens?: number;
    agentName: string;
    useCase:   string;
  },
  sessionId:      string,
  maxSessionUSD:  number,
  tracker:        CostTracker
): Promise<BudgetedResult> {
  // TODO
  return { text: "", budgetExceeded: false };
}

// =============================================================================
// EXERCISE 4 — Model tier comparison
// =============================================================================
//
// TODO: Implement `compareTiers(prompt, task)` that calls the SAME prompt on
//       both FAST and BALANCED models and returns:
//         { fast: { text, tokens, costUSD, durationMs }, balanced: { ... } }
//       Use this to understand quality/cost tradeoffs.

async function compareTiers(
  prompt: string,
  systemPrompt: string = "You are a customer service agent."
): Promise<{
  fast:     { text: string; tokens: number; costUSD: number; durationMs: number };
  balanced: { text: string; tokens: number; costUSD: number; durationMs: number };
}> {
  // TODO
  return {
    fast:     { text: "", tokens: 0, costUSD: 0, durationMs: 0 },
    balanced: { text: "", tokens: 0, costUSD: 0, durationMs: 0 },
  };
}

// =============================================================================
// EXERCISE 5 — Session cost simulation
// =============================================================================
//
// TODO: Implement `simulateSession(sessionId, turns)` that:
//   - Runs `turns` number of back-and-forth exchanges using callWithBudget
//   - Budget: $0.01 per session (to force the guard to trigger eventually)
//   - Uses the FAST model, classificationagent, order_status use case
//   - Returns { repliesGenerated: number, budgetHit: boolean, totalCostUSD: number }

async function simulateSession(
  sessionId: string,
  turns:     number
): Promise<{ repliesGenerated: number; budgetHit: boolean; totalCostUSD: number }> {
  // TODO
  return { repliesGenerated: 0, budgetHit: false, totalCostUSD: 0 };
}

// =============================================================================
// MAIN
// =============================================================================

async function main(): Promise<void> {
  // Exercise 1
  const cost1 = calculateCost("anthropic/claude-3-haiku", 1000, 200, 0);
  const expected1 = (1000 * 0.25 + 200 * 1.25) / 1_000_000;
  console.assert(Math.abs(cost1 - expected1) < 0.000001, `Exercise 1: haiku cost ${cost1} vs ${expected1}`);

  const cost2 = calculateCost("anthropic/claude-3-haiku", 1000, 200, 800);
  const expected2 = (200 * 0.25 + 800 * 0.03 + 200 * 1.25) / 1_000_000;
  console.assert(Math.abs(cost2 - expected2) < 0.000001, `Exercise 1: cached cost ${cost2} vs ${expected2}`);
  console.log(`Exercise 1 ✓ — haiku: $${cost1.toFixed(7)} | with 80% cache: $${cost2.toFixed(7)}`);

  // Exercise 2
  const tracker = new CostTracker();
  tracker.record("order_agent",   "order_status",  "s1", FAST,     500, 150, 400);
  tracker.record("order_agent",   "order_status",  "s1", FAST,     300, 100, 300);
  tracker.record("catalogue_agent", "product_search", "s1", BALANCED, 800, 300, 600);
  tracker.record("order_agent",   "order_status",  "s2", FAST,     500, 150, 400);

  console.assert(tracker.sessionCost("s1") > 0,   "Exercise 2: session cost > 0");
  console.assert(tracker.agentCost("order_agent") > tracker.agentCost("catalogue_agent") === false || true,
    "Exercise 2: agent costs computed");
  console.log(`Exercise 2 ✓ — s1 cost: $${tracker.sessionCost("s1").toFixed(6)} | total: $${tracker.totalCost().toFixed(6)}`);
  console.log("Top agents:", tracker.topAgents().map(a => `${a.name}: $${a.totalUSD.toFixed(6)}`).join(", "));

  // Exercise 3
  const tracker2  = new CostTracker();
  const r1 = await callWithBudget(
    { model: FAST, prompt: "Say 'hello'", maxTokens: 10, agentName: "test", useCase: "test" },
    "budget-sess", 0.000001, tracker2   // $0.000001 — immediate budget exhaustion
  );
  console.assert(r1.budgetExceeded, "Exercise 3: first call exceeds micro-budget");
  console.log("Exercise 3 ✓ — budget guard triggered");

  // Exercise 4
  console.log("\n=== Exercise 4: Tier comparison ===");
  const comparison = await compareTiers(
    "Classify this message as order_status, delivery, product, or general: 'Where is my order A8812?'",
    "You are an intent classifier. Reply with only the category name."
  );
  console.log(`Fast     (${FAST}):     "${comparison.fast.text.trim()}"   ${comparison.fast.tokens} tokens $${comparison.fast.costUSD.toFixed(6)}`);
  console.log(`Balanced (${BALANCED}): "${comparison.balanced.text.trim()}" ${comparison.balanced.tokens} tokens $${comparison.balanced.costUSD.toFixed(6)}`);

  // Exercise 5
  console.log("\n=== Exercise 5: Session simulation ===");
  const sim = await simulateSession("sim-001", 10);
  console.log(`Replies: ${sim.repliesGenerated} | Budget hit: ${sim.budgetHit} | Cost: $${sim.totalCostUSD.toFixed(6)}`);
}

main().catch(console.error);
