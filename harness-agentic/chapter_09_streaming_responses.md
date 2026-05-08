# Chapter 9 — Streaming Responses

## Learning Objectives

By the end of this chapter you will be able to:
- Use `streamText` to stream tokens as they are generated
- Pipe streaming responses to an HTTP client (Server-Sent Events)
- Handle streaming with tool calls in an agent loop
- Measure time-to-first-token (TTFT) and use it as a performance metric
- Choose between `generateText` and `streamText` for a given use case

---

## 9.1 Why Streaming Matters

Without streaming, the user sees nothing until the agent finishes — which for a multi-step agent can be 3–10 seconds. With streaming, they see the first word in under a second.

```
Without streaming:
  User sends message → [3 seconds of silence] → Full response appears at once

With streaming:
  User sends message → [800ms] → "Your order A88..." → "12 has been shi..." → ...
```

Streaming is not about making the agent faster — it makes it feel faster. Total time is the same; perceived latency is dramatically lower.

---

## 9.2 streamText — Basic Usage

```typescript
import { streamText } from "ai";

const result = streamText({
  model: openrouter(MODELS.balanced),
  system: systemPrompt,
  prompt: "Where is order A8812?",
  tools,
  maxSteps: 5,
});

// Stream tokens to the console
for await (const chunk of result.textStream) {
  process.stdout.write(chunk);
}
process.stdout.write("\n");

// After the stream completes, access final values
const text  = await result.text;
const usage = await result.usage;
console.log(`\nTokens: ${usage.totalTokens}`);
```

`result.textStream` is an `AsyncIterable<string>` — each chunk is a piece of the output text.

---

## 9.3 Streaming to HTTP — Server-Sent Events

In a web application, you stream to the client via Server-Sent Events (SSE). The Vercel AI SDK provides a `toDataStream()` helper for use in Next.js, Express, and any Node HTTP server:

```typescript
// Express endpoint
import express from "express";
import { streamText } from "ai";

const app = express();
app.use(express.json());

app.post("/api/chat", async (req, res) => {
  const { message, sessionId } = req.body;

  const result = streamText({
    model: openrouter(MODELS.balanced),
    system: CUSTOMER_SERVICE_SYSTEM_PROMPT,
    messages: await loadHistory(sessionId),
    tools,
    maxSteps: 5,
  });

  // Pipe to SSE response
  result.pipeDataStreamToResponse(res);
});
```

On the client (React with the `useChat` hook from `ai/react`):
```tsx
import { useChat } from "ai/react";

export function Chat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/chat",
  });
  // messages stream in token-by-token automatically
}
```

---

## 9.4 Streaming with Tool Calls

When `maxSteps > 1`, the agent may call tools during the stream. Text tokens stream; tool calls execute silently in the background:

```typescript
const result = streamText({
  model: openrouter(MODELS.balanced),
  system: systemPrompt,
  prompt: "Where is order A8812?",
  tools,
  maxSteps: 5,
  onChunk: ({ chunk }) => {
    if (chunk.type === "tool-call") {
      console.log(`[Tool call: ${chunk.toolName}]`);
    }
    if (chunk.type === "tool-result") {
      console.log(`[Tool result received]`);
    }
  },
});

for await (const text of result.textStream) {
  process.stdout.write(text);
}
```

The `onChunk` callback fires for every chunk — including tool call and result chunks. Use it for logging, observability, and debugging.

---

## 9.5 Measuring Time to First Token (TTFT)

TTFT is the most important latency metric for streaming. The performance SLA from Ch. 1 is: first token within 800ms.

```typescript
async function measureTTFT(prompt: string): Promise<{ ttftMs: number; totalMs: number }> {
  const start = Date.now();
  let firstTokenMs = 0;

  const result = streamText({
    model: openrouter(MODELS.fast),
    prompt,
    maxTokens: 100,
  });

  let firstToken = true;
  for await (const chunk of result.textStream) {
    if (firstToken && chunk.length > 0) {
      firstTokenMs = Date.now() - start;
      firstToken = false;
    }
  }

  return {
    ttftMs:  firstTokenMs,
    totalMs: Date.now() - start,
  };
}
```

---

## 9.6 Streaming Partial Results During Tool Calls

A common pattern: stream a "thinking" message while tools execute, then stream the final answer.

```typescript
const result = streamText({
  model: openrouter(MODELS.balanced),
  system: systemPrompt,
  prompt: userMessage,
  tools,
  maxSteps: 5,
  experimental_toolCallStreaming: true,  // stream tool call args as they're generated
});

for await (const chunk of result.fullStream) {
  switch (chunk.type) {
    case "text-delta":
      process.stdout.write(chunk.textDelta);
      break;
    case "tool-call-streaming-start":
      process.stdout.write(`\n[Looking up ${chunk.toolName}...]\n`);
      break;
    case "tool-result":
      process.stdout.write(`[Got result, composing response...]\n`);
      break;
    case "finish":
      console.log(`\n\nFinished. Reason: ${chunk.finishReason}`);
      break;
  }
}
```

---

## 9.7 Aborting Streams

Users sometimes navigate away or cancel a request. Always support abort:

```typescript
app.post("/api/chat", async (req, res) => {
  const abortController = new AbortController();
  req.on("close", () => abortController.abort());

  const result = streamText({
    model: openrouter(MODELS.balanced),
    messages: req.body.messages,
    tools,
    maxSteps: 5,
    abortSignal: abortController.signal,
  });

  result.pipeDataStreamToResponse(res);
});
```

Without abort signal, a disconnected client keeps the server burning tokens and API credits.

---

## 9.8 generateText vs. streamText — Decision Guide

| Use `generateText` when | Use `streamText` when |
|------------------------|----------------------|
| Building server-side pipelines | Response goes directly to a user |
| Result feeds into another step | Perceived latency matters |
| Testing and evaluation | Building a chat UI |
| Batch processing | Server-Sent Events endpoint |
| The full response is needed before acting | Partial output is useful to the user |

For the portfolio project, every customer-facing endpoint uses `streamText`. Internal pipeline steps (intent classification, slot extraction, tool orchestration) use `generateText`.

---

## 9.9 Performance — Streaming and TTFT

Typical TTFT values by model (approximate, depends on load):

| Model | TTFT (p50) | TTFT (p95) |
|-------|-----------|-----------|
| claude-3-haiku | 300–500 ms | 600–800 ms |
| claude-3-5-sonnet | 400–700 ms | 800–1200 ms |
| gpt-4o-mini | 200–400 ms | 500–700 ms |

To hit the < 800ms TTFT SLA:
- Use a fast model for the first streamed response
- Start streaming before all tool calls complete (stream partial synthesis early)
- Put the model's API region close to your server (check OpenRouter's routing)

---

## Chapter Summary

| Concept | Key point |
|---------|-----------|
| `streamText` | Returns an async iterable of text chunks |
| `textStream` | The chunk-by-chunk text output |
| `fullStream` | All chunk types including tool calls, results, errors |
| `pipeDataStreamToResponse` | Express/Node SSE integration |
| TTFT | Time to first token — key UX metric, target < 800ms |
| Abort signal | Always wire up; saves tokens on client disconnect |
| When to stream | Any customer-facing response; use `generateText` for pipeline steps |

---

*Next: Chapter 10 — Error Handling & Retries*
