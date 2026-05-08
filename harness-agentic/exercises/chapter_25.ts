/**
 * Chapter 25 — Laravel as Agent Orchestrator
 *
 * Run: tsx exercises/chapter_25.ts
 *
 * These exercises mirror PHP agent patterns (ReAct loop, tool dispatch,
 * background job state machine, cost tracking) in TypeScript so you can
 * verify your understanding before implementing in Laravel.
 */

import { generateText } from "ai";
import { tool } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import "dotenv/config";

const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey:  process.env.OPENROUTER_API_KEY!,
});

const FAST = "anthropic/claude-3-haiku";

// =============================================================================
// EXERCISE 1 — PHP-style tool registry
// =============================================================================
//
// In PHP, tools are: { definition: JSONSchema, callable: (args) => any }
// Implement a TypeScript equivalent:
//
// TODO: Implement `ToolRegistry` class with:
//   - register(name, description, paramsSchema, fn): void
//     where paramsSchema is a plain object (not Zod) describing parameter shapes
//   - execute(name, args): Promise<unknown>
//     — throws if name not found
//     — calls the registered fn(args) and returns result
//   - names(): string[]  — list of registered tool names
//   - toAiSdkTools(): Record<string, ReturnType<typeof tool>>
//     — converts the registry to Vercel AI SDK tool format for generateText

type ToolFn = (args: Record<string, unknown>) => unknown | Promise<unknown>;

class ToolRegistry {
  // TODO
  register(
    _name:        string,
    _description: string,
    _paramsSchema: Record<string, { type: string; description?: string }>,
    _fn:          ToolFn
  ): void {}

  async execute(_name: string, _args: Record<string, unknown>): Promise<unknown> {
    throw new Error("Not implemented");
  }

  names(): string[] { return []; }

  toAiSdkTools(): Record<string, ReturnType<typeof tool>> { return {}; }
}

// =============================================================================
// EXERCISE 2 — PHP-style ReAct loop (mirrors AgentLoop::run)
// =============================================================================
//
// TODO: Implement `agentLoop(message, registry, maxSteps?)` that:
//   1. Builds system prompt mentioning available tool names from registry.names()
//   2. Maintains a messages array (system + user + growing conversation)
//   3. Loops up to maxSteps (default 6):
//      a. Calls generateText with FAST model + registry.toAiSdkTools() + maxSteps:1
//      b. If no tool calls: return the text
//      c. If tool calls: execute each via registry.execute, append results to messages
//   4. If maxSteps reached: return "Maximum steps reached."
//   Returns { reply: string, steps: number }

async function agentLoop(
  message:   string,
  registry:  ToolRegistry,
  maxSteps:  number = 6
): Promise<{ reply: string; steps: number }> {
  // TODO
  return { reply: "", steps: 0 };
}

// =============================================================================
// EXERCISE 3 — Background job state machine (mirrors RunAgentJob)
// =============================================================================
//
// In Laravel: Cache::put status = pending/running/complete/failed
// Implement an in-memory version:
//
// TODO: Implement `JobStore` class with:
//   - create(jobId): void   → sets status = "pending"
//   - start(jobId): void    → sets status = "running"
//   - complete(jobId, result: string): void → status = "complete", stores result
//   - fail(jobId, error: string): void      → status = "failed", stores error
//   - get(jobId): { status: string; result?: string; error?: string } | undefined

class JobStore {
  // TODO
  create(_jobId: string): void {}
  start(_jobId: string): void {}
  complete(_jobId: string, _result: string): void {}
  fail(_jobId: string, _error: string): void {}
  get(_jobId: string): { status: string; result?: string; error?: string } | undefined {
    return undefined;
  }
}

// Simulate dispatch (runs async, updates job store)
async function dispatchAgentJob(
  jobId:    string,
  message:  string,
  store:    JobStore,
  registry: ToolRegistry
): Promise<void> {
  store.start(jobId);
  try {
    const { reply } = await agentLoop(message, registry);
    store.complete(jobId, reply);
  } catch (err) {
    store.fail(jobId, (err as Error).message);
  }
}

// =============================================================================
// EXERCISE 4 — PHP CostTracker port
// =============================================================================
//
// TODO: Implement `PhpStyleCostTracker` class with:
//   - record(model, inputTokens, outputTokens, label?): number
//     — returns the cost in USD for this call
//   - total(): number
//   - entries(): Array<{ model, inputTokens, outputTokens, costUsd, label }>
//
// Use PRICING_TABLE below.

const PRICING_TABLE: Record<string, { input: number; output: number }> = {
  "anthropic/claude-3-haiku":    { input: 0.25,  output: 1.25  },
  "anthropic/claude-3-5-sonnet": { input: 3.00,  output: 15.00 },
};

class PhpStyleCostTracker {
  // TODO
  record(_model: string, _inputTokens: number, _outputTokens: number, _label?: string): number {
    return 0;
  }
  total(): number { return 0; }
  entries(): Array<{ model: string; inputTokens: number; outputTokens: number; costUsd: number; label: string }> {
    return [];
  }
}

