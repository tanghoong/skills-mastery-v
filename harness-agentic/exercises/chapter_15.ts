/**
 * Chapter 15 — Web & File System Agents
 *
 * Run: tsx exercises/chapter_15.ts
 *
 * Note: HTTP tool exercises use mock responses (no live carrier API needed).
 * File system exercises use a temp directory under /tmp.
 */

import * as path from "path";
import * as fs   from "fs/promises";
import { generateText, tool } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import "dotenv/config";

const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY!,
});
const FAST = "anthropic/claude-3-haiku";

const BASE_DIR = "/tmp/harness-agent-data";

// =============================================================================
// EXERCISE 1 — Safe path resolver
// =============================================================================
//
// TODO: Implement `safePath(relativePath, baseDir)` that:
//   - Resolves the relative path against baseDir
//   - Throws Error("PATH_TRAVERSAL") if the resolved path does not start with baseDir
//   - Returns the absolute path

function safePath(relativePath: string, baseDir: string = BASE_DIR): string {
  // TODO
  return path.resolve(baseDir, relativePath);
}

// =============================================================================
// EXERCISE 2 — File read/write tools
// =============================================================================
//
// TODO: Define `readFileTool` with:
//   - description explaining it reads from BASE_DIR
//   - parameter: filePath (string, relative, with .describe())
//   - execute: uses safePath, reads file, truncates at 5000 chars, returns text
//     Return error JSON for FILE_NOT_FOUND or PATH_TRAVERSAL
//
// TODO: Define `writeFileTool` with:
//   - parameters: filePath (string), content (string), append (boolean, default false)
//   - execute: uses safePath, creates parent dirs, writes/appends, returns success JSON

const readFileTool = tool({
  description: "", // TODO
  parameters: z.object({ /* TODO */ }),
  execute: async (_args) => { return "not implemented"; },
});

const writeFileTool = tool({
  description: "", // TODO
  parameters: z.object({ /* TODO */ }),
  execute: async (_args) => { return "not implemented"; },
});

// =============================================================================
// EXERCISE 3 — HTTP fetch tool with allowlist
// =============================================================================
//
// TODO: Define `fetchTool` with:
//   - parameter: url (z.string().url()), method (GET|POST, default GET)
//   - execute: validates url hostname against ALLOWED_DOMAINS, fetches with 5s timeout
//     Truncates response to 3000 chars.
//   - ALLOWED_DOMAINS = ["jsonplaceholder.typicode.com", "httpbin.org"]

const ALLOWED_DOMAINS = ["jsonplaceholder.typicode.com", "httpbin.org"];

const fetchTool = tool({
  description: "", // TODO
  parameters: z.object({ /* TODO */ }),
  execute: async (_args) => { return "not implemented"; },
});

// =============================================================================
// EXERCISE 4 — Rate limiter
// =============================================================================
//
// TODO: Implement the `RateLimiter` class:
//   - constructor(maxCalls: number, windowMs: number)
//   - async throttle(): waits if at capacity, then records the call time
//   - get callsInWindow(): number — count of recent calls

class RateLimiter {
  // TODO
  async throttle(): Promise<void> { /* TODO */ }
  get callsInWindow(): number { return 0; }
}

// =============================================================================
// EXERCISE 5 — File-based reporting agent
// =============================================================================
//
// TODO: Implement `reportingAgent(question)` that:
//   - Provides readFileTool and writeFileTool
//   - Has a system prompt instructing the agent to:
//       1. Read "catalogue.txt" from the data dir
//       2. Analyse it to answer the question
//       3. Write the answer to "report.txt"
//   - Before running, creates BASE_DIR/catalogue.txt with the product data below
//   - Returns the final text response

const CATALOGUE_CONTENT = `
Product Catalogue — Acme Corp Spare Parts
==========================================
1. XR-200 Door Handle (DH-XR200) — $49.99 — In Stock
2. Hinge Set XR-200 (HS-XR200)   — $29.99 — In Stock
3. Door Seal Kit (DSK-001)        — $19.99 — Out of Stock
4. Adaptor Plate AP-200           — $9.99  — In Stock
5. XR-300 Complete Hinge Assembly — $59.99 — In Stock
`.trim();

async function reportingAgent(question: string): Promise<string> {
  // TODO — setup files, run agent with readFileTool and writeFileTool, return result
  return "";
}

// =============================================================================
// MAIN
// =============================================================================

async function main(): Promise<void> {
  await fs.mkdir(BASE_DIR, { recursive: true });

  // Exercise 1 — path safety
  const safe = safePath("reports/data.txt");
  console.assert(safe.startsWith(BASE_DIR), "Exercise 1: safe path is within base dir");
  try {
    safePath("../../etc/passwd");
    console.assert(false, "Exercise 1: should throw on traversal");
  } catch (e) {
    console.assert((e as Error).message.includes("PATH_TRAVERSAL"), "Exercise 1: correct error");
  }
  console.log("Exercise 1 ✓ — path safety correct");

  // Exercise 2 — file tools
  const writeResult = await writeFileTool.execute!({
    filePath: "test.txt",
    content: "Hello, agent!",
    append: false,
  }, { messages: [], toolCallId: "t1" });
  console.assert(JSON.parse(writeResult as string).success, "Exercise 2: write should succeed");

  const readResult = await readFileTool.execute!({ filePath: "test.txt" }, { messages: [], toolCallId: "t2" });
  console.assert((readResult as string).includes("Hello"), "Exercise 2: read back written content");
  console.log("Exercise 2 ✓ — file read/write tools work");

  // Exercise 3 — fetch tool with allowlist
  const goodFetch = await fetchTool.execute!(
    { url: "https://jsonplaceholder.typicode.com/todos/1", method: "GET" },
    { messages: [], toolCallId: "t3" }
  );
  console.assert(!(goodFetch as string).includes("URL_NOT_ALLOWED"), "Exercise 3: allowed domain should work");

  const blockedFetch = await fetchTool.execute!(
    { url: "https://evil.example.com/steal-data", method: "GET" },
    { messages: [], toolCallId: "t4" }
  );
  console.assert((blockedFetch as string).includes("URL_NOT_ALLOWED"), "Exercise 3: blocked domain rejected");
  console.log("Exercise 3 ✓ — fetch allowlist works");

  // Exercise 4 — rate limiter
  const rl = new RateLimiter(3, 1000);
  for (let i = 0; i < 3; i++) await rl.throttle();
  console.assert(rl.callsInWindow === 3, "Exercise 4: 3 calls recorded");
  console.log("Exercise 4 ✓ — rate limiter tracks calls");

  // Exercise 5 — reporting agent
  console.log("\n=== Exercise 5: Reporting agent ===");
  const report = await reportingAgent(
    "List the products that are currently in stock and their prices."
  );
  console.log(report.trim());
  // Verify the report file was written
  try {
    const written = await fs.readFile(`${BASE_DIR}/report.txt`, "utf-8");
    console.log(`Report file written (${written.length} chars)`);
  } catch {
    console.log("Note: report.txt not found — check writeFileTool implementation");
  }
}

main().catch(console.error);
