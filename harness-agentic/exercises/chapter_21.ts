/**
 * Chapter 21 — Performance Optimisation
 *
 * Run: tsx exercises/chapter_21.ts
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
// EXERCISE 1 — ResultCache<T>
// =============================================================================
//
// TODO: Implement `ResultCache<T>` class with:
//   - get(key): T | undefined  — returns undefined if not found or expired
//   - set(key, value, ttlMs):  — stores with expiry
//   - has(key): boolean
//   - size: number (count of non-expired entries)
//   - clear(): void

class ResultCache<T> {
  // TODO
  get(_key: string): T | undefined { return undefined; }
  set(_key: string, _value: T, _ttlMs: number = 60_000): void {}
  has(_key: string): boolean { return false; }
  get size(): number { return 0; }
  clear(): void {}
}

// =============================================================================
// EXERCISE 2 — Parallel vs sequential timing comparison
// =============================================================================
//
// TODO: Implement `compareParallelVsSequential(tasks)` where tasks is an array
//       of async functions () => Promise<string>.
//       - Run them SEQUENTIALLY, record total time
//       - Run them in PARALLEL (Promise.all), record total time
//       - Return { sequential: { results, totalMs }, parallel: { results, totalMs } }

async function compareParallelVsSequential<T>(
  tasks: Array<() => Promise<T>>
): Promise<{
  sequential: { results: T[]; totalMs: number };
  parallel:   { results: T[]; totalMs: number };
}> {
  // TODO
  return {
    sequential: { results: [], totalMs: 0 },
    parallel:   { results: [], totalMs: 0 },
  };
}

// =============================================================================
// EXERCISE 3 — Cached LLM call
// =============================================================================
//
// TODO: Implement `cachedGenerateText(cache, prompt, ttlMs)` that:
//   - Normalises the key: prompt.trim().toLowerCase()
//   - Returns cached result if available (log "[CACHE HIT]")
//   - Otherwise calls generateText with FAST model (maxTokens: 100),
//     stores in cache, returns result
//   - Returns { text: string, cacheHit: boolean, durationMs: number }

const textCache = new ResultCache<string>();

async function cachedGenerateText(
  cache:  ResultCache<string>,
  prompt: string,
  ttlMs:  number = 30_000
): Promise<{ text: string; cacheHit: boolean; durationMs: number }> {
  // TODO
  return { text: "", cacheHit: false, durationMs: 0 };
}

// =============================================================================
// EXERCISE 4 — SLA checker
// =============================================================================
//
// TODO: Implement `checkSLA(stageTimings, slaMap)` that:
//   - stageTimings: Record<string, number> — actual p95 latency per stage
//   - slaMap: Record<string, number> — target p95 per stage
//   - Returns { passed: boolean, breaches: Array<{ stage, actual, target, overMs }> }

interface SLAResult {
  passed:   boolean;
  breaches: Array<{ stage: string; actual: number; target: number; overMs: number }>;
}

function checkSLA(
  stageTimings: Record<string, number>,
  slaMap:       Record<string, number>
): SLAResult {
  // TODO
  return { passed: true, breaches: [] };
}

// =============================================================================
// EXERCISE 5 — Pipeline performance benchmark
// =============================================================================
//
// TODO: Implement `benchmarkPipeline(message, iterations)` that:
//   - Runs a simple two-step pipeline `iterations` times:
//       Step 1: classify intent (FAST model, maxTokens: 20)
//       Step 2: generate reply (FAST model, maxTokens: 100)
//   - Measures total pipeline time per iteration
//   - Computes p50, p95 across iterations
//   - Checks against SLA: { classify: 700, reply: 2000, total: 3000 }
//   - Returns { p50: number, p95: number, slaResult: SLAResult }

async function benchmarkPipeline(
  message:    string,
  iterations: number = 5
): Promise<{ p50: number; p95: number; slaResult: SLAResult }> {
  // TODO
  return { p50: 0, p95: 0, slaResult: { passed: true, breaches: [] } };
}

// Helper
function percentile(sorted: number[], pct: number): number {
  return sorted[Math.floor(sorted.length * pct)] ?? sorted[sorted.length - 1] ?? 0;
}

// =============================================================================
// MAIN
// =============================================================================

async function main(): Promise<void> {
  // Exercise 1 — cache
  const cache = new ResultCache<number>();
  cache.set("a", 42, 100);
  console.assert(cache.get("a") === 42, "Exercise 1: get returns stored value");
  console.assert(cache.has("a"),        "Exercise 1: has returns true for existing key");
  console.assert(cache.size === 1,      "Exercise 1: size is 1");
  await new Promise(r => setTimeout(r, 150));
  console.assert(cache.get("a") === undefined, "Exercise 1: expired value returns undefined");
  console.log("Exercise 1 ✓ — ResultCache correct");

  // Exercise 2 — parallel vs sequential
  console.log("\n=== Exercise 2: Parallel vs Sequential ===");
  const DELAY = 300;
  const mockTasks = [
    () => new Promise<string>(r => setTimeout(() => r("task1"), DELAY)),
    () => new Promise<string>(r => setTimeout(() => r("task2"), DELAY)),
    () => new Promise<string>(r => setTimeout(() => r("task3"), DELAY)),
  ];

  const comparison = await compareParallelVsSequential(mockTasks);
  console.log(`Sequential: ${comparison.sequential.totalMs}ms`);
  console.log(`Parallel:   ${comparison.parallel.totalMs}ms`);
  console.assert(
    comparison.parallel.totalMs < comparison.sequential.totalMs,
    "Exercise 2: parallel should be faster than sequential"
  );
  const speedup = comparison.sequential.totalMs / comparison.parallel.totalMs;
  console.log(`Speedup: ${speedup.toFixed(1)}× (expected ~${mockTasks.length}×)`);

  // Exercise 3 — cached LLM call
  console.log("\n=== Exercise 3: Cached generateText ===");
  const r1 = await cachedGenerateText(textCache, "What is 2 + 2?");
  console.log(`First call: "${r1.text.trim()}" | cacheHit=${r1.cacheHit} | ${r1.durationMs}ms`);
  const r2 = await cachedGenerateText(textCache, "What is 2 + 2?");
  console.log(`Second call: "${r2.text.trim()}" | cacheHit=${r2.cacheHit} | ${r2.durationMs}ms`);
  console.assert(r2.cacheHit,          "Exercise 3: second call should be a cache hit");
  console.assert(r2.durationMs < 50,   "Exercise 3: cache hit should be near-instant");

  // Exercise 4 — SLA checker
  const slaResult = checkSLA(
    { classify: 400, reply: 1800, total: 2500 },
    { classify: 500, reply: 3000, total: 6000 }
  );
  console.assert(slaResult.passed,          "Exercise 4: should pass when within SLA");
  console.assert(slaResult.breaches.length === 0, "Exercise 4: no breaches");

  const slaFail = checkSLA(
    { classify: 800, reply: 5000, total: 7000 },
    { classify: 500, reply: 3000, total: 6000 }
  );
  console.assert(!slaFail.passed,           "Exercise 4: should fail when over SLA");
  console.assert(slaFail.breaches.length >= 2, `Exercise 4: at least 2 breaches, got ${slaFail.breaches.length}`);
  console.log("Exercise 4 ✓ — SLA checker correct");

  // Exercise 5 — pipeline benchmark
  console.log("\n=== Exercise 5: Pipeline benchmark ===");
  const bench = await benchmarkPipeline("Where is order A8812?", 3);
  console.log(`p50: ${bench.p50}ms | p95: ${bench.p95}ms`);
  console.log(`SLA: ${bench.slaResult.passed ? "PASS" : "FAIL"}`);
  if (!bench.slaResult.passed) {
    bench.slaResult.breaches.forEach(b =>
      console.log(`  ⚠ ${b.stage}: ${b.actual}ms > ${b.target}ms (over by ${b.overMs}ms)`)
    );
  }
}

main().catch(console.error);
