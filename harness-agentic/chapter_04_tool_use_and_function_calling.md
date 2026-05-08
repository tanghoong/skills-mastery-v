# Chapter 4 — Tool Use & Function Calling

## Learning Objectives

By the end of this chapter you will be able to:
- Define tools using the Vercel AI SDK's `tool()` helper with Zod schemas
- Understand the full tool call flow: definition → LLM request → execution → result
- Build multi-tool agents that choose the right tool for the job
- Handle tool errors gracefully without crashing the agent loop
- Connect to a real-world API (order management mock)

---

## 4.1 What is a Tool Call?

A tool call is a structured way for the LLM to request that your code execute a function. The flow is:

```
1. You send messages + tool definitions to the LLM
2. LLM responds with a tool call request (name + arguments)
3. Your code executes the function
4. You append the result as a "tool" message
5. LLM reads the result and continues reasoning
```

The LLM never directly executes code. It only decides **which tool to call** and **what arguments to pass**. Your code is always in control of execution.

```
┌──────────────────────────────────────────────────────┐
│                    Tool Call Flow                     │
│                                                       │
│  LLM ──► "Call lookupOrder({orderId: 'A8812'})"      │
│  Your code ──► calls the real function               │
│  Result ──► "Order A8812: Shipped, ETA 2026-05-12"   │
│  LLM ──► reads result, replies to user               │
└──────────────────────────────────────────────────────┘
```

---

## 4.2 Defining Tools with the Vercel AI SDK

```typescript
import { tool } from "ai";
import { z } from "zod";

const lookupOrderTool = tool({
  description: "Look up the status of a customer order by order ID",
  parameters: z.object({
    orderId: z.string().describe("The order ID, e.g. 'A8812'"),
  }),
  execute: async ({ orderId }) => {
    // This is where you call your real API
    const order = await orderManagementAPI.getOrder(orderId);
    if (!order) return `Order ${orderId} not found.`;
    return `Order ${orderId}: ${order.status}. ETA: ${order.eta}. Carrier: ${order.carrier}.`;
  },
});
```

Key points:
- `description` — shown to the LLM so it knows when to use this tool. Write it as if explaining to a colleague.
- `parameters` — a Zod schema. The LLM's arguments are validated against this before `execute` runs.
- `execute` — your actual function. Return a string (or JSON-serialisable value). The result becomes the `tool` message.

---

## 4.3 Wiring Tools into generateText

```typescript
import { generateText, tool } from "ai";
import { z } from "zod";

const { text, toolCalls, toolResults } = await generateText({
  model: openrouter(MODELS.fast),
  messages: history,
  tools: {
    lookupOrder: lookupOrderTool,
    checkDelivery: checkDeliveryTool,
  },
  maxSteps: 5,    // Allow up to 5 tool call + response cycles
});
```

`maxSteps` is critical: it controls how many Thought → Act → Observe cycles the SDK runs automatically before returning. Without it, the SDK executes only one step.

---

## 4.4 The Tool Call Lifecycle in Detail

When `maxSteps > 1`, the Vercel AI SDK handles the loop internally:

```
Step 1: LLM decides to call lookupOrder({ orderId: "A8812" })
Step 2: SDK executes your execute() function → gets order data
Step 3: SDK appends result as tool message, calls LLM again
Step 4: LLM reads the order data and produces the final reply
```

You can observe each step:

```typescript
const result = await generateText({
  model: openrouter(MODELS.fast),
  messages: history,
  tools: { lookupOrder: lookupOrderTool },
  maxSteps: 5,
  onStepFinish: ({ stepType, toolCalls, toolResults, text }) => {
    if (stepType === "tool-call") {
      console.log("Tool called:", toolCalls[0].toolName);
      console.log("Tool result:", toolResults[0].result);
    }
  },
});
```

---

## 4.5 Multiple Tools — The Agent Chooses

Give the agent multiple tools and it will choose the right one based on context:

```typescript
const tools = {
  lookupOrder: tool({
    description: "Look up order status by order ID",
    parameters: z.object({ orderId: z.string() }),
    execute: async ({ orderId }) => fetchOrderStatus(orderId),
  }),

  lookupProduct: tool({
    description: "Search the product catalogue by product name or part number",
    parameters: z.object({
      query: z.string().describe("Product name or part number to search for"),
    }),
    execute: async ({ query }) => searchProducts(query),
  }),

  checkDelivery: tool({
    description: "Check delivery status and ETA for a shipped order",
    parameters: z.object({
      trackingNumber: z.string(),
      carrier: z.enum(["fedex", "ups", "dhl", "auspost"]),
    }),
    execute: async ({ trackingNumber, carrier }) =>
      fetchDeliveryStatus(trackingNumber, carrier),
  }),
};

const { text } = await generateText({
  model: openrouter(MODELS.balanced),
  system: CUSTOMER_SERVICE_SYSTEM_PROMPT,
  prompt: "Where is order A8812 and what's the ETA?",
  tools,
  maxSteps: 5,
});
```

The model will call `lookupOrder` first, see that it is shipped, then potentially call `checkDelivery` with the tracking number from the order result.

---

## 4.6 Tool Choice Control

You can constrain which tools the model is allowed to use:

