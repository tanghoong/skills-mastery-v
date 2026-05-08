# Chapter 7 — Structured Output with Zod

## Learning Objectives

By the end of this chapter you will be able to:
- Use `generateObject` to get typed, validated JSON from an LLM
- Design Zod schemas that guide model output reliably
- Choose between `generateObject` and tool-call-based extraction
- Validate and transform structured data from LLM responses
- Apply structured output to the product catalogue and order use cases

---

## 7.1 The Problem with Free-Form Text

LLMs return text. Text is hard to work with programmatically:

```typescript
const reply = await generateText({ prompt: "Extract the order ID from: 'My order A8812 hasn't arrived'" });
// reply.text might be: "The order ID is A8812"
//                  or: "A8812"
//                  or: "Order ID: A8812."
//                  or: "I found order ID 'A8812' in the message."
```

Every variation requires different parsing logic. And the model might format it differently on the next call.

**Structured output** solves this: you provide a schema, the model is constrained to return JSON that matches it, and the SDK validates the result before returning it to you.

---

## 7.2 generateObject — Basic Usage

```typescript
import { generateObject } from "ai";
import { z } from "zod";

const OrderExtraction = z.object({
  orderId:    z.string().nullable().describe("The order ID, or null if not mentioned"),
  intent:     z.enum(["status", "cancel", "return", "general"]),
  customerSentiment: z.enum(["positive", "neutral", "frustrated", "angry"]),
});

const { object } = await generateObject({
  model: openrouter(MODELS.fast),
  schema: OrderExtraction,
  prompt: "Extract from this message: 'I'm really frustrated, my order A8812 still hasn't arrived!'",
});

// object is typed as:
// { orderId: string | null; intent: "status" | "cancel" | "return" | "general"; customerSentiment: "positive" | ... }

console.log(object.orderId);           // "A8812"
console.log(object.intent);            // "status"
console.log(object.customerSentiment); // "frustrated"
```

`object` is fully typed and guaranteed to match the schema at runtime. If the model returns invalid JSON, the SDK throws.

---

## 7.3 Nested Objects and Arrays

```typescript
const ProductSearchResult = z.object({
  query:    z.string(),
  results:  z.array(z.object({
    name:       z.string(),
    partNumber: z.string(),
    inStock:    z.boolean(),
    price:      z.number().nonnegative(),
    compatible: z.array(z.string()).describe("List of compatible model codes"),
  })),
  totalFound: z.number().int().nonnegative(),
});

const { object } = await generateObject({
  model: openrouter(MODELS.balanced),
  schema: ProductSearchResult,
  system: "You are a product catalogue assistant. Extract structured product data.",
  prompt: `Given this raw catalogue text, extract structured product data:\n${rawCatalogueText}`,
});

// object.results is typed as Array<{ name: string; partNumber: string; ... }>
for (const product of object.results) {
  console.log(`${product.name} (${product.partNumber}) — ${product.inStock ? "In Stock" : "Out of Stock"}`);
}
```

---

## 7.4 Schema Design for Reliability

The better your schema, the more reliably the model fills it. Key principles:

### Use `.describe()` on every field
```typescript
z.object({
  orderId: z.string()
    .describe("The order ID exactly as the customer wrote it, e.g. 'A8812' or 'ORD-12345'"),
  confidence: z.number()
    .min(0).max(1)
    .describe("How confident you are this is the correct order ID (0.0 = guessing, 1.0 = certain)"),
})
```

### Use enums instead of open strings for controlled values
```typescript
// Bad — model might return "In Stock", "Available", "Yes", etc.
z.object({ availability: z.string() })

// Good — model chooses from exact options
z.object({ availability: z.enum(["in_stock", "out_of_stock", "backordered"]) })
```

### Use `.nullable()` for optional real-world data
```typescript
z.object({
  trackingNumber: z.string().nullable()
    .describe("Tracking number if the order has been shipped, null otherwise"),
})
```

### Add validation constraints
```typescript
z.object({
  price:      z.number().nonnegative(),
  quantity:   z.number().int().min(1).max(999),
  orderDate:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD"),
})
```

---

## 7.5 generateObject vs. Tool-Call Extraction

Two approaches to structured extraction. When to use each:

| Approach | When to use |
|----------|-------------|
| `generateObject` | You need structured output as the final result — no tool calls needed |
| Tool with Zod params | The extraction is a step inside an agent loop — the result feeds into more reasoning |

