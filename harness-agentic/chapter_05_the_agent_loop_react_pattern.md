# Chapter 5 — The Agent Loop — ReAct Pattern

## Learning Objectives

By the end of this chapter you will be able to:
- Explain the ReAct (Reason + Act) pattern and why it works
- Build a complete agent loop from scratch without relying on `maxSteps`
- Implement termination conditions and iteration guards
- Handle parallel tool calls in a single step
- Understand when to use the SDK's built-in loop vs. a custom loop

---

## 5.1 What is ReAct?

ReAct stands for **Re**asoning and **Act**ing. It is a prompting pattern introduced in a 2022 paper where the model is asked to interleave:

- **Thought** — reasoning about the current state ("I need to look up the order")
- **Action** — a tool call or external operation
- **Observation** — the result of that action

The cycle repeats until the model produces a final answer.

```
Thought:  The customer asked about order A8812. I should look it up.
Action:   lookupOrder({ orderId: "A8812" })
Observation: { status: "shipped", eta: "2026-05-12", carrier: "UPS" }
Thought:  The order is shipped. I can now answer the customer.
Answer:   Your order A8812 has been shipped via UPS and is due to arrive on 12 May 2026.
```

Modern LLMs implement the Act step via tool calls (Ch. 4). The Thought step happens implicitly in the model's reasoning. You can make it explicit via scratchpad prompting (covered in Ch. 6).

---

## 5.2 The Loop — Conceptually

```typescript
async function runAgentLoop(
  messages: CoreMessage[],
  tools: Record<string, Tool>,
  maxIterations: number,
): Promise<string> {
  let iteration = 0;

  while (iteration < maxIterations) {
    iteration++;

    // 1. Ask the model what to do next
    const response = await callLLM(messages, tools);

    // 2. Did the model produce a final answer?
    if (response.type === "text") {
      return response.text;   // Done
    }

    // 3. Model wants to call tools — execute them
    if (response.type === "tool-calls") {
      const toolResults = await executeTools(response.toolCalls, tools);
      messages = appendToolResults(messages, response, toolResults);
      // Loop back — send results to the model
      continue;
    }
  }

  throw new Error(`Agent exceeded max iterations (${maxIterations})`);
}
```

This is the essence of every agent framework: a while loop that continues until the model produces text (no more tool calls) or we hit a safety limit.

---

## 5.3 The Vercel AI SDK Built-In Loop

`generateText` with `maxSteps` is the SDK's built-in agent loop. Each "step" is one Thought → Act → Observe cycle:

```typescript
import { generateText } from "ai";

const result = await generateText({
  model: openrouter(MODELS.balanced),
  system: SYSTEM_PROMPT,
  prompt: "Where is order A8812 and can I get the door hinge for XR-200?",
  tools,
  maxSteps: 10,                 // Up to 10 tool call cycles
  onStepFinish: (step) => {
    console.log(`Step ${step.stepType}:`, step.text || step.toolCalls?.[0]?.toolName);
  },
});

console.log("Final answer:", result.text);
console.log("Steps used:", result.steps.length);
console.log("Total tokens:", result.usage.totalTokens);
```

`result.steps` gives you the full trace — each step's tool calls, results, and text. This is the data you send to your observability system (Ch. 20).

---

## 5.4 Building a Custom Loop

Sometimes you need more control than `maxSteps` provides — custom stopping conditions, dynamic tool registration, cost-gated iteration. Here is a full custom loop:

```typescript
import { generateText } from "ai";
import type { CoreMessage, CoreToolMessage, CoreAssistantMessage } from "ai";

interface AgentLoopOptions {
  model: string;
  systemPrompt: string;
  tools: Record<string, ReturnType<typeof tool>>;
  maxIterations?: number;
  maxCostUSD?: number;
  onIteration?: (iteration: number, toolName?: string) => void;
}

interface LoopResult {
  answer: string;
  iterations: number;
  totalTokens: number;
  estimatedCostUSD: number;
}

async function runAgentLoop(
  userMessage: string,
  options: AgentLoopOptions
): Promise<LoopResult> {
  const { model, systemPrompt, tools, maxIterations = 10, maxCostUSD = 0.10 } = options;

  let messages: CoreMessage[] = [
    { role: "system",  content: systemPrompt },
    { role: "user",    content: userMessage  },
  ];

  let totalTokens = 0;
  let estimatedCostUSD = 0;
  let iteration = 0;

  while (iteration < maxIterations) {
    iteration++;

    // Cost guard — abort if we're spending too much
    if (estimatedCostUSD > maxCostUSD) {
      return {
        answer: "I'm sorry, I couldn't complete this request within the allowed budget.",
        iterations: iteration,
        totalTokens,
        estimatedCostUSD,
      };
    }

    // One LLM call — note maxSteps: 1 means no automatic looping
    const response = await generateText({
      model: openrouter(model),
      messages,
      tools,
      maxSteps: 1,
    });

    totalTokens    += response.usage.totalTokens;
    estimatedCostUSD += approximateCost(model, response.usage);

    options.onIteration?.(iteration, response.toolCalls?.[0]?.toolName);

    // Terminal condition: model produced text (no tool calls)
    if (response.text && response.toolCalls.length === 0) {
      return { answer: response.text, iterations: iteration, totalTokens, estimatedCostUSD };
    }

    // Append the assistant's tool call request and results to history
    const assistantMessage: CoreAssistantMessage = {
      role: "assistant",
      content: response.toolCalls.map(tc => ({
        type: "tool-call" as const,
        toolCallId: tc.toolCallId,
        toolName: tc.toolName,
        args: tc.args,
      })),
    };

    const toolMessages: CoreToolMessage[] = response.toolResults.map(tr => ({
      role: "tool" as const,
      content: [{ type: "tool-result" as const, toolCallId: tr.toolCallId, result: tr.result }],
    }));

    messages = [...messages, assistantMessage, ...toolMessages];
  }

  throw new Error(`Agent exceeded maximum iterations (${maxIterations})`);
}
```

