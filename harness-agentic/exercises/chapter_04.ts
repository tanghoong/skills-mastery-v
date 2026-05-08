/**
 * Chapter 4 — Tool Use & Function Calling
 *
 * Run: tsx exercises/chapter_04.ts
 */

import { generateText, tool } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import "dotenv/config";

const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY!,
});
const FAST    = "anthropic/claude-3-haiku";
const BALANCED = "anthropic/claude-3-5-sonnet";

// =============================================================================
// MOCK DATA — used by tool execute functions
// =============================================================================

interface Order {
  id: string;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  customerName: string;
  eta?: string;
  trackingNumber?: string;
  carrier?: string;
  items: Array<{ name: string; quantity: number }>;
}

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
  "B4401": {
    id: "B4401",
    status: "processing",
    customerName: "Bob Smith",
    items: [{ name: "Hinge Set XR-200", quantity: 2 }],
  },
  "C9901": {
    id: "C9901",
    status: "delivered",
    customerName: "Carol White",
    items: [{ name: "Door Seal Kit", quantity: 1 }],
  },
};

interface Product {
  id: string;
  name: string;
  partNumber: string;
  compatibleWith: string[];
  inStock: boolean;
  price: number;
}

const PRODUCTS: Product[] = [
  { id: "P001", name: "XR-200 Door Handle", partNumber: "DH-XR200", compatibleWith: ["XR-200", "XR-210"], inStock: true,  price: 49.99 },
  { id: "P002", name: "Hinge Set XR-200",   partNumber: "HS-XR200", compatibleWith: ["XR-200"],           inStock: true,  price: 29.99 },
  { id: "P003", name: "Door Seal Kit",       partNumber: "DSK-001",  compatibleWith: ["XR-200", "XR-300"], inStock: false, price: 19.99 },
];

// =============================================================================
// EXERCISE 1 — Define the lookupOrder tool
// =============================================================================
//
// TODO: Define `lookupOrderTool` using the `tool()` helper with:
//   - description: explains what the tool does
//   - parameters: z.object with `orderId` (string with .describe())
//   - execute: looks up from ORDERS by orderId (case-insensitive).
//     Returns JSON.stringify of the order if found, or an error message if not.

const lookupOrderTool = tool({
  description: "", // TODO
  parameters: z.object({
    // TODO
  }),
  execute: async (args) => {
    // TODO
    return "not implemented";
  },
});

// =============================================================================
// EXERCISE 2 — Define the searchProducts tool
// =============================================================================
//
// TODO: Define `searchProductsTool` with:
//   - description: explains it searches the product catalogue
//   - parameters: z.object with `query` (string) — product name or part number
//   - execute: filters PRODUCTS where name or partNumber includes the query (case-insensitive)
//     Returns JSON.stringify of the matching products array (empty array if none)

const searchProductsTool = tool({
  description: "", // TODO
  parameters: z.object({
    // TODO
  }),
  execute: async (args) => {
    // TODO
    return "not implemented";
  },
});

// =============================================================================
// EXERCISE 3 — Single-tool agent: order status
// =============================================================================
//
// TODO: Implement `getOrderStatus(customerMessage)` that:
//   - Uses the FAST model
//   - Has a system prompt for a customer service agent
//   - Provides `lookupOrderTool`
//   - Sets maxSteps: 3
//   - Returns the final text response

async function getOrderStatus(customerMessage: string): Promise<string> {
  // TODO
  return "";
}

// =============================================================================
// EXERCISE 4 — Multi-tool agent
// =============================================================================
//
// TODO: Implement `customerServiceAgent(customerMessage)` that:
//   - Uses the BALANCED model
//   - Has a good system prompt
//   - Provides BOTH lookupOrderTool and searchProductsTool
//   - Sets maxSteps: 5
//   - Logs each tool call via onStepFinish (tool name + first 80 chars of result)
//   - Returns the final text

async function customerServiceAgent(customerMessage: string): Promise<string> {
  // TODO
  return "";
}

// =============================================================================
// EXERCISE 5 — Tool with error handling
// =============================================================================
//
// TODO: Define `checkDeliveryTool` that:
//   - Takes trackingNumber (string) and carrier ("ups" | "fedex" | "dhl" | "auspost")
//   - Simulates an external API call that:
//     • Succeeds and returns "In transit, ETA: 2026-05-12" for UPS/FedEx
//     • Returns an error JSON for DHL (simulate outage)
//     • Returns delivered status for AusPost
//   - Wraps logic in try/catch — never throws, always returns a string

const checkDeliveryTool = tool({
  description: "", // TODO
  parameters: z.object({
    // TODO
  }),
  execute: async (args) => {
    // TODO
    return "not implemented";
  },
});

// =============================================================================
// MAIN
// =============================================================================

async function main(): Promise<void> {
  console.log("=== Exercise 3: Order status lookup ===");
  const reply1 = await getOrderStatus("Hi, I'm looking for order A8812. Where is it?");
  console.log(reply1.trim());

  console.log("\n=== Exercise 4: Multi-tool agent ===");
  const reply2 = await customerServiceAgent(
    "Where is order B4401, and do you have hinge replacements for the XR-200?"
  );
  console.log(reply2.trim());

  console.log("\n=== Exercise 5: Delivery check with error handling ===");
  const reply3 = await generateText({
    model: openrouter(FAST),
    system: "You are a customer service agent. Use tools to answer questions.",
    prompt: "Can you check the delivery status for tracking number 1Z999AA10123456784 via UPS?",
    tools: { checkDelivery: checkDeliveryTool },
    maxSteps: 3,
  });
  console.log(reply3.text.trim());
}

main().catch(console.error);
