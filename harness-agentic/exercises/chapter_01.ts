/**
 * Chapter 1 — What is an Agentic System?
 *
 * Run: tsx exercises/chapter_01.ts
 *
 * No API calls in this chapter — the exercises build mental models and
 * TypeScript interfaces that every later chapter imports from.
 */

// =============================================================================
// EXERCISE 1 — Define the core agent types
// =============================================================================
//
// TODO: Define a union type `AgentType` covering the four agent types from
//       section 1.4: "reactive", "stateful", "multi-agent", "autonomous"

type AgentType = never; // replace `never` with the correct union

// =============================================================================
// EXERCISE 2 — Model a Tool definition
// =============================================================================
//
// A tool has:
//   - name: string identifier
//   - description: what the tool does (shown to the LLM)
//   - parameters: a record of parameter names to their type and description
//   - execute: an async function that receives the params and returns a string
//
// TODO: Define the `ToolParameter` interface (type: "string" | "number" | "boolean", description: string)
// TODO: Define the `Tool` interface using `ToolParameter` above

interface ToolParameter {
  // TODO
}

interface Tool {
  // TODO
}

// =============================================================================
// EXERCISE 3 — Model an AgentMessage
// =============================================================================
//
// Agents maintain a conversation history. Each message has a role and content.
// Roles: "system" | "user" | "assistant" | "tool"
// Tool messages also carry a toolCallId and toolName.
//
// TODO: Define `MessageRole` as a union type
// TODO: Define `AgentMessage` as an interface with:
//       - role: MessageRole
//       - content: string
//       - toolCallId?: string   (only for role === "tool")
//       - toolName?: string     (only for role === "tool")

type MessageRole = never; // replace with union

interface AgentMessage {
  // TODO
}

// =============================================================================
// EXERCISE 4 — Model AgentConfig
// =============================================================================
//
// An agent needs to be configured before it runs. Define an `AgentConfig`
// interface with:
//   - type: AgentType
//   - model: string              (e.g. "anthropic/claude-3-haiku")
//   - systemPrompt: string
//   - tools: Tool[]
//   - maxIterations: number      (safety limit on the agent loop)
//   - maxTokensPerCall?: number  (optional cost guard)
//
// TODO: Implement AgentConfig

interface AgentConfig {
  // TODO
}

// =============================================================================
// EXERCISE 5 — Model AgentRunResult
// =============================================================================
//
// When an agent finishes a run it should return structured data, not just a
// string. Define `AgentRunResult<T>` as a generic interface with:
//   - output: T                  (the final answer — often a string, sometimes structured)
//   - iterations: number         (how many loop iterations were used)
//   - toolCallCount: number      (total tool calls made)
//   - inputTokens: number
//   - outputTokens: number
//   - durationMs: number
//
// TODO: Implement AgentRunResult<T>

interface AgentRunResult<T> {
  // TODO
}

// =============================================================================
// EXERCISE 6 — Build a sample agent config
// =============================================================================
//
// TODO: Create a const `orderStatusConfig` of type `AgentConfig` that
//       represents a reactive agent for order status lookups:
//         - model: "anthropic/claude-3-haiku"   (fast & cheap for simple lookups)
//         - systemPrompt: a brief instruction to look up order status using tools
//         - tools: one tool called "lookupOrder" that accepts an orderId (string)
//         - maxIterations: 5
//
// Hint: the execute function can just return a mock string for now.

const orderStatusConfig: AgentConfig = {
  // TODO
} as AgentConfig;

// =============================================================================
// EXERCISE 7 — Cost awareness: estimate token cost
// =============================================================================
//
// OpenRouter pricing is per million tokens. Write a function `estimateCost`
// that takes inputTokens, outputTokens, and a pricePerMillionTokens object,
// and returns the total cost in USD as a number rounded to 6 decimal places.
//
// pricePerMillionTokens shape: { input: number; output: number }
//
// TODO: Implement estimateCost

function estimateCost(
  inputTokens: number,
  outputTokens: number,
  pricing: { input: number; output: number }
): number {
  // TODO
  return 0;
}

// =============================================================================
// VERIFICATION — Run this to check your work
// =============================================================================

function verify(): void {
  // Exercise 1
  const t: AgentType = "reactive";
  console.assert(
    ["reactive", "stateful", "multi-agent", "autonomous"].includes(t),
    "Exercise 1: AgentType should include 'reactive'"
  );

  // Exercise 6
  console.assert(
    orderStatusConfig.type === "reactive",
    "Exercise 6: type should be 'reactive'"
  );
  console.assert(
    orderStatusConfig.tools.length >= 1,
    "Exercise 6: should have at least one tool"
  );
  console.assert(
    orderStatusConfig.maxIterations === 5,
    "Exercise 6: maxIterations should be 5"
  );

  // Exercise 7
  const cost = estimateCost(1000, 500, { input: 0.25, output: 1.25 });
  const expected = (1000 * 0.25) / 1_000_000 + (500 * 1.25) / 1_000_000;
  console.assert(
    Math.abs(cost - expected) < 0.000001,
    `Exercise 7: cost should be ~${expected.toFixed(6)}, got ${cost}`
  );

  console.log("Chapter 1 verification complete.");
}

verify();