```typescript
// generateObject — good for: intent classification, slot extraction, data parsing
const { object } = await generateObject({
  model: openrouter(MODELS.fast),
  schema: IntentSchema,
  prompt: customerMessage,
});

// Tool-based extraction — good for: agent decides when to extract, result feeds loop
const extractOrderIdTool = tool({
  description: "Extract a structured order reference from natural language",
  parameters: z.object({ text: z.string() }),
  execute: async ({ text }) => {
    const { object } = await generateObject({ schema: OrderIdSchema, prompt: text, model: ... });
    return JSON.stringify(object);
  },
});
```

---

## 7.6 Partial Schemas and Optional Fields

Not every field will always be present. Model this explicitly:

```typescript
const MessageAnalysis = z.object({
  primaryIntent: z.enum(["order", "delivery", "product", "general", "complaint"]),
  secondaryIntent: z.enum(["order", "delivery", "product", "general", "complaint"]).optional()
    .describe("A second intent if the message contains two separate requests"),
  extractedIds: z.object({
    orderId:    z.string().optional(),
    partNumber: z.string().optional(),
    modelCode:  z.string().optional(),
  }),
  urgency: z.enum(["low", "medium", "high"])
    .describe("low = informational, medium = time-sensitive, high = angry or escalation needed"),
  suggestedTools: z.array(z.enum(["lookupOrder", "searchProducts", "checkDelivery", "escalate"]))
    .describe("The tools that should be called to resolve this message"),
});
```

This schema is the core of Chapter 11 (Intent Detection). The model classifies the message, extracts slots, and tells you which tools to call — all in one structured call.

---

## 7.7 `output: "array"` for Batch Extraction

```typescript
import { generateObject } from "ai";

const ProductSchema = z.object({
  name:       z.string(),
  partNumber: z.string(),
  price:      z.number(),
  inStock:    z.boolean(),
});

const { object: products } = await generateObject({
  model: openrouter(MODELS.balanced),
  output: "array",
  schema: ProductSchema,
  system: "Extract all products from the provided text as a JSON array.",
  prompt: rawProductListText,
});

// products is typed as Array<{ name: string; partNumber: string; ... }>
console.log(`Extracted ${products.length} products`);
```

`output: "array"` tells the SDK to expect a JSON array at the top level.

---

## 7.8 Error Handling for generateObject

```typescript
import { generateObject } from "ai";
import { z } from "zod";

async function safeExtract<T>(
  schema: z.ZodType<T>,
  prompt: string,
  fallback: T
): Promise<T> {
  try {
    const { object } = await generateObject({
      model: openrouter(MODELS.fast),
      schema,
      prompt,
    });
    return object;
  } catch (err) {
    console.error("Structured extraction failed:", err);
    return fallback;
  }
}
```

The most common failure mode is the model returning output that doesn't match the schema (especially for complex nested objects). If this happens frequently, simplify the schema or switch to a more capable model for that extraction.

---

## 7.9 Cost Awareness

`generateObject` is slightly more expensive than `generateText` because the SDK may retry if the model returns invalid JSON. In practice, a well-designed schema with a capable model fails rarely.

| Model | Cost for schema-constrained extraction (est.) |
|-------|-----------------------------------------------|
| claude-3-haiku + simple schema | ~$0.001 per 1000 extractions |
| claude-3-5-sonnet + complex schema | ~$0.010 per 1000 extractions |

Use the fast model for classification and simple extraction. Reserve the balanced model for complex nested schemas.

---

## Chapter Summary

| Concept | Key point |
|---------|-----------|
| `generateObject` | Returns typed, validated JSON — use for structured extraction |
| Zod schema | The contract between you and the model |
| `.describe()` | Essential — the model reads field descriptions |
| Enums over strings | Constrain model to exact values |
| `output: "array"` | Extract multiple items at once |
| vs. tool extraction | `generateObject` = final result; tool extraction = step in agent loop |
| Error handling | Wrap in try/catch; provide a typed fallback |

---

> **Python Sidebar**
>
> In Python, `instructor` wraps OpenAI-compatible APIs to add Pydantic schema enforcement:
> ```python
> import instructor
> from pydantic import BaseModel
>
> client = instructor.patch(openai.OpenAI(...))
>
> class OrderExtraction(BaseModel):
>     order_id: str | None
>     intent: Literal["status", "cancel", "return", "general"]
>
> result = client.chat.completions.create(
>     model="anthropic/claude-3-haiku",
>     response_model=OrderExtraction,
>     messages=[{"role": "user", "content": customer_message}],
> )
> ```
> The Vercel AI SDK's `generateObject` is the TypeScript equivalent.

---

*Next: Chapter 8 — Memory Patterns & Session Management*
