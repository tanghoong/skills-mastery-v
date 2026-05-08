/**
 * Chapter 7 — Structured Output with Zod
 *
 * Run: tsx exercises/chapter_07.ts
 */

import { generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import "dotenv/config";

const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY!,
});
const FAST     = "anthropic/claude-3-haiku";
const BALANCED = "anthropic/claude-3-5-sonnet";

// =============================================================================
// EXERCISE 1 — Simple intent + slot extraction
// =============================================================================
//
// TODO: Define `MessageExtractionSchema` — a Zod object schema with:
//   - intent: enum ["order_status", "delivery", "product_search", "return", "general"]
//   - orderId: nullable string with .describe()
//   - partNumber: nullable string with .describe()
//   - urgency: enum ["low", "medium", "high"] with .describe() explaining each level
//
// TODO: Implement `extractMessageInfo(message)` that uses generateObject with
//       the FAST model and returns the typed result.

const MessageExtractionSchema = z.object({
  // TODO
});

type MessageExtraction = z.infer<typeof MessageExtractionSchema>;

async function extractMessageInfo(message: string): Promise<MessageExtraction> {
  // TODO
  return {} as MessageExtraction;
}

// =============================================================================
// EXERCISE 2 — Nested product extraction
// =============================================================================
//
// TODO: Define `ProductSchema` — a Zod object with:
//   - name: string
//   - partNumber: string
//   - price: nonnegative number
//   - inStock: boolean
//   - compatibleWith: array of strings
//
// TODO: Implement `extractProducts(rawText)` using generateObject with
//       output: "array" and the BALANCED model.
//       Return the typed array of products.

const ProductSchema = z.object({
  // TODO
});

type Product = z.infer<typeof ProductSchema>;

async function extractProducts(rawText: string): Promise<Product[]> {
  // TODO
  return [];
}

// =============================================================================
// EXERCISE 3 — Confidence scoring
// =============================================================================
//
// TODO: Define `OrderIdExtractionSchema` with:
//   - orderId: nullable string
//   - confidence: number between 0 and 1 with .describe()
//   - reasoning: string — brief explanation of why this confidence level
//
// TODO: Implement `extractOrderIdWithConfidence(text)` using the FAST model.

const OrderIdExtractionSchema = z.object({
  // TODO
});

type OrderIdExtraction = z.infer<typeof OrderIdExtractionSchema>;

async function extractOrderIdWithConfidence(text: string): Promise<OrderIdExtraction> {
  // TODO
  return {} as OrderIdExtraction;
}

// =============================================================================
// EXERCISE 4 — Safe extraction with fallback
// =============================================================================
//
// TODO: Implement `safeExtract<T>(schema, prompt, fallback)` — a generic function
//       that wraps generateObject in a try/catch and returns the fallback on failure.
//       Use the FAST model.

async function safeExtract<T>(
  schema: z.ZodType<T>,
  prompt: string,
  fallback: T
): Promise<T> {
  // TODO
  return fallback;
}

// =============================================================================
// EXERCISE 5 — Multi-intent detection
// =============================================================================
//
// Some customer messages contain two separate requests. Build a schema that
// captures this and implement the extraction.
//
// TODO: Define `MultiIntentSchema` with:
//   - primaryIntent: same enum as Exercise 1
//   - secondaryIntent: same enum, but optional (z.optional())
//   - hasMultipleIntents: boolean
//   - extractedEntities: z.object with orderId and partNumber (both nullable)
//   - suggestedTools: array of enum ["lookupOrder", "searchProducts", "checkDelivery", "escalate"]
//
// TODO: Implement `detectMultipleIntents(message)` using the BALANCED model.

const MultiIntentSchema = z.object({
  // TODO
});

type MultiIntent = z.infer<typeof MultiIntentSchema>;

async function detectMultipleIntents(message: string): Promise<MultiIntent> {
  // TODO
  return {} as MultiIntent;
}

// =============================================================================
// MAIN
// =============================================================================

async function main(): Promise<void> {
  console.log("=== Exercise 1: Intent + slot extraction ===");
  const ex1 = await extractMessageInfo(
    "Where is my order A8812? It should have arrived yesterday!"
  );
  console.log("Intent:", ex1.intent);
  console.log("Order ID:", ex1.orderId);
  console.log("Urgency:", ex1.urgency);

  console.log("\n=== Exercise 2: Product extraction ===");
  const rawCatalogue = `
    XR-200 Door Handle — Part No: DH-XR200 — $49.99 — In Stock — Compatible with: XR-200, XR-210
    Hinge Set XR-200  — Part No: HS-XR200  — $29.99 — In Stock — Compatible with: XR-200
    Door Seal Kit      — Part No: DSK-001   — $19.99 — Out of Stock — Compatible with: XR-200, XR-300
  `;
  const products = await extractProducts(rawCatalogue);
  console.log(`Extracted ${products.length} products:`);
  products.forEach(p => console.log(`  ${p.name} (${p.partNumber}) — $${p.price} — ${p.inStock ? "In Stock" : "OOS"}`));

  console.log("\n=== Exercise 3: Confidence scoring ===");
  const c1 = await extractOrderIdWithConfidence("My order from last Tuesday hasn't arrived");
  console.log("Vague message — orderId:", c1.orderId, "| confidence:", c1.confidence);
  const c2 = await extractOrderIdWithConfidence("Order #A8812 is missing");
  console.log("Clear message  — orderId:", c2.orderId, "| confidence:", c2.confidence);

  console.log("\n=== Exercise 4: Safe extract fallback ===");
  const fallback: MessageExtraction = {
    intent: "general",
    orderId: null,
    partNumber: null,
    urgency: "low",
  } as unknown as MessageExtraction;
  const safe = await safeExtract(MessageExtractionSchema, "Hello, I need help", fallback);
  console.log("Safe result intent:", safe.intent);

  console.log("\n=== Exercise 5: Multi-intent detection ===");
  const multi = await detectMultipleIntents(
    "Where is order A8812? Also, do you have a hinge set for the XR-200?"
  );
  console.log("Has multiple intents:", multi.hasMultipleIntents);
  console.log("Primary:", multi.primaryIntent, "| Secondary:", multi.secondaryIntent);
  console.log("Suggested tools:", multi.suggestedTools);
}

main().catch(console.error);
