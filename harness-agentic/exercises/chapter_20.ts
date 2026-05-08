/**
 * Chapter 20 — Observability & Tracing
 *
 * Run: tsx exercises/chapter_20.ts
 */

import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import "dotenv/config";

const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY!,
});
const FAST = "anthropic/claude-3-haiku";

// =============================================================================
// EXERCISE 1 — TraceSpan + Tracer
// =============================================================================
//
// TODO: Implement the `TraceSpan` interface and `Tracer` class as described in
//       section 20.2.
//
// `Tracer` must implement:
//   - startSpan(traceId, name, type, parentId?): { spanId: string, finish(output, metadata?) }
//   - getTrace(traceId): TraceSpan[]
//   - allSpans(): TraceSpan[]
//   - clear(): void

interface TraceSpan {
  traceId:    string;
  spanId:     string;
  parentId:   string | null;
  name:       string;
  type:       "llm" | "tool" | "agent" | "pipeline";
  startTime:  Date;
  endTime:    Date;
  durationMs: number;
  input:      unknown;
  output:     unknown;
  metadata: {
    model?:        string;
    inputTokens?:  number;
    outputTokens?: number;
    costUSD?:      number;
    agentName?:    string;
    sessionId?:    string;
    error?:        string;
  };
}

class Tracer {
  // TODO
  startSpan(
    _traceId: string,
    _name:    string,
    _type:    TraceSpan["type"],
    _parentId: string | null = null
  ): { spanId: string; finish: (output: unknown, metadata?: TraceSpan["metadata"]) => void } {
    return { spanId: "", finish: () => {} };
  }
  getTrace(_traceId: string): TraceSpan[] { return []; }
  allSpans(): TraceSpan[] { return []; }
  clear(): void {}
}

// =============================================================================
// EXERCISE 2 — Instrumented LLM call wrapper
// =============================================================================
//
// TODO: Implement `tracedGenerateText(tracer, traceId, parentId, spanName, params)`
//       that:
//   1. Starts a "llm" span on the tracer
//   2. Calls generateText with the given params
//   3. Finishes the span with the response text and metadata
//      (model, inputTokens, outputTokens, durationMs)
//   4. Returns the generateText result

async function tracedGenerateText(
  tracer:   Tracer,
  traceId:  string,
  parentId: string | null,
  spanName: string,
  params:   Parameters<typeof generateText>[0]
): Promise<Awaited<ReturnType<typeof generateText>>> {
  // TODO
  return generateText(params);
}

// =============================================================================
// EXERCISE 3 — Instrumented pipeline
// =============================================================================
//
// TODO: Implement `tracedPipeline(tracer, message, sessionId)` that:
//   1. Creates a traceId and starts a "pipeline" root span
//   2. Uses tracedGenerateText for a classification call (name: "intent_classification")
//   3. Uses tracedGenerateText for a response call (name: "agent_response")
//   4. Finishes the root span
//   5. Returns { reply: string, traceId: string }

async function tracedPipeline(
  tracer:    Tracer,
  message:   string,
  sessionId: string
): Promise<{ reply: string; traceId: string }> {
  // TODO
  return { reply: "", traceId: "" };
}

// =============================================================================
// EXERCISE 4 — Latency report
// =============================================================================
//
// TODO: Implement `buildLatencyReport(allSpans)` that:
//   - Groups spans by name
//   - For each name, computes p50 and p95 of durationMs
//   - Returns an object: Record<string, { p50: number, p95: number, count: number }>

function buildLatencyReport(
  allSpans: TraceSpan[]
): Record<string, { p50: number; p95: number; count: number }> {
  // TODO
  return {};
}

// =============================================================================
// EXERCISE 5 — Cost anomaly detection
// =============================================================================
//
// TODO: Implement `detectCostAnomalies(spans, stdMultiplier)` that:
//   - Groups spans by traceId, sums costUSD per trace
//   - Computes mean and stdDev of per-trace costs
//   - Returns traceIds where cost > mean + stdMultiplier * stdDev

function detectCostAnomalies(
  spans:         TraceSpan[],
  stdMultiplier: number = 2
): string[] {
  // TODO
  return [];
}

// =============================================================================
// MAIN
// =============================================================================

async function main(): Promise<void> {
  const tracer = new Tracer();

  // Exercise 1 — basic span recording
  const t1 = "trace-001";
  const root = tracer.startSpan(t1, "test_root", "pipeline");
  const child = tracer.startSpan(t1, "test_child", "llm", root.spanId);
  await new Promise(r => setTimeout(r, 50));
  child.finish("child output", { model: FAST, inputTokens: 100, outputTokens: 50 });
  root.finish("root output");

  const spans = tracer.getTrace(t1);
  console.assert(spans.length === 2, `Exercise 1: should have 2 spans, got ${spans.length}`);
  console.assert(spans[0].durationMs >= 0, "Exercise 1: duration should be >= 0");
  console.assert(spans.some(s => s.parentId !== null), "Exercise 1: child should have parentId");
  console.log("Exercise 1 ✓ — tracer records spans correctly");

  // Exercise 2 — traced LLM call
  const t2 = "trace-002";
  const root2 = tracer.startSpan(t2, "root", "pipeline");
  const result = await tracedGenerateText(tracer, t2, root2.spanId, "test_call", {
    model:     openrouter(FAST),
    prompt:    "Say 'tracing works' and nothing else.",
    maxTokens: 10,
  });
  root2.finish(result.text);
  const t2spans = tracer.getTrace(t2);
  console.assert(t2spans.some(s => s.name === "test_call"), "Exercise 2: LLM span recorded");
  console.assert(t2spans.some(s => s.metadata.inputTokens! > 0), "Exercise 2: token counts recorded");
  console.log("Exercise 2 ✓ — traced LLM call:", result.text.trim());

  // Exercise 3 — full pipeline trace
  console.log("\n=== Exercise 3: Instrumented pipeline ===");
  const { reply, traceId } = await tracedPipeline(tracer, "Where is order A8812?", "sess-001");
  console.log("Reply:", reply.trim());
  const pipeSpans = tracer.getTrace(traceId);
  console.log(`Pipeline spans: ${pipeSpans.length}`);
  pipeSpans.forEach(s => console.log(`  [${s.type}] ${s.name} — ${s.durationMs}ms`));

  // Exercise 4 — latency report
  const report = buildLatencyReport(tracer.allSpans());
  console.log("\n=== Exercise 4: Latency report ===");
  for (const [name, stats] of Object.entries(report)) {
    console.log(`  ${name}: p50=${stats.p50}ms p95=${stats.p95}ms (n=${stats.count})`);
  }

  // Exercise 5 — anomaly detection (inject a high-cost span)
  const anomalyTracer = new Tracer();
  for (let i = 0; i < 10; i++) {
    const tid = `norm-${i}`;
    const s = anomalyTracer.startSpan(tid, "call", "llm");
    s.finish("ok", { costUSD: 0.001 });
  }
  const anomalousId = "anomaly-001";
  const a = anomalyTracer.startSpan(anomalousId, "call", "llm");
  a.finish("ok", { costUSD: 0.10 });  // 100× normal

  const anomalies = detectCostAnomalies(anomalyTracer.allSpans(), 2);
  console.assert(anomalies.includes(anomalousId), `Exercise 5: anomaly ${anomalousId} should be detected`);
  console.log("\nExercise 5 ✓ — anomaly detected:", anomalies);
}

main().catch(console.error);
