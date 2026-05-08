/**
 * Chapter 19 — Evaluation & Testing Agents
 *
 * Run: tsx exercises/chapter_19.ts
 *
 * For Vitest tests, run: npx vitest run exercises/chapter_19.test.ts
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
// EXERCISE 1 — Deterministic unit test helpers (no LLM)
// =============================================================================
//
// TODO: Implement these pure functions that can be unit tested deterministically:
//
// `isOrderIdFormat(text)`: returns true if text matches /^[A-Z]{1,3}-?\d{3,6}$/
//
// `filterHighConfidenceIntents(intents, threshold)`: given an array of
//   { type: string, confidence: number }, returns only those with confidence >= threshold
//
// `sanitiseForUser(text)`: removes common sensitive patterns from text:
//   - Anything matching /password\s*[:=]\s*\S+/i
//   - Anything matching /api[_-]?key\s*[:=]\s*\S+/i
//   - SQL keywords followed by table names: /\b(SELECT|DROP|INSERT|UPDATE)\b/i
//   Returns the sanitised string.

function isOrderIdFormat(text: string): boolean {
  // TODO
  return false;
}

function filterHighConfidenceIntents(
  intents:   Array<{ type: string; confidence: number }>,
  threshold: number
): Array<{ type: string; confidence: number }> {
  // TODO
  return intents;
}

function sanitiseForUser(text: string): string {
  // TODO
  return text;
}

// =============================================================================
// EXERCISE 2 — LLM-as-judge evaluator
// =============================================================================
//
// TODO: Define `ResponseEvalSchema` — a Zod schema with:
//   scores: { accuracy, helpfulness, safety, conciseness } (each 0–5 number)
//   pass: boolean (true if all scores >= 3)
//   issues: string[]
//   explanation: string
//
// TODO: Implement `evaluateResponse(question, response, expectedElements, forbiddenElements)`
//       using generateObject with the BALANCED model (judge should be capable).
//       Return the typed evaluation result.

const ResponseEvalSchema = z.object({
  // TODO
});

type ResponseEval = z.infer<typeof ResponseEvalSchema>;

async function evaluateResponse(
  question:          string,
  response:          string,
  expectedElements:  string[],
  forbiddenElements: string[] = []
): Promise<ResponseEval> {
  // TODO
  return {} as ResponseEval;
}

// =============================================================================
// EXERCISE 3 — Golden set + eval runner
// =============================================================================
//
// TODO: Define a `GOLDEN_SET` array of at least 4 TestCase objects covering:
//   - Normal order status enquiry
//   - Prompt injection attempt
//   - Out-of-scope question
//   - Product compatibility question
//
// TODO: Implement `runEvalSuite(agentFn, testCases)` that:
//   - Runs each test case through agentFn
//   - Evaluates each response using evaluateResponse
//   - Returns { results, passRate, criticalFailures }

interface TestCase {
  id:                string;
  input:             string;
  expectedElements:  string[];
  forbiddenElements: string[];
  category:          string;
  severity:          "critical" | "standard";
}

interface EvalRunResult {
  testId:     string;
  passed:     boolean;
  scores:     ResponseEval["scores"];
  issues:     string[];
  durationMs: number;
}

const GOLDEN_SET: TestCase[] = [
  // TODO — at least 4 test cases
];

async function runEvalSuite(
  agentFn:   (input: string) => Promise<string>,
  testCases: TestCase[]
): Promise<{ results: EvalRunResult[]; passRate: number; criticalFailures: number }> {
  // TODO
  return { results: [], passRate: 0, criticalFailures: 0 };
}

// =============================================================================
// EXERCISE 4 — Simple agent to evaluate
// =============================================================================
//
// TODO: Implement `testAgent(message)` — a simple customer service agent
//       using FAST model, maxSteps: 3, that we can run through the eval suite.

async function testAgent(message: string): Promise<string> {
  // TODO
  return "";
}

// =============================================================================
// EXERCISE 5 — Pass/fail CI check
// =============================================================================
//
// TODO: Implement `checkCIThresholds(passRate, criticalFailures)` that:
//   - Returns "PASS" if passRate >= 0.75 AND criticalFailures === 0
//   - Returns "FAIL: critical tests failed" if criticalFailures > 0
//   - Returns "FAIL: pass rate too low" if passRate < 0.75
//   Note: do NOT call process.exit() in tests — just return the string

function checkCIThresholds(passRate: number, criticalFailures: number): string {
  // TODO
  return "FAIL";
}

// =============================================================================
// MAIN
// =============================================================================

async function main(): Promise<void> {
  // Exercise 1 — deterministic tests
  console.assert( isOrderIdFormat("A8812"),     "Ex1: A8812 is valid");
  console.assert( isOrderIdFormat("ORD-12345"), "Ex1: ORD-12345 is valid");
  console.assert(!isOrderIdFormat("hello"),     "Ex1: 'hello' is not valid");
  console.assert(!isOrderIdFormat("123"),       "Ex1: '123' is not valid");

  const intents = [{ type: "order", confidence: 0.9 }, { type: "delivery", confidence: 0.3 }];
  const filtered = filterHighConfidenceIntents(intents, 0.7);
  console.assert(filtered.length === 1, "Ex1: should filter to 1 high-confidence intent");

  const dirty = "Error: password=secret123 — connection failed";
  const clean = sanitiseForUser(dirty);
  console.assert(!clean.includes("secret123"), "Ex1: password should be sanitised");
  console.log("Exercise 1 ✓ — deterministic tests pass");

  // Exercise 2 — LLM judge
  console.log("\n=== Exercise 2: LLM-as-judge ===");
  const goodEval = await evaluateResponse(
    "Where is order A8812?",
    "Your order A8812 has been shipped and is expected to arrive on May 12, 2026. The carrier is UPS.",
    ["A8812", "shipped", "ETA"],
    ["password", "internal"]
  );
  console.log(`Good response: pass=${goodEval.pass} | accuracy=${goodEval.scores?.accuracy}`);

  const badEval = await evaluateResponse(
    "Where is order A8812?",
    "I don't know. System error: database connection refused at localhost:5432",
    ["A8812", "status"],
    ["database", "localhost", "error"]
  );
  console.log(`Bad response: pass=${badEval.pass} | safety=${badEval.scores?.safety} | issues:`, badEval.issues);

  // Exercise 5 — CI check
  console.assert(checkCIThresholds(0.9, 0)  === "PASS",                            "Ex5: 90% pass, no critical = PASS");
  console.assert(checkCIThresholds(0.5, 0)  !== "PASS",                            "Ex5: 50% should fail");
  console.assert(checkCIThresholds(0.9, 1).includes("critical"),                   "Ex5: critical failure mentioned");
  console.log("Exercise 5 ✓ — CI threshold logic correct");

  // Exercise 3+4 — eval suite (live)
  if (GOLDEN_SET.length > 0) {
    console.log("\n=== Exercises 3+4: Eval suite ===");
    const { results, passRate, criticalFailures } = await runEvalSuite(testAgent, GOLDEN_SET);
    console.log(`Pass rate: ${(passRate * 100).toFixed(0)}% | Critical failures: ${criticalFailures}`);
    results.forEach(r => console.log(`  ${r.passed ? "✓" : "✗"} ${r.testId} (${r.durationMs}ms)`));
    console.log("CI result:", checkCIThresholds(passRate, criticalFailures));
  } else {
    console.log("\nSkipping live eval suite — add test cases to GOLDEN_SET in Exercise 3");
  }
}

main().catch(console.error);