---

## 5.5 Parallel Tool Calls

Modern models can request multiple tool calls in a single step. The SDK handles this automatically — `response.toolCalls` will be an array with more than one item.

Your execute functions should handle this gracefully. With the built-in SDK loop, parallel calls are executed in parallel automatically. In a custom loop, execute them in parallel with `Promise.all`:

```typescript
if (response.toolCalls.length > 0) {
  // Execute all tool calls in parallel
  const results = await Promise.all(
    response.toolCalls.map(async tc => {
      const toolFn = tools[tc.toolName];
      if (!toolFn) return { toolCallId: tc.toolCallId, result: "Tool not found" };
      try {
        const result = await toolFn.execute(tc.args);
        return { toolCallId: tc.toolCallId, result };
      } catch (err) {
        return { toolCallId: tc.toolCallId, result: `Error: ${(err as Error).message}` };
      }
    })
  );
  // append results to messages...
}
```

Parallel tool execution is a key performance lever — Chapter 21 covers it in depth.

---

## 5.6 Termination Conditions

An agent loop needs clear stopping rules:

| Condition | Why | Implementation |
|-----------|-----|----------------|
| Model produces text with no tool calls | Normal completion | `if (response.text && toolCalls.length === 0)` |
| Max iterations reached | Safety — prevent infinite loops | `while (iteration < maxIterations)` |
| Max cost exceeded | Budget guard | Track tokens, compare to limit |
| Max time exceeded | Latency SLA | Track elapsed ms, abort if over limit |
| Error threshold | Too many consecutive tool failures | Count failures, abort if > N |

Always set at least `maxIterations`. A runaway loop will cost money and degrade performance.

---

## 5.7 The Agent Loop and Streaming

The loop as described waits for a full LLM response before executing tools. This means the user sees nothing until the agent finishes.

`streamText` solves this — the model's text tokens stream to the user while the loop continues internally. Chapter 9 covers streaming in full. The pattern:

```
User sends message
  → Agent starts looping (tools executing in background)
  → Model text streams to user as tokens arrive
  → When all tools are done, final synthesis streams to user
```

---

## 5.8 ReAct Trace — Reading the Steps

```typescript
const result = await generateText({
  model: openrouter(MODELS.balanced),
  system: systemPrompt,
  prompt: "Where is order A8812 and do you have a hinge for the XR-200?",
  tools,
  maxSteps: 10,
});

for (const step of result.steps) {
  if (step.toolCalls.length > 0) {
    for (const tc of step.toolCalls) {
      console.log(`  → Tool call: ${tc.toolName}(${JSON.stringify(tc.args)})`);
    }
    for (const tr of step.toolResults) {
      console.log(`  ← Result: ${String(tr.result).slice(0, 100)}`);
    }
  } else {
    console.log(`  Final answer: ${step.text.slice(0, 100)}`);
  }
}
```

This trace is your debugging interface. In production, it feeds your observability system (Ch. 20).

---

## 5.9 Performance — Iteration Cost

Each iteration is one LLM call. Latency compounds:

| Iterations | Typical latency |
|-----------|----------------|
| 1 | 0.5–1 s |
| 3 | 1.5–3 s |
| 5 | 3–6 s |
| 10 | 6–15 s |

Design your agent to complete in the fewest iterations possible:
- Give the model enough context upfront to avoid unnecessary lookups
- Use `toolChoice: "required"` to force tool use when you know it's needed
- Use parallel tool calls when multiple pieces of information are needed simultaneously
- Set `maxSteps` to the minimum that reliably completes the task on your test set

---

## Chapter Summary

| Concept | Key point |
|---------|-----------|
| ReAct | Reason + Act: interleaved thinking and tool calling |
| Agent loop | while(not done) { call LLM → execute tools → repeat } |
| `maxSteps` | SDK built-in loop control — use for most cases |
| Custom loop | More control: cost guards, dynamic tools, custom stop conditions |
| Parallel tool calls | Model can request multiple tools in one step — execute with `Promise.all` |
| Termination | Always guard: max iterations, max cost, max time |
| `result.steps` | Full ReAct trace — the debugging and observability payload |

---

> **Python Sidebar**
>
> LangGraph implements the ReAct loop as an explicit state machine graph:
> ```python
> from langgraph.prebuilt import create_react_agent
> agent = create_react_agent(model, tools)
> result = agent.invoke({"messages": [HumanMessage("Where is order A8812?")]})
> ```
> LangGraph's graph-based approach makes complex branching and conditional loops more explicit than the SDK's `maxSteps`, at the cost of more setup. Use it when your loop logic is more complex than linear.

---

*Next: Chapter 6 — Prompt Engineering for Agents*