```typescript
// Force the model to use a specific tool
const { text } = await generateText({
  model: openrouter(MODELS.fast),
  messages: history,
  tools,
  toolChoice: { type: "tool", toolName: "lookupOrder" },
});

// Prevent tool use (text only)
const { text: text2 } = await generateText({
  model: openrouter(MODELS.fast),
  messages: history,
  tools,
  toolChoice: "none",
});

// Default: model decides
// toolChoice: "auto"
```

`toolChoice: "required"` forces the model to call at least one tool (useful for structured extraction pipelines).

---

## 4.7 Tool Error Handling

Tool `execute` functions can fail. Never let an unhandled error crash the agent:

```typescript
const safeOrderLookup = tool({
  description: "Look up order status",
  parameters: z.object({ orderId: z.string() }),
  execute: async ({ orderId }) => {
    try {
      const order = await orderAPI.getOrder(orderId);
      if (!order) return JSON.stringify({ error: "ORDER_NOT_FOUND", orderId });
      return JSON.stringify({ status: order.status, eta: order.eta });
    } catch (err) {
      // Return error as a string — the model will tell the user something went wrong
      return JSON.stringify({
        error: "API_UNAVAILABLE",
        message: "Order system is temporarily unavailable",
      });
    }
  },
});
```

Return errors as structured strings — never throw from `execute`. The model will read the error and respond appropriately to the user.

---

## 4.8 Zod Schema Best Practices for Tools

The quality of your Zod schema directly affects whether the LLM fills in arguments correctly:

```typescript
// Bad — LLM doesn't know what format orderId should be
parameters: z.object({
  orderId: z.string(),
})

// Good — explicit description guides the LLM
parameters: z.object({
  orderId: z.string()
    .describe("The order ID exactly as the customer provided it, e.g. 'A8812' or 'ORD-12345'"),
})

// Better — validation + description
parameters: z.object({
  orderId: z.string()
    .regex(/^[A-Z0-9-]+$/, "Order ID must be alphanumeric with optional hyphens")
    .describe("Order ID from the customer, e.g. 'A8812'"),
  includeHistory: z.boolean()
    .default(false)
    .describe("Whether to include the full order history or just the current status"),
})
```

Use `.describe()` on every field. The LLM uses these descriptions — alongside the tool's top-level `description` — to decide how to fill arguments.

---

## 4.9 Enterprise Pattern — Order Status Tool

A realistic order status tool for the course's primary use case:

```typescript
interface Order {
  id: string;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  customerName: string;
  eta?: string;
  trackingNumber?: string;
  carrier?: string;
  items: Array<{ name: string; quantity: number }>;
}

// Mock database
const ORDERS: Record<string, Order> = {
  "A8812": {
    id: "A8812",
    status: "shipped",
    customerName: "Alice Johnson",
    eta: "2026-05-12",
    trackingNumber: "1Z999AA10123456784",
    carrier: "ups",
    items: [{ name: "XR-200 Door Handle", quantity: 1 }],
  },
};

const lookupOrderTool = tool({
  description: "Retrieve current status, ETA, tracking, and items for a customer order",
  parameters: z.object({
    orderId: z.string().describe("The order ID as provided by the customer, e.g. 'A8812'"),
  }),
  execute: async ({ orderId }) => {
    const order = ORDERS[orderId.toUpperCase()];
    if (!order) {
      return JSON.stringify({ found: false, orderId, message: "Order not found. Check the order ID and try again." });
    }
    return JSON.stringify({ found: true, ...order });
  },
});
```

---

## 4.10 Security Note — Tool Inputs Are User-Controlled

The arguments passed to your tool's `execute` function come — ultimately — from the user's message. A malicious user could try to inject unexpected values.

**Always validate beyond Zod:**
```typescript
execute: async ({ orderId }) => {
  // Zod already validates format, but also check authorisation
  const order = await db.orders.findOne({ id: orderId, customerId: session.customerId });
  if (!order) return "Order not found or access denied.";
  // ...
}
```

Never use tool arguments in raw SQL queries, shell commands, or file paths without sanitising them first. Chapter 22 covers this in full.

---

## Chapter Summary

| Concept | Key point |
|---------|-----------|
| Tool definition | `tool({ description, parameters: ZodSchema, execute })` |
| Tool call flow | LLM requests → your code executes → result back to LLM |
| `maxSteps` | Controls how many tool call cycles run automatically |
| `onStepFinish` | Hook to observe each step (great for logging) |
| Tool choice | `"auto"`, `"none"`, `"required"`, or force a specific tool |
| Error handling | Return errors as strings from `execute`, never throw |
| Zod descriptions | Use `.describe()` on every field — the LLM reads them |
| Security | Always authorise access inside `execute`, don't trust args blindly |

---

> **Python Sidebar**
>
> In Python with LangChain, tools are defined as decorated functions:
> ```python
> from langchain.tools import tool
>
> @tool
> def lookup_order(order_id: str) -> str:
>     """Look up order status by order ID (e.g. 'A8812')"""
>     order = db.get_order(order_id)
>     return order.status if order else "Not found"
> ```
> LangGraph agents use tools the same way. The key difference: LangChain validates parameters via Pydantic instead of Zod, but the concepts are identical.

---

*Next: Chapter 5 — The Agent Loop — ReAct Pattern*
