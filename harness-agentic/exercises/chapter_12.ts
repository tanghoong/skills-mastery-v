/**
 * Chapter 12 — Multi-Agent Orchestration
 *
 * Run: tsx exercises/chapter_12.ts
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
// TYPES
// =============================================================================

interface AgentTask {
  taskId:    string;
  type:      "order_status" | "product_search" | "delivery" | "general";
  payload:   Record<string, unknown>;
  sessionId: string;
  priority:  "normal" | "urgent";
}

interface AgentResult {
  taskId:     string;
  type:       AgentTask["type"];
  content:    string;
  success:    boolean;
  error?:     string;
  durationMs: number;
  tokens:     number;
}

// =============================================================================
// EXERCISE 1 — Sub-agent implementations
// =============================================================================
//
// TODO: Implement these three sub-agents as pure async functions:
//
// `orderStatusSubAgent(task)`:
//   - Uses FAST model
//   - Extracts orderId from task.payload
//   - If no orderId, returns success: false with a helpful message
//   - Otherwise generates a mock order status response
//   - Returns a complete AgentResult
//
// `productSearchSubAgent(task)`:
//   - Uses FAST model
//   - Extracts query from task.payload.productQuery or task.payload.modelCode
//   - Returns a catalogue search response
//
// `generalSupportSubAgent(task)`:
//   - Uses FAST model
//   - Returns a general customer service response

async function orderStatusSubAgent(task: AgentTask): Promise<AgentResult> {
  const start = Date.now();
  // TODO
  return {
    taskId: task.taskId, type: task.type, content: "", success: false,
    durationMs: Date.now() - start, tokens: 0,
  };
}

async function productSearchSubAgent(task: AgentTask): Promise<AgentResult> {
  const start = Date.now();
  // TODO
  return {
    taskId: task.taskId, type: task.type, content: "", success: false,
    durationMs: Date.now() - start, tokens: 0,
  };
}

async function generalSupportSubAgent(task: AgentTask): Promise<AgentResult> {
  const start = Date.now();
  // TODO
  return {
    taskId: task.taskId, type: task.type, content: "", success: false,
    durationMs: Date.now() - start, tokens: 0,
  };
}

// =============================================================================
// EXERCISE 2 — Fan-out with partial failure handling
// =============================================================================
//
// TODO: Implement `fanOut(tasks)` that:
//   - Creates a map of task type → sub-agent function
//   - Executes ALL tasks in PARALLEL using Promise.all
//   - Each task is wrapped in a try/catch — failures return a failed AgentResult
//     (never let one failure throw; the pipeline must always return results for all tasks)
//   - Returns AgentResult[]

const SUB_AGENTS: Record<AgentTask["type"], (task: AgentTask) => Promise<AgentResult>> = {
  order_status:   orderStatusSubAgent,
  product_search: productSearchSubAgent,
  delivery:       generalSupportSubAgent, // simplified for this exercise
  general:        generalSupportSubAgent,
};

async function fanOut(tasks: AgentTask[]): Promise<AgentResult[]> {
  // TODO
  return [];
}

// =============================================================================
// EXERCISE 3 — Response merger
// =============================================================================
//
// TODO: Implement `mergeAgentResults(originalMessage, results)` that:
//   - If only one successful result: returns it directly
//   - If multiple results: uses BALANCED model (maxTokens: 350) to merge them
//     into a single coherent customer-facing reply
//   - If all failed: returns a graceful fallback message
//   - Returns the final reply string

async function mergeAgentResults(
  originalMessage: string,
  results: AgentResult[]
): Promise<string> {
  // TODO
  return "";
}

// =============================================================================
// EXERCISE 4 — Pipeline logging
// =============================================================================
//
// TODO: Implement `logPipeline(results, totalMs)` that logs:
//   - Total duration
//   - Number of sub-agents (success / failure)
//   - Per-agent: type, durationMs, tokens, success/failure indicator
//   - Total tokens across all agents

function logPipeline(results: AgentResult[], totalMs: number): void {
  // TODO
}

// =============================================================================
// EXERCISE 5 — Full orchestrated pipeline
// =============================================================================
//
// TODO: Implement `orchestrate(sessionId, message)` that:
//   1. Classifies the message into 1–3 tasks (you can hardcode a simple classifier
//      using keyword matching — no LLM call needed for this exercise):
//        - message contains "order": include order_status task with payload.orderId
//        - message contains "hinge" or "part" or "product": include product_search task
//        - otherwise: include general task
//   2. Runs fanOut in parallel
//   3. Logs pipeline with logPipeline
//   4. Merges results
//   5. Returns { reply: string, totalMs: number }

async function orchestrate(
  sessionId: string,
  message: string
): Promise<{ reply: string; totalMs: number }> {
  // TODO
  return { reply: "", totalMs: 0 };
}

// =============================================================================
// MAIN
// =============================================================================

async function main(): Promise<void> {
  const tests = [
    { sid: "s1", msg: "Where is order A8812?" },
    { sid: "s2", msg: "Do you have hinge replacements for the XR-200?" },
    { sid: "s3", msg: "I need order B4401 status AND hinge parts for XR-200." },
    { sid: "s4", msg: "Hello, I need some general help." },
  ];

  for (const { sid, msg } of tests) {
    console.log(`\n${"═".repeat(60)}`);
    console.log(`Message: "${msg}"`);
    const { reply, totalMs } = await orchestrate(sid, msg);
    console.log(`Reply: ${reply.trim()}`);
    console.log(`Total: ${totalMs}ms`);
  }
}

main().catch(console.error);
