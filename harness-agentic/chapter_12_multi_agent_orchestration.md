# Chapter 12 — Multi-Agent Orchestration

## Learning Objectives

By the end of this chapter you will be able to:
- Design an orchestrator + sub-agent architecture
- Pass context and tasks between agents via typed interfaces
- Execute sub-agents in parallel and collect their results
- Handle partial failures without failing the whole pipeline
- Apply the fan-out / fan-in pattern to the customer service use case

---

## 12.1 Why Multiple Agents?

A single generalist agent struggles at scale because:
- A single large system prompt becomes unwieldy
- Different tasks need different models (cheap for simple, expensive for complex)
- Sequential execution is too slow for multi-intent messages (Ch. 11)
- Specialised agents are easier to test, tune, and replace independently

Multi-agent orchestration separates **coordination** (the orchestrator's job) from **execution** (the sub-agents' job).

---

## 12.2 The Orchestrator Pattern

```
                    ┌─────────────────────┐
                    │    Orchestrator      │
                    │  (Balanced model)   │
                    │                     │
                    │  1. Receive message │
                    │  2. Classify intent │
                    │  3. Delegate tasks  │
                    │  4. Merge results   │
                    └──────────┬──────────┘
                               │ delegates
          ┌────────────────────┼───────────────────────┐
          ▼                    ▼                        ▼
  ┌───────────────┐   ┌──────────────────┐   ┌────────────────────┐
  │ Order Agent   │   │ Catalogue Agent   │   │ General Support    │
  │ (Fast model)  │   │ (Balanced model) │   │ Agent              │
  │               │   │                  │   │ (Fast model)       │
  └───────┬───────┘   └────────┬─────────┘   └────────────────────┘
          │                    │
    Order API            Vector Store
```

The orchestrator is a thin coordination layer. It knows *what* to delegate but not *how* to execute each task.

---

## 12.3 Typed Agent Interfaces

Define clear TypeScript interfaces for what agents receive and return:

```typescript
interface AgentTask {
  taskId:    string;
  type:      "order_status" | "product_search" | "delivery" | "general";
  payload:   Record<string, unknown>;
  sessionId: string;
  priority:  "normal" | "urgent";
}

interface AgentResult {
  taskId:    string;
  type:      AgentTask["type"];
  content:   string;
  success:   boolean;
  error?:    string;
  durationMs: number;
  model:     string;
  tokens:    number;
}
```

---

## 12.4 Sub-Agent as a Function

Each sub-agent is a pure async function: takes a task, returns a result.

```typescript
async function orderStatusSubAgent(task: AgentTask): Promise<AgentResult> {
  const start = Date.now();
  const orderId = task.payload.orderId as string | undefined;

  if (!orderId) {
    return {
      taskId:     task.taskId,
      type:       "order_status",
      content:    "No order ID was provided. Please ask the customer for their order number.",
      success:    false,
      error:      "MISSING_ORDER_ID",
      durationMs: Date.now() - start,
      model:      MODELS.fast,
      tokens:     0,
    };
  }

  try {
    const { text, usage } = await generateText({
      model: openrouter(MODELS.fast),
      system: "You are an order status specialist. Use tools to look up orders.",
      prompt: `Look up status for order ${orderId}`,
      tools: { lookupOrder: lookupOrderTool },
      maxSteps: 3,
    });

    return {
      taskId: task.taskId, type: "order_status", content: text, success: true,
      durationMs: Date.now() - start, model: MODELS.fast, tokens: usage.totalTokens,
    };
  } catch (err) {
    return {
      taskId: task.taskId, type: "order_status", content: "Unable to retrieve order status.",
      success: false, error: (err as Error).message,
      durationMs: Date.now() - start, model: MODELS.fast, tokens: 0,
    };
  }
}
```

---

## 12.5 Fan-Out / Fan-In Pattern

The core multi-agent pattern: **fan out** tasks to sub-agents, then **fan in** results.

```typescript
type SubAgentFn = (task: AgentTask) => Promise<AgentResult>;

const SUB_AGENTS: Record<AgentTask["type"], SubAgentFn> = {
  order_status:   orderStatusSubAgent,
  product_search: catalogueSubAgent,
  delivery:       deliverySubAgent,
  general:        generalSupportSubAgent,
};

async function fanOut(tasks: AgentTask[]): Promise<AgentResult[]> {
  // Execute all tasks in parallel — fan-out
  const promises = tasks.map(task => {
    const agent = SUB_AGENTS[task.type];
    return agent(task).catch(err => ({
      taskId: task.taskId, type: task.type,
      content: "This part of your request could not be processed.",
      success: false, error: (err as Error).message,
      durationMs: 0, model: "", tokens: 0,
    } satisfies AgentResult));
  });

  // Collect results — fan-in
  return Promise.all(promises);
}
```

