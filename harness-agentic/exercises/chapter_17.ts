/**
 * Chapter 17 — Human Handoff & Escalation
 *
 * Run: tsx exercises/chapter_17.ts
 */

import { generateObject, generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import type { CoreMessage } from "ai";
import { z } from "zod";
import "dotenv/config";

const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY!,
});
const FAST     = "anthropic/claude-3-haiku";
const BALANCED = "anthropic/claude-3-5-sonnet";

// =============================================================================
// EXERCISE 1 — Escalation signal detector
// =============================================================================
//
// TODO: Define `EscalationReason` as a union type:
//   "customer_requested" | "sentiment_very_negative" | "legal_threat" |
//   "multiple_failed_attempts" | "out_of_policy" | "low_confidence" | "compliance_request"
//
// TODO: Define `EscalationSignals` interface with:
//   sentiment, containsLegalLanguage, failedAttempts, agentConfidence, customerExplicit
//
// TODO: Implement `shouldEscalate(signals)` returning EscalationReason | null

type EscalationReason = never; // TODO

interface EscalationSignals {
  // TODO
}

function shouldEscalate(signals: EscalationSignals): EscalationReason | null {
  // TODO — check each trigger in priority order
  return null;
}

// =============================================================================
// EXERCISE 2 — Escalation assessment via generateObject
// =============================================================================
//
// TODO: Define `EscalationAssessmentSchema` — a Zod schema with:
//   shouldEscalate (boolean), reason (nullable EscalationReason enum),
//   summary (string), sentiment (enum), containsLegalLanguage (boolean),
//   attemptedResolutions (string[]), recommendedPriority (enum)
//
// TODO: Implement `assessEscalation(history)` using generateObject + FAST model

const EscalationAssessmentSchema = z.object({
  // TODO
});

type EscalationAssessment = z.infer<typeof EscalationAssessmentSchema>;

async function assessEscalation(history: CoreMessage[]): Promise<EscalationAssessment> {
  // TODO
  return {} as EscalationAssessment;
}

// =============================================================================
// EXERCISE 3 — Handoff package builder
// =============================================================================
//
// TODO: Define `HandoffPackage` interface with the fields from section 17.4
//
// TODO: Implement `buildHandoffPackage(sessionId, customerId, tier, history, assessment)`
//       that constructs a complete HandoffPackage

interface HandoffPackage {
  // TODO
}

function buildHandoffPackage(
  sessionId:  string,
  customerId: string,
  tier:       "standard" | "premium" | "enterprise",
  history:    CoreMessage[],
  assessment: EscalationAssessment
): HandoffPackage {
  // TODO
  return {} as HandoffPackage;
}

// =============================================================================
// EXERCISE 4 — Customer-facing escalation message
// =============================================================================
//
// TODO: Implement `buildHandoffMessage(handoff)` that generates a warm,
//       professional message for the customer. It must include:
//         - Acknowledgement they're being connected to a human
//         - The ticket reference (use handoff.ticketId)
//         - Expected response time based on tier:
//             standard → 24 hours
//             premium  → 4 hours
//             enterprise → 1 hour
//       Use FAST model, maxTokens: 120.

async function buildHandoffMessage(handoff: HandoffPackage): Promise<string> {
  // TODO
  return "";
}

// =============================================================================
// EXERCISE 5 — Full escalation pipeline
// =============================================================================
//
// TODO: Implement `handleEscalationIfNeeded(sessionId, customerId, tier, history)`
//       that:
//   1. Calls assessEscalation on the history
//   2. If shouldEscalate is false, returns null (no escalation needed)
//   3. If true: builds the handoff package, generates the customer message,
//      logs "TICKET CREATED: [ticketId]" (simulating CRM webhook)
//      Returns { customerMessage: string, handoff: HandoffPackage }

async function handleEscalationIfNeeded(
  sessionId:  string,
  customerId: string,
  tier:       "standard" | "premium" | "enterprise",
  history:    CoreMessage[]
): Promise<{ customerMessage: string; handoff: HandoffPackage } | null> {
  // TODO
  return null;
}

// =============================================================================
// MAIN
// =============================================================================

async function main(): Promise<void> {
  // Exercise 1 — shouldEscalate
  const noEscalate  = shouldEscalate({ sentiment: "neutral", containsLegalLanguage: false, failedAttempts: 0, agentConfidence: 0.9, customerExplicit: false } as EscalationSignals);
  const legalTrigger = shouldEscalate({ sentiment: "frustrated", containsLegalLanguage: true, failedAttempts: 0, agentConfidence: 0.8, customerExplicit: false } as EscalationSignals);
  const angryTrigger = shouldEscalate({ sentiment: "angry", containsLegalLanguage: false, failedAttempts: 0, agentConfidence: 0.7, customerExplicit: false } as EscalationSignals);

  console.assert(noEscalate   === null,          "Exercise 1: no escalation for normal signals");
  console.assert(legalTrigger === "legal_threat", "Exercise 1: legal language triggers escalation");
  console.assert(angryTrigger !== null,           "Exercise 1: anger triggers escalation");
  console.log("Exercise 1 ✓ — escalation logic correct");

  // Exercise 2 — assessEscalation
  const angryHistory: CoreMessage[] = [
    { role: "system",    content: "You are Aria, customer service AI." },
    { role: "user",      content: "My order A8812 still hasn't arrived! I've been waiting 3 weeks. This is UNACCEPTABLE. I'm going to sue Acme Corp if this isn't resolved TODAY!" },
    { role: "assistant", content: "I understand your frustration. Let me look into order A8812 for you." },
    { role: "user",      content: "I want to speak to a real person RIGHT NOW. You're useless!" },
  ];

  console.log("\n=== Exercise 2: Escalation assessment ===");
  const assessment = await assessEscalation(angryHistory);
  console.log("Should escalate:", assessment.shouldEscalate);
  console.log("Reason:", assessment.reason);
  console.log("Sentiment:", assessment.sentiment);
  console.log("Summary:", assessment.summary?.trim());

  if (assessment.shouldEscalate) {
    // Exercise 3 — handoff package
    const handoff = buildHandoffPackage("sess-001", "cust-001", "standard", angryHistory, assessment);
    console.log("\nExercise 3 ✓ — HandoffPackage built, ticketId:", (handoff as { ticketId?: string }).ticketId);

    // Exercise 4 — customer message
    const message = await buildHandoffMessage(handoff);
    console.log("\n=== Exercise 4: Customer message ===");
    console.log(message.trim());
  }

  // Exercise 5 — full pipeline
  console.log("\n=== Exercise 5: Full escalation pipeline ===");
  const result = await handleEscalationIfNeeded("sess-002", "cust-002", "premium", angryHistory);
  if (result) {
    console.log("Escalated ✓");
    console.log("Customer message:", result.customerMessage.trim());
  } else {
    console.log("No escalation triggered");
  }

  // Test with a normal conversation — should NOT escalate
  const normalHistory: CoreMessage[] = [
    { role: "system",    content: "You are Aria." },
    { role: "user",      content: "Where is my order A8812?" },
    { role: "assistant", content: "Your order is shipped, ETA May 12." },
  ];
  const noResult = await handleEscalationIfNeeded("sess-003", "cust-003", "standard", normalHistory);
  console.assert(noResult === null, "Exercise 5: normal conversation should not escalate");
  console.log("Exercise 5 ✓ — normal conversation correctly not escalated");
}

main().catch(console.error);
