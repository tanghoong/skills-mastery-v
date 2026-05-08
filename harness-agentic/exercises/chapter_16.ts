/**
 * Chapter 16 — Model Context Protocol (MCP)
 *
 * Run: tsx exercises/chapter_16.ts
 *
 * Note: Full MCP server exercises require:
 *   npm install @modelcontextprotocol/sdk
 *
 * Exercises 1-3 simulate MCP concepts without running an actual server process.
 * Exercise 4-5 implement a minimal MCP server + client if the SDK is installed.
 */

import { generateText, tool } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import "dotenv/config";

const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY!,
});
const FAST = "anthropic/claude-3-haiku";

// =============================================================================
// EXERCISE 1 — Simulate an MCP tool registry
// =============================================================================
//
// MCP tools are identified by a name and have a description + JSON schema.
// TODO: Define an `McpToolDefinition` interface with:
//   - name: string
//   - description: string
//   - inputSchema: { type: "object"; properties: Record<string, { type: string; description: string }> }
//
// TODO: Implement `McpToolRegistry` class with:
//   - register(def: McpToolDefinition, handler: (args: Record<string, unknown>) => Promise<string>)
//   - call(name: string, args: Record<string, unknown>): Promise<string>
//   - list(): McpToolDefinition[]

interface McpToolDefinition {
  // TODO
}

class McpToolRegistry {
  // TODO
  register(_def: McpToolDefinition, _handler: (args: Record<string, unknown>) => Promise<string>): void {}
  async call(_name: string, _args: Record<string, unknown>): Promise<string> { return "not implemented"; }
  list(): McpToolDefinition[] { return []; }
}

// =============================================================================
// EXERCISE 2 — Convert MCP registry to Vercel AI SDK tools
// =============================================================================
//
// TODO: Implement `mcpRegistryToTools(registry)` that converts an McpToolRegistry
//       into a Record<string, ReturnType<typeof tool>> suitable for use in generateText.
//       Each tool should:
//         - Use the MCP tool's description
//         - Accept a single `args` parameter (z.record(z.unknown()))
//         - Execute by calling registry.call(name, args)

function mcpRegistryToTools(
  registry: McpToolRegistry
): Record<string, ReturnType<typeof tool>> {
  // TODO
  return {};
}

// =============================================================================
// EXERCISE 3 — Build and populate a mock MCP server
// =============================================================================
//
// TODO: Build a `buildMockMcpServer()` function that:
//   1. Creates a McpToolRegistry
//   2. Registers two tools:
//      a. "lookup_order": takes { orderId: string }, returns mock order JSON
//      b. "search_products": takes { query: string }, returns mock product list
//   3. Returns the registry

function buildMockMcpServer(): McpToolRegistry {
  const registry = new McpToolRegistry();
  // TODO — register the two tools
  return registry;
}

// =============================================================================
// EXERCISE 4 — Agent using MCP registry tools
// =============================================================================
//
// TODO: Implement `agentWithMcp(userMessage)` that:
//   1. Builds the mock MCP server
//   2. Converts it to Vercel AI SDK tools using mcpRegistryToTools
//   3. Runs generateText with FAST model, the tools, maxSteps: 4
//   4. Returns the final text

async function agentWithMcp(userMessage: string): Promise<string> {
  // TODO
  return "";
}

// =============================================================================
// EXERCISE 5 — MCP resource simulation
// =============================================================================
//
// MCP resources are read-only data sources (not executable).
// TODO: Implement `McpResource` interface with: uri, name, description, mimeType
// TODO: Implement `fetchResource(resource)` that returns mock content based on URI:
//       "acme://catalogue"      → the product list as JSON string
//       "acme://faq"            → FAQ text
//       anything else           → error JSON

interface McpResource {
  // TODO
}

async function fetchResource(resource: McpResource): Promise<string> {
  // TODO
  return "";
}

// =============================================================================
// MAIN
// =============================================================================

async function main(): Promise<void> {
  // Exercise 1 — registry
  const registry = new McpToolRegistry();
  registry.register(
    {
      name: "ping",
      description: "Test tool",
      inputSchema: { type: "object", properties: { message: { type: "string", description: "msg" } } },
    } as McpToolDefinition,
    async ({ message }) => `pong: ${message}`
  );
  console.assert(registry.list().length === 1, "Exercise 1: registry has 1 tool");
  const pingResult = await registry.call("ping", { message: "hello" });
  console.assert(pingResult === "pong: hello", "Exercise 1: tool call works");
  console.log("Exercise 1 ✓ — MCP registry working");

  // Exercise 2 — conversion
  const sdkTools = mcpRegistryToTools(registry);
  console.assert("ping" in sdkTools, "Exercise 2: ping tool converted");
  console.log("Exercise 2 ✓ — registry converted to SDK tools");

  // Exercise 3 + 4 — agent with MCP
  console.log("\n=== Exercise 4: Agent with MCP tools ===");
  const reply1 = await agentWithMcp("Where is order A8812?");
  console.log("Reply 1:", reply1.trim());

  const reply2 = await agentWithMcp("Do you have hinge replacement parts?");
  console.log("Reply 2:", reply2.trim());

  // Exercise 5 — resources
  const catalogueResource: McpResource = {
    uri: "acme://catalogue",
    name: "Product Catalogue",
    description: "All available products",
    mimeType: "application/json",
  } as McpResource;
  const content = await fetchResource(catalogueResource);
  console.assert(content.length > 0, "Exercise 5: resource should return content");
  console.log("\nExercise 5 ✓ — resource fetch:", content.slice(0, 80));
}

main().catch(console.error);
