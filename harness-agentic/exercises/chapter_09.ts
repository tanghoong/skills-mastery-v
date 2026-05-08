/**
 * Chapter 9 — Streaming Responses
 *
 * Run: tsx exercises/chapter_09.ts
 */

import { streamText, generateText, tool } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import "dotenv/config";

const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY!,
});
const FAST     = "anthropic/claude-3-haiku";
const BALANCED = "anthropic/claude-3-5-sonnet";

const mockLookup = tool({
  description: "Look up order status",
  parameters: z.object({ orderId: z.string() }),
  execute: async ({ orderId }) =>
    JSON.stringify({ id: orderId, status: "shipped", eta: "2026-05-12" }),
});

// =============================================================================
// EXERCISE 1 — Basic streaming to stdout
// =============================================================================
//
// TODO: Implement `streamToConsole(prompt)` that:
//   - Calls streamText with FAST model, maxTokens: 150
//   - Iterates result.textStream and writes each chunk with process.stdout.write()
//   - Writes a newline at the end
//   - Returns the full accumulated text

async function streamToConsole(prompt: string): Promise<string> {
  // TODO
  return "";
}

// =============================================================================
// EXERCISE 2 — Measure time-to-first-token (TTFT)
// =============================================================================
//
// TODO: Implement `measureTTFT(prompt, model)` that:
//   - Records start time (Date.now())
//   - Starts streaming
//   - Records firstTokenMs when the FIRST non-empty chunk arrives
//   - After the stream finishes, records totalMs
//   - Returns { ttftMs: number, totalMs: number, text: string }

async function measureTTFT(
  prompt: string,
  model: string = FAST
): Promise<{ ttftMs: number; totalMs: number; text: string }> {
  // TODO
  return { ttftMs: 0, totalMs: 0, text: "" };
}

// =============================================================================
// EXERCISE 3 — Stream with tool calls
// =============================================================================
//
// TODO: Implement `streamWithTools(userMessage)` that:
//   - Uses BALANCED model with maxSteps: 5
//   - Provides mockLookup tool
//   - Iterates result.fullStream and logs:
//       type "text-delta":    writes chunk to stdout
//       type "tool-call":     logs "[Tool: {toolName}]"
//       type "tool-result":   logs "[Got result]"
//       type "finish":        logs "\n[Done: {finishReason}]"
//   - Returns the final accumulated text

async function streamWithTools(userMessage: string): Promise<string> {
  // TODO
  return "";
}

// =============================================================================
// EXERCISE 4 — Abort on timeout
// =============================================================================
//
// TODO: Implement `streamWithTimeout(prompt, timeoutMs)` that:
//   - Creates an AbortController
//   - Sets a setTimeout to call abort() after timeoutMs
//   - Passes abortSignal to streamText
//   - Collects chunks until the stream ends or is aborted
//   - Returns { text: string, aborted: boolean }
//   - Does NOT throw on abort — catches the error and returns { aborted: true, text: partialText }

async function streamWithTimeout(
  prompt: string,
  timeoutMs: number
): Promise<{ text: string; aborted: boolean }> {
  // TODO
  return { text: "", aborted: false };
}

// =============================================================================
// EXERCISE 5 — Collect stream into a string (utility)
// =============================================================================
//
// TODO: Implement `collectStream(stream: AsyncIterable<string>)` — a generic
//       utility that collects all chunks from any AsyncIterable<string> and
//       returns the concatenated string.

async function collectStream(stream: AsyncIterable<string>): Promise<string> {
  // TODO
  return "";
}

// =============================================================================
// MAIN
// =============================================================================

async function main(): Promise<void> {
  console.log("=== Exercise 1: Streaming to console ===");
  const text1 = await streamToConsole(
    "Explain what streaming responses are in one paragraph."
  );
  console.log(`\nTotal characters: ${text1.length}`);

  console.log("\n=== Exercise 2: TTFT measurement ===");
  const metrics = await measureTTFT(
    "List three benefits of streaming responses.",
    FAST
  );
  console.log(`TTFT: ${metrics.ttftMs}ms | Total: ${metrics.totalMs}ms`);
  console.assert(metrics.ttftMs > 0,  "Exercise 2: TTFT must be > 0");
  console.assert(metrics.ttftMs < metrics.totalMs, "Exercise 2: TTFT must be less than total");

  console.log("\n=== Exercise 3: Stream with tools ===");
  const toolResult = await streamWithTools("Where is order A8812? Stream your answer.");
  console.log(`\nFinal text length: ${toolResult.length} chars`);

  console.log("\n=== Exercise 4: Timeout abort ===");
  const fast = await streamWithTimeout("Count to 5.", 10_000);
  console.log(`Fast stream: aborted=${fast.aborted}, text="${fast.text.trim().slice(0, 50)}"`);

  const forcedAbort = await streamWithTimeout(
    "Write a detailed 500 word essay on the history of computing.",
    500  // abort after 500ms
  );
  console.log(`Forced abort: aborted=${forcedAbort.aborted}, partial text="${forcedAbort.text.slice(0, 80)}..."`);

  console.log("\n=== Exercise 5: collectStream utility ===");
  const result = streamText({ model: openrouter(FAST), prompt: "Say 'hello world'", maxTokens: 20 });
  const collected = await collectStream(result.textStream);
  console.log("Collected:", collected.trim());
}

main().catch(console.error);
