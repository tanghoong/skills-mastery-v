# Chapter 20 — Observability & Tracing

## Learning Objectives

By the end of this chapter you will be able to:
- Instrument agent pipelines with structured trace spans
- Build a trace that covers the full request: receive → classify → route → execute → merge → respond
- Export traces to Langfuse or a custom store
- Create dashboards showing latency, token usage, cost, and error rate
- Alert on latency SLA breaches and cost anomalies

---

## 20.1 The Observability Problem

Without observability, when a customer reports "the agent gave a wrong answer":
- You don't know which model was used
- You don't know which tools were called and in what order
- You don't know what the retrieved RAG chunks were
- You don't know how long each step took

With observability, you have a complete trace for every request.

---

## 20.2 The Trace Data Model

```typescript
interface TraceSpan {
  traceId:    string;     // unique per request
  spanId:     string;     // unique per step
  parentId:   string | null;
  name:       string;     // "intent_classification", "order_agent", "rag_retrieval"
  type:       "llm" | "tool" | "agent" | "pipeline";
  startTime:  Date;
  endTime:    Date;
  durationMs: number;
  input:      unknown;    // what was sent
  output:     unknown;    // what was received
  metadata: {
    model?:        string;
    inputTokens?:  number;
    outputTokens?: number;
    cachedTokens?: number;
    costUSD?:      number;
    agentName?:    string;
    sessionId?:    string;
    error?:        string;
  };
}

class Tracer {
  private spans: TraceSpan[] = [];

  startSpan(traceId: string, name: string, type: TraceSpan["type"], parentId: string | null = null): { spanId: string; finish: (output: unknown, metadata?: TraceSpan["metadata"]) => void } {
    const spanId    = crypto.randomUUID();
    const startTime = new Date();

    return {
      spanId,
      finish: (output, metadata = {}) => {
        const endTime = new Date();
        this.spans.push({
          traceId, spanId, parentId, name, type,
          startTime, endTime,
          durationMs: endTime.getTime() - startTime.getTime(),
          input:  undefined,
          output,
          metadata,
        });
      },
    };
  }

  getTrace(traceId: string): TraceSpan[] {
    return this.spans.filter(s => s.traceId === traceId);
  }

  exportAll(): TraceSpan[] {
    return [...this.spans];
  }
}

export const tracer = new Tracer();
```

---

## 20.3 Instrumenting the Pipeline

```typescript
async function handleCustomerMessageInstrumented(
  message: string,
  sessionId: string
): Promise<string> {
  const traceId   = crypto.randomUUID();
  const pipeSpan  = tracer.startSpan(traceId, "customer_message_pipeline", "pipeline");

  // Step 1: Classification
  const classifySpan = tracer.startSpan(traceId, "intent_classification", "llm", pipeSpan.spanId);
  const classification = await classifyIntents(message);
  classifySpan.finish(classification, {
    model:        MODELS.fast,
    inputTokens:  60,
    outputTokens: 80,
    costUSD:      calculateCost(MODELS.fast, 60, 80),
    agentName:    "classifier",
    sessionId,
  });

  // Step 2: Parallel routing
  const routeSpan = tracer.startSpan(traceId, "parallel_routing", "agent", pipeSpan.spanId);
  const results   = await routeAndExecuteInstrumented(classification, traceId, routeSpan.spanId, sessionId);
  routeSpan.finish(results);

  // Step 3: Merge
  const mergeSpan  = tracer.startSpan(traceId, "response_merge", "llm", pipeSpan.spanId);
  const finalReply = await mergeResponses(message, results);
  mergeSpan.finish(finalReply, { model: MODELS.balanced, sessionId });

  pipeSpan.finish(finalReply);
  return finalReply;
}
```

---

## 20.4 Langfuse Integration

Langfuse is the leading open-source observability platform for LLM applications. Export your traces:

```typescript
import Langfuse from "langfuse";

const langfuse = new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY!,
  secretKey: process.env.LANGFUSE_SECRET_KEY!,
  baseUrl:   process.env.LANGFUSE_BASE_URL ?? "https://cloud.langfuse.com",
});

async function sendTraceToLangfuse(traceId: string, spans: TraceSpan[]): Promise<void> {
  const root = spans.find(s => s.parentId === null)!;

  const trace = langfuse.trace({
    id:       traceId,
    name:     root.name,
    input:    root.input,
    output:   root.output,
    metadata: root.metadata,
  });

  for (const span of spans.filter(s => s.parentId !== null)) {
    if (span.type === "llm") {
      trace.generation({
        id:           span.spanId,
        parentObservationId: span.parentId ?? undefined,
        name:         span.name,
        startTime:    span.startTime,
        endTime:      span.endTime,
        model:        span.metadata.model,
        input:        span.input,
        output:       span.output,
        usage: {
          promptTokens:     span.metadata.inputTokens,
          completionTokens: span.metadata.outputTokens,
        },
        metadata: span.metadata,
      });
    } else {
      trace.span({
        id:           span.spanId,
        parentObservationId: span.parentId ?? undefined,
        name:         span.name,
        startTime:    span.startTime,
        endTime:      span.endTime,
        input:        span.input,
        output:       span.output,
        metadata:     span.metadata,
      });
    }
  }

  await langfuse.flushAsync();
}
```

---

## 20.5 Key Metrics to Track

| Metric | Definition | Alert threshold |
|--------|-----------|-----------------|
| `p50_latency_ms` | Median end-to-end response time | — |
| `p95_latency_ms` | 95th percentile latency | > 6,000 ms |
| `ttft_p95_ms` | Time to first token (95th pct) | > 800 ms |
| `error_rate` | % of requests that failed | > 2% |
| `tool_call_failure_rate` | % of tool calls returning errors | > 5% |
| `cost_per_session_usd` | Average cost per conversation | > $0.02 |
| `escalation_rate` | % of sessions escalated to human | > 20% |
| `avg_iterations` | Average ReAct loop iterations | > 5 |

---

## 20.6 Latency Breakdown Dashboard

Understanding *where* time is spent:

```typescript
function buildLatencyReport(traces: TraceSpan[][]): void {
  const byStep: Record<string, number[]> = {};

  for (const trace of traces) {
    for (const span of trace) {
      if (!byStep[span.name]) byStep[span.name] = [];
      byStep[span.name].push(span.durationMs);
    }
  }

  console.log("\n╔══════════════════════════════════════════╗");
  console.log("║          Latency Breakdown (p50/p95)      ║");
  console.log("╠══════════════════════════════════════════╣");
  for (const [step, times] of Object.entries(byStep)) {
    times.sort((a, b) => a - b);
    const p50 = times[Math.floor(times.length * 0.5)];
    const p95 = times[Math.floor(times.length * 0.95)];
    const label = step.padEnd(30);
    console.log(`║ ${label} ${p50}ms / ${p95}ms ║`);
  }
  console.log("╚══════════════════════════════════════════╝");
}
```

---

## 20.7 Cost Anomaly Detection

```typescript
function detectCostAnomalies(
  recentSessions: { sessionId: string; costUSD: number }[],
  normalMeanUSD: number,
  stdMultiplier: number = 3
): string[] {
  const costs  = recentSessions.map(s => s.costUSD);
  const mean   = costs.reduce((a, b) => a + b, 0) / costs.length;
  const stdDev = Math.sqrt(costs.map(c => (c - mean) ** 2).reduce((a, b) => a + b, 0) / costs.length);
  const threshold = normalMeanUSD + stdMultiplier * stdDev;

  return recentSessions
    .filter(s => s.costUSD > threshold)
    .map(s => `Session ${s.sessionId} cost $${s.costUSD.toFixed(5)} — ${((s.costUSD / normalMeanUSD) * 100).toFixed(0)}% of normal`);
}
```

---

## Chapter Summary

| Concept | Key point |
|---------|-----------|
| Trace span | traceId + spanId + parentId + timing + input/output + metadata |
| `Tracer` class | Records spans; `getTrace(traceId)` returns all spans for a request |
| Langfuse | Open-source observability; trace/generation/span API |
| Key metrics | p95 latency, TTFT, error rate, cost/session, escalation rate |
| Latency breakdown | Per-step p50/p95 shows exactly where time is lost |
| Cost anomaly | Z-score detection on per-session cost |

---

*Next: Chapter 21 — Performance Optimisation*
