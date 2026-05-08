# Chapter 17 — Human Handoff & Escalation

## Learning Objectives

By the end of this chapter you will be able to:
- Detect when an agent should escalate to a human
- Package conversation context for a human agent
- Integrate with a CRM webhook (Zendesk / Freshdesk pattern)
- Handle graceful re-entry when the human resolves and passes back
- Define clear escalation triggers with confidence thresholds

---

## 17.1 Why Human Handoff?

Agents cannot resolve everything. Hard limits:
- Customer is distressed and needs empathy a scripted agent can't provide
- Request requires discretionary decision-making outside documented policy
- Legal or compliance issues (refund disputes, data deletion requests)
- The agent has failed 2+ times on the same issue
- Customer explicitly requests a human

The goal of handoff: **zero information loss**. The human agent receives full context — conversation history, classified intents, extracted entities, what was tried, and why the agent is escalating.

---

## 17.2 Escalation Triggers

```typescript
type EscalationReason =
  | "customer_requested"
  | "sentiment_very_negative"
  | "legal_threat"
  | "multiple_failed_attempts"
  | "out_of_policy"
  | "low_confidence"
  | "compliance_request";

interface EscalationSignals {
  sentiment:        "positive" | "neutral" | "frustrated" | "angry";
  containsLegalLanguage: boolean;
  failedAttempts:   number;
  agentConfidence:  number;
  customerExplicit: boolean;  // customer said "speak to a human"
}

function shouldEscalate(signals: EscalationSignals): EscalationReason | null {
  if (signals.customerExplicit)                      return "customer_requested";
  if (signals.containsLegalLanguage)                 return "legal_threat";
  if (signals.sentiment === "angry")                 return "sentiment_very_negative";
  if (signals.failedAttempts >= 2)                   return "multiple_failed_attempts";
  if (signals.agentConfidence < 0.4)                 return "low_confidence";
  return null;
}
```

---

## 17.3 Detecting Escalation Signals

Use `generateObject` to classify the conversation state:

```typescript
const EscalationAssessmentSchema = z.object({
  shouldEscalate:         z.boolean(),
  reason:                 EscalationReasonSchema.nullable(),
  summary:                z.string().describe("2-3 sentence summary of the conversation for the human agent"),
  customerName:           z.string().nullable(),
  extractedEntities:      z.object({
    orderId:     z.string().nullable(),
    partNumber:  z.string().nullable(),
    issueType:   z.string().nullable(),
  }),
  sentiment:              z.enum(["positive", "neutral", "frustrated", "angry"]),
  containsLegalLanguage:  z.boolean(),
  attemptedResolutions:   z.array(z.string()),
  recommendedPriority:    z.enum(["low", "normal", "high", "urgent"]),
});

async function assessEscalation(
  conversationHistory: CoreMessage[]
): Promise<z.infer<typeof EscalationAssessmentSchema>> {
  const { object } = await generateObject({
    model: openrouter(MODELS.fast),
    schema: EscalationAssessmentSchema,
    system: `Analyse this customer service conversation and determine if it should be escalated to a human agent.
Indicators for escalation: legal threats, anger, explicit requests, repeated failures, compliance topics.`,
    prompt: conversationHistory
      .filter(m => m.role !== "system")
      .map(m => `${m.role}: ${typeof m.content === "string" ? m.content : "[tool interaction]"}`)
      .join("\n"),
  });
  return object;
}
```

---

## 17.4 Building the Handoff Package

When escalation is triggered, package everything the human agent needs:

```typescript
interface HandoffPackage {
  ticketId:          string;
  sessionId:         string;
  createdAt:         Date;
  customer: {
    id:              string;
    name:            string | null;
    tier:            "standard" | "premium" | "enterprise";
  };
  escalationReason:  EscalationReason;
  priority:          "low" | "normal" | "high" | "urgent";
  summary:           string;
  conversationHistory: CoreMessage[];
  extractedEntities: Record<string, unknown>;
  attemptedResolutions: string[];
  agentConfidence:   number;
}

async function buildHandoffPackage(
  session: Session,
  assessment: z.infer<typeof EscalationAssessmentSchema>
): Promise<HandoffPackage> {
  return {
    ticketId:       `TKT-${Date.now()}`,
    sessionId:      session.id,
    createdAt:      new Date(),
    customer: {
      id:           session.customerId,
      name:         assessment.customerName,
      tier:         session.metadata.tier ?? "standard",
    },
    escalationReason:     assessment.reason ?? "low_confidence",
    priority:             assessment.recommendedPriority,
    summary:              assessment.summary,
    conversationHistory:  session.history,
    extractedEntities:    assessment.extractedEntities,
    attemptedResolutions: assessment.attemptedResolutions,
    agentConfidence:      0,  // populated by caller
  };
}
```

---

## 17.5 CRM Webhook Integration

Sending the handoff package to a CRM (Zendesk pattern):