Note the `.catch()` on each task — a single sub-agent failure does not crash the entire pipeline.

---

## 12.6 The Orchestrator Implementation

```typescript
async function orchestrate(
  sessionId: string,
  message: string
): Promise<string> {
  // Step 1: Classify intents (from Ch. 11)
  const classification = await classifyIntents(message);

  if (classification.requiresHumanHandoff) {
    return escalateToHuman(message, classification);
  }

  // Step 2: Build tasks from classification
  const tasks: AgentTask[] = classification.intents
    .filter(i => i.confidence >= 0.7)
    .map(intent => ({
      taskId:    crypto.randomUUID(),
      type:      mapIntentToTaskType(intent.type),
      payload:   intent.entities,
      sessionId,
      priority:  classification.overallSentiment === "angry" ? "urgent" : "normal",
    }));

  // Step 3: Fan-out to sub-agents
  const results = await fanOut(tasks);

  // Step 4: Fan-in — merge results into unified reply
  return mergeAgentResults(message, results);
}

function mapIntentToTaskType(intentType: string): AgentTask["type"] {
  const map: Record<string, AgentTask["type"]> = {
    order_status:     "order_status",
    delivery_tracking: "delivery",
    product_search:   "product_search",
    compatibility:    "product_search",
    return:           "order_status",
    complaint:        "general",
    general:          "general",
  };
  return map[intentType] ?? "general";
}
```

---

## 12.7 Agent-to-Agent Communication

Sub-agents can call other sub-agents when they need specialised help:

```typescript
async function deliverySubAgent(task: AgentTask): Promise<AgentResult> {
  // First, get the order to find the tracking number
  const orderResult = await orderStatusSubAgent({
    ...task,
    type: "order_status",
    taskId: `${task.taskId}_sub`,
  });

  if (!orderResult.success) return orderResult;

  // Extract tracking number from order result
  const trackingNum = extractTrackingFromResult(orderResult.content);
  if (!trackingNum) {
    return { ...orderResult, content: "Order found but not yet shipped." };
  }

  // Now fetch delivery details
  // ...
}
```

Keep agent-to-agent calls to a minimum — they add latency and cost. Use them only when a sub-agent genuinely needs output from another agent to do its job.

---

## 12.8 Observability in Multi-Agent Pipelines

With multiple agents running in parallel, tracing becomes critical. Tag every result with the model, tokens, and duration:

```typescript
function logPipelineResult(
  results: AgentResult[],
  totalMs: number
): void {
  const totalTokens = results.reduce((sum, r) => sum + r.tokens, 0);
  const totalCost   = estimateCost(results);

  console.log(`Pipeline completed in ${totalMs}ms`);
  console.log(`Sub-agents: ${results.length} | Success: ${results.filter(r => r.success).length}`);
  console.log(`Total tokens: ${totalTokens} | Est. cost: $${totalCost.toFixed(5)}`);

  results.forEach(r => {
    const status = r.success ? "✓" : "✗";
    console.log(`  ${status} [${r.type}] ${r.durationMs}ms | ${r.tokens} tokens`);
  });
}
```

---

## 12.9 Performance — Parallel vs Sequential

| Scenario | Latency (estimate) |
|----------|-------------------|
| 3 agents sequential | 3 × 1.5s = 4.5s |
| 3 agents parallel | max(1.5s, 1.2s, 2.1s) = 2.1s |
| 3 agents parallel + merge | 2.1s + 0.8s = 2.9s |

Parallel execution is the primary performance lever for multi-agent systems. Chapter 21 goes deeper on optimisation strategies.

---

## Chapter Summary

| Concept | Key point |
|---------|-----------|
| Orchestrator | Coordinates; knows what to delegate, not how to execute |
| Sub-agent | Specialised; pure function: task in, result out |
| Fan-out / fan-in | Dispatch all tasks in parallel, collect results |
| Typed interfaces | `AgentTask` and `AgentResult` create clear contracts |
| Partial failure | `.catch()` on each task — one failure doesn't kill the pipeline |
| Agent-to-agent | Use sparingly — adds latency; only when genuinely needed |

---

*Next: Chapter 13 — RAG — Retrieval-Augmented Generation*
