# Chapter 11 — Intent Detection & Conversation Routing

## Learning Objectives

By the end of this chapter you will be able to:
- Classify multiple intents from a single customer message
- Extract structured slots (order IDs, part numbers, model codes) using `generateObject`
- Route classified intents to specialised sub-agents in parallel
- Merge multiple sub-agent responses into a single coherent reply
- Handle intent ambiguity and low-confidence classifications

---

## 11.1 The Problem: Multi-Intent Customer Messages

A customer rarely sends one clean, single-topic message. Real messages look like:

> "Hi, I'm waiting for order A8812 which still hasn't arrived. Also, does the XR-200 door model use the same hinges as the XR-210? I might need to order replacements."

This contains:
1. **Order status intent** — order A8812
2. **Product compatibility intent** — XR-200 vs XR-210 hinges

A single-agent approach handles this sequentially. The multi-intent approach routes both to the right specialist agents in parallel and merges the results.

---

## 11.2 Step 1 — Intent Classification

Use `generateObject` (Ch. 7) for fast, structured intent detection:

```typescript
import { generateObject } from "ai";
import { z } from "zod";

const IntentClassificationSchema = z.object({
  intents: z.array(z.object({
    type: z.enum(["order_status", "delivery_tracking", "product_search", "compatibility", "return", "complaint", "general"]),
    confidence: z.number().min(0).max(1),
    entities: z.object({
      orderId:       z.string().nullable(),
      trackingNum:   z.string().nullable(),
      partNumber:    z.string().nullable(),
      modelCode:     z.string().nullable(),
      productQuery:  z.string().nullable(),
    }),
  })).min(1).max(3).describe("All intents detected in the message, ordered by relevance"),
  requiresHumanHandoff: z.boolean()
    .describe("True if the customer is very upset, making legal threats, or the request is outside agent scope"),
  overallSentiment: z.enum(["positive", "neutral", "frustrated", "angry"]),
});

type IntentClassification = z.infer<typeof IntentClassificationSchema>;

async function classifyIntents(message: string): Promise<IntentClassification> {
  const { object } = await generateObject({
    model: openrouter(MODELS.fast),  // cheap model for classification
    schema: IntentClassificationSchema,
    system: `You are an intent classifier for Acme Corp customer service.
Identify ALL intents in the message. Extract any IDs, part numbers, or product names mentioned.
Order IDs look like: A8812, B4401, ORD-12345
Part numbers look like: DH-XR200, HS-XR200, DSK-001
Model codes look like: XR-200, XR-210, XR-300`,
    prompt: message,
  });
  return object;
}
```

---

## 11.3 Step 2 — Intent-to-Agent Mapping

Map each intent type to the appropriate agent:

```typescript
type IntentType = IntentClassification["intents"][number]["type"];

const INTENT_TO_HANDLER: Record<IntentType, (entities: IntentClassification["intents"][number]["entities"]) => Promise<string>> = {
  order_status:      ({ orderId }) => orderStatusAgent(orderId ?? ""),
  delivery_tracking: ({ orderId, trackingNum }) => deliveryAgent(orderId, trackingNum),
  product_search:    ({ productQuery, partNumber }) => catalogueAgent(productQuery ?? partNumber ?? ""),
  compatibility:     ({ modelCode, productQuery }) => catalogueAgent(`${modelCode} compatibility: ${productQuery}`),
  return:            ({ orderId }) => returnAgent(orderId ?? ""),
  complaint:         () => Promise.resolve("ESCALATE"),
  general:           ({ productQuery }) => generalAgent(productQuery ?? ""),
};
```

---

## 11.4 Step 3 — Parallel Sub-Agent Execution

When multiple intents are detected, handle them in parallel:

```typescript
async function routeAndExecute(
  classification: IntentClassification
): Promise<Array<{ intent: IntentType; result: string }>> {
  const highConfidenceIntents = classification.intents.filter(i => i.confidence >= 0.7);

  const tasks = highConfidenceIntents.map(async (intent) => {
    const handler = INTENT_TO_HANDLER[intent.type];
    const result = await handler(intent.entities);
    return { intent: intent.type, result };
  });

  // Execute all intent handlers in parallel
  return Promise.all(tasks);
}
```

Parallel execution means a message with two intents takes the time of the slowest sub-agent, not the sum of both — typically 2–4 seconds instead of 4–8.

---

## 11.5 Step 4 — Response Merging

The response merger combines multiple sub-agent results into one coherent reply:

```typescript
async function mergeResponses(
  originalMessage: string,
  results: Array<{ intent: IntentType; result: string }>
): Promise<string> {
  if (results.length === 1) return results[0].result;

  const context = results.map(r =>
    `[${r.intent.toUpperCase()}]: ${r.result}`
  ).join("\n\n");

  const { text } = await generateText({
    model: openrouter(MODELS.balanced),
    system: `You are Aria, customer service AI. Merge the following sub-agent responses
into a single, coherent reply for the customer. 
Rules: address all topics, don't repeat information, flow naturally, be concise.`,
    prompt: `Customer message: "${originalMessage}"\n\nSub-agent responses:\n${context}`,
    maxTokens: 400,
  });

  return text;
}
```

---

## 11.6 The Full Pipeline

```typescript
async function handleCustomerMessage(message: string): Promise<string> {
  const start = Date.now();

  // Step 1: Classify (fast model, ~300ms)
  const classification = await classifyIntents(message);

  // Step 2: Check for immediate escalation
  if (classification.requiresHumanHandoff) {
    return await escalateToHuman(message, classification);
  }

  // Step 3: Route and execute in parallel (slowest sub-agent latency, ~1-3s)
  const results = await routeAndExecute(classification);

  // Step 4: Merge (if multiple intents)
  const reply = await mergeResponses(message, results);

  console.log(`Handled in ${Date.now() - start}ms | Intents: ${classification.intents.map(i => i.type).join(", ")}`);

  return reply;
}
```

---

## 11.7 Slot Filling for Incomplete Entities

Sometimes the customer mentions an intent without providing the required entity:

> "Where is my order?"

No order ID. The agent should ask:

```typescript
async function handleOrderStatusIntent(
  entities: IntentClassification["intents"][number]["entities"],
  sessionHistory: CoreMessage[]
): Promise<string> {
  const orderId = entities.orderId
    ?? extractOrderIdFromHistory(sessionHistory);  // check if mentioned earlier

  if (!orderId) {
    return "I'd be happy to check your order status. Could you please provide your order number? It should look like 'A8812' or 'ORD-12345'.";
  }

  return orderStatusAgent(orderId);
}

function extractOrderIdFromHistory(history: CoreMessage[]): string | null {
  // Search recent history for an order ID pattern
  const orderIdPattern = /\b([A-Z]{1,3}-?\d{4,6})\b/g;
  for (const msg of history.slice().reverse()) {
    if (typeof msg.content === "string") {
      const match = msg.content.match(orderIdPattern);
      if (match) return match[0];
    }
  }
  return null;
}
```

---

## 11.8 Confidence Thresholds

Low confidence classifications lead to bad routing:

```typescript
const CONFIDENCE_THRESHOLDS = {
  act:      0.7,   // route to sub-agent
  clarify:  0.4,   // ask customer to clarify
  discard:  0.0,   // below 0.4: ignore this intent
} as const;

function processIntents(classification: IntentClassification): {
  highConfidence: typeof classification.intents;
  lowConfidence:  typeof classification.intents;
} {
  const high = classification.intents.filter(i => i.confidence >= CONFIDENCE_THRESHOLDS.act);
  const low  = classification.intents.filter(
    i => i.confidence >= CONFIDENCE_THRESHOLDS.clarify && i.confidence < CONFIDENCE_THRESHOLDS.act
  );
  return { highConfidence: high, lowConfidence: low };
}
```

If a low-confidence intent is detected, ask the customer before acting: "I noticed you might also be asking about [X]. Would you like me to look that up as well?"

---

## 11.9 Cost Awareness

The pipeline has three LLM calls:
1. Intent classification (fast model, ~150 tokens) — ~$0.0001
2. Sub-agent calls (fast/balanced depending on intent) — ~$0.001–0.005
3. Response merger (balanced model, ~400 tokens) — ~$0.005

Total per message: ~$0.006–0.01. At 10,000 messages/day: $60–100/day.

Use the fast model for classification — its accuracy on intent classification tasks is 85–95%, close to the balanced model, at 10× lower cost.

---

## Chapter Summary

| Concept | Key point |
|---------|-----------|
| Multi-intent classification | One `generateObject` call detects all intents in a message |
| Parallel routing | `Promise.all` across sub-agents matches slowest, not sum |
| Response merging | Single LLM call to merge results coherently |
| Slot filling | Check history before asking the customer to repeat info |
| Confidence thresholds | Act ≥ 0.7, clarify 0.4–0.7, discard < 0.4 |
| Fast model for classification | 85–95% accuracy at 10× lower cost than balanced model |

---

*Next: Chapter 12 — Multi-Agent Orchestration*