```typescript
async function createZendeskTicket(handoff: HandoffPackage): Promise<{ ticketId: string; url: string }> {
  const body = {
    ticket: {
      subject:   `[AI Escalation] ${handoff.escalationReason} — ${handoff.customer.name ?? "Unknown"}`,
      priority:  handoff.priority,
      status:    "open",
      requester: { name: handoff.customer.name ?? "Customer", email: `${handoff.customer.id}@customers.acme.com` },
      comment:   {
        body: buildZendeskDescription(handoff),
        public: false,
      },
      tags: ["ai-escalation", handoff.escalationReason, handoff.customer.tier],
      custom_fields: [
        { id: process.env.ZENDESK_SESSION_FIELD_ID, value: handoff.sessionId },
        { id: process.env.ZENDESK_AI_SUMMARY_FIELD_ID, value: handoff.summary },
      ],
    },
  };

  const res = await fetch(`https://${process.env.ZENDESK_SUBDOMAIN}.zendesk.com/api/v2/tickets.json`, {
    method:  "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Basic ${Buffer.from(`${process.env.ZENDESK_EMAIL}/token:${process.env.ZENDESK_API_TOKEN}`).toString("base64")}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`Zendesk API error: ${res.status}`);
  const data = await res.json() as { ticket: { id: number } };
  return {
    ticketId: String(data.ticket.id),
    url:      `https://${process.env.ZENDESK_SUBDOMAIN}.zendesk.com/agent/tickets/${data.ticket.id}`,
  };
}

function buildZendeskDescription(handoff: HandoffPackage): string {
  return `
**AI Agent Escalation Report**
Session: ${handoff.sessionId}
Reason: ${handoff.escalationReason}
Priority: ${handoff.priority}

**Summary**
${handoff.summary}

**Extracted Information**
${JSON.stringify(handoff.extractedEntities, null, 2)}

**Attempted Resolutions**
${handoff.attemptedResolutions.map(r => `- ${r}`).join("\n")}

**Conversation History** (last 5 messages)
${handoff.conversationHistory.slice(-5)
  .filter(m => m.role !== "system")
  .map(m => `${m.role.toUpperCase()}: ${typeof m.content === "string" ? m.content.slice(0, 200) : "[tool]"}`)
  .join("\n")}
`.trim();
}
```

---

## 17.6 Customer-Facing Handoff Message

When escalating, give the customer a clear, reassuring message:

```typescript
async function buildHandoffMessage(handoff: HandoffPackage): Promise<string> {
  const { text } = await generateText({
    model: openrouter(MODELS.fast),
    system: "You are Aria, Acme Corp customer service AI.",
    prompt: `
I'm escalating this conversation to a human agent because: ${handoff.escalationReason}.
The customer's tier is: ${handoff.customer.tier}.
The ticket has been created with priority: ${handoff.priority}.

Write a warm, reassuring message to the customer explaining:
1. That you're connecting them with a human agent
2. The reference number for their case (${handoff.ticketId})
3. Expected response time based on their tier (standard: 24h, premium: 4h, enterprise: 1h)
4. That the human agent has full context of the conversation

Keep it under 3 sentences. Professional and empathetic.
`,
    maxTokens: 150,
  });
  return text;
}
```

---

## 17.7 Re-Entry — Human Resolves and Passes Back

After the human resolves the issue, the session can optionally return to the AI agent:

```typescript
interface ReEntryContext {
  sessionId:    string;
  resolution:   string;
  humanAgentId: string;
  resolvedAt:   Date;
}

async function reEnterAgent(context: ReEntryContext): Promise<string> {
  const session = await loadSession(context.sessionId);
  if (!session) throw new Error("Session not found");

  // Append the human resolution as context
  const resolutionMessage: CoreMessage = {
    role: "system",
    content: `[Human agent ${context.humanAgentId} resolved this case at ${context.resolvedAt.toISOString()}]
Resolution: ${context.resolution}
The AI agent may now close out the conversation with the customer.`,
  };

  const updatedHistory: CoreMessage[] = [...session.history, resolutionMessage];

  const { text } = await generateText({
    model: openrouter(MODELS.fast),
    messages: updatedHistory,
    prompt: "The human agent has resolved the issue. Close out the conversation warmly.",
    maxTokens: 150,
  });

  return text;
}
```

---

## Chapter Summary

| Concept | Key point |
|---------|-----------|
| Escalation triggers | Customer request, legal, anger, repeated failures, low confidence |
| `assessEscalation` | `generateObject` to classify signals in real-time |
| Handoff package | Everything the human needs: history, summary, entities, attempted resolutions |
| CRM webhook | POST the package to Zendesk/Freshdesk/custom; store ticket ID |
| Customer message | Warm, reassuring; includes ticket ID and SLA based on tier |
| Re-entry | Human appended as system message; AI closes the conversation |

---

*Next: Chapter 18 — Cost Optimisation & Token Budgeting*