// =============================================================================
// EXERCISE 5 — Parallel sub-agent dispatch (mirrors Guzzle concurrent requests)
// =============================================================================
//
// TODO: Implement `parallelSubAgents(tasks, registry)` that:
//   - Accepts tasks: Record<string, string> (agentName → message)
//   - Dispatches all messages in parallel via agentLoop (Promise.all equivalent)
//   - Returns Record<string, string> (agentName → reply)
//   - If an agent fails, its reply should be "[Agent failed: <error message>]"

async function parallelSubAgents(
  tasks:    Record<string, string>,
  registry: ToolRegistry
): Promise<Record<string, string>> {
  // TODO
  return {};
}

// =============================================================================
// MAIN
// =============================================================================

async function main(): Promise<void> {
  // Build a shared tool registry
  const registry = new ToolRegistry();

  registry.register(
    "lookup_order",
    "Look up an order by its ID",
    { order_id: { type: "string", description: "Order identifier like A8812" } },
    ({ order_id }) => {
      const id = String(order_id).replace(/[^A-Z0-9-]/gi, "");
      if (id.length < 2) return { error: "Invalid order ID" };
      return { id, status: "shipped", eta: "2 days" };
    }
  );

  registry.register(
    "search_products",
    "Search the product catalogue",
    { query: { type: "string", description: "Product search query" } },
    ({ query }) => [
      { name: "Widget Pro",    price: 29.99, inStock: true  },
      { name: `${query} Max`, price: 59.99, inStock: false },
    ]
  );

  // Exercise 1 — tool registry
  console.assert(registry.names().length === 2, "Exercise 1: 2 tools registered");
  const result = await registry.execute("lookup_order", { order_id: "A8812" });
  console.assert((result as any).id === "A8812", "Exercise 1: tool executes correctly");
  const tools = registry.toAiSdkTools();
  console.assert("lookup_order" in tools, "Exercise 1: toAiSdkTools includes lookup_order");
  console.log("Exercise 1 ✓ — ToolRegistry correct");

  // Exercise 2 — agent loop
  console.log("\n=== Exercise 2: Agent loop ===");
  const loopResult = await agentLoop("Where is order A8812?", registry);
  console.log(`Reply (${loopResult.steps} steps): ${loopResult.reply.trim().slice(0, 80)}`);
  console.assert(loopResult.reply.length > 0, "Exercise 2: got a reply");
  console.assert(loopResult.steps >= 1,        "Exercise 2: at least 1 step taken");

  // Exercise 3 — job store
  const store = new JobStore();
  store.create("job-001");
  console.assert(store.get("job-001")?.status === "pending", "Exercise 3: initial status pending");
  store.start("job-001");
  console.assert(store.get("job-001")?.status === "running", "Exercise 3: status running after start");
  store.complete("job-001", "done!");
  console.assert(store.get("job-001")?.status === "complete", "Exercise 3: status complete");
  console.assert(store.get("job-001")?.result === "done!",    "Exercise 3: result stored");
  console.log("Exercise 3 ✓ — JobStore correct");

  // Exercise 3 continued — dispatch
  console.log("\n=== Exercise 3: Background dispatch ===");
  const jobId = "job-dispatch-001";
  store.create(jobId);
  await dispatchAgentJob(jobId, "Where is order A8812?", store, registry);
  const job = store.get(jobId);
  console.log(`Job status: ${job?.status}, result: ${job?.result?.slice(0, 60)}`);
  console.assert(job?.status === "complete", "Exercise 3: dispatch completes job");

  // Exercise 4 — PHP cost tracker
  const tracker = new PhpStyleCostTracker();
  const c1 = tracker.record("anthropic/claude-3-haiku", 10_000, 5_000, "classify");
  console.assert(c1 > 0,            "Exercise 4: cost > 0");
  tracker.record("anthropic/claude-3-haiku", 8_000, 3_000, "reply");
  console.assert(tracker.total() > c1, "Exercise 4: total > single call");
  console.assert(tracker.entries().length === 2, "Exercise 4: 2 entries");
  console.log(`Exercise 4 ✓ — total cost: $${tracker.total().toFixed(6)}`);

  // Exercise 5 — parallel sub-agents
  console.log("\n=== Exercise 5: Parallel sub-agents ===");
  const start = Date.now();
  const replies = await parallelSubAgents(
    {
      order:     "Where is order A8812?",
      catalogue: "Do you have blue widgets?",
    },
    registry
  );
  const elapsed = Date.now() - start;
  console.log(`Parallel dispatch: ${elapsed}ms`);
  console.log(`Order agent:     ${replies["order"]?.slice(0, 60)}`);
  console.log(`Catalogue agent: ${replies["catalogue"]?.slice(0, 60)}`);
  console.assert("order"     in replies, "Exercise 5: order reply present");
  console.assert("catalogue" in replies, "Exercise 5: catalogue reply present");
  console.log("Exercise 5 ✓ — parallel sub-agents correct");
}

main().catch(console.error);
