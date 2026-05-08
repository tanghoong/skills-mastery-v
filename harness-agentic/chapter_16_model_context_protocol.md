# Chapter 16 — Model Context Protocol (MCP)

## Learning Objectives

By the end of this chapter you will be able to:
- Explain what MCP is and why it standardises tool integration
- Build a simple MCP server that exposes tools
- Connect an MCP server to a Vercel AI SDK agent
- Understand MCP resources and prompts
- Apply security considerations specific to MCP servers

---

## 16.1 What is MCP?

Model Context Protocol (MCP) is an open standard (from Anthropic) for connecting AI agents to external tools and data sources. Instead of defining tools inline in your agent code, you run a separate **MCP server** that exposes tools, resources, and prompts over a standardised protocol.

```
Without MCP:                     With MCP:
────────────                     ──────────
Agent code                       Agent code
  ↓ tool definitions               ↓ connects to
Inline tools                     MCP Server
  ↓ executes                         ↓ exposes
External APIs                    Tools + Resources + Prompts
                                     ↓ executes
                                  External APIs
```

**Benefits:**
- Tools are portable across different agents and models
- MCP servers can be shared across the organisation
- Tools can run in a different process or even on a different machine
- Claude Desktop, Cursor, and other AI apps support MCP natively

---

## 16.2 Building an MCP Server

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name:    "acme-customer-service",
  version: "1.0.0",
});

// Register a tool
server.tool(
  "lookup_order",
  "Look up the status of a customer order by order ID",
  {
    orderId: z.string().describe("The order ID, e.g. 'A8812'"),
  },
  async ({ orderId }) => {
    const order = await orderDB.findById(orderId);
    if (!order) {
      return { content: [{ type: "text", text: `Order ${orderId} not found.` }] };
    }
    return {
      content: [{
        type: "text",
        text: JSON.stringify({ id: order.id, status: order.status, eta: order.eta }),
      }],
    };
  }
);

// Register a resource (read-only data the model can access)
server.resource(
  "product_catalogue",
  "acme://catalogue",
  async (uri) => ({
    contents: [{
      uri:      uri.href,
      mimeType: "application/json",
      text:     JSON.stringify(await catalogueDB.getAll()),
    }],
  })
);

// Start the server over stdio
const transport = new StdioServerTransport();
await server.connect(transport);
```

---

## 16.3 Connecting MCP to Your Agent

```typescript
import { experimental_createMCPClient as createMCPClient } from "ai";
import { Experimental_StdioMCPTransport as StdioTransport } from "ai/mcp-stdio";

// Connect to the MCP server as a subprocess
const mcpClient = await createMCPClient({
  transport: new StdioTransport({
    command: "node",
    args:    ["./mcp-server/dist/index.js"],
    env:     { OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY! },
  }),
});

// Get the tools from the MCP server
const mcpTools = await mcpClient.tools();

// Use them in generateText just like regular tools
const { text } = await generateText({
  model: openrouter(MODELS.balanced),
  system: CUSTOMER_SERVICE_SYSTEM_PROMPT,
  prompt: "Where is order A8812?",
  tools: { ...mcpTools },
  maxSteps: 5,
});

// Always close the MCP client when done
await mcpClient.close();
```

---

## 16.4 MCP Resources and Prompts

MCP servers can expose three types of capabilities:

| Capability | What it is | Example |
|-----------|------------|---------|
| **Tools** | Executable functions | `lookup_order`, `search_products` |
| **Resources** | Read-only data | Product catalogue, knowledge base |
| **Prompts** | Reusable prompt templates | `customer_service_prompt`, `escalation_prompt` |

```typescript
// Register a reusable prompt template
server.prompt(
  "customer_greeting",
  "Opening greeting for a customer service conversation",
  {
    customerName: z.string(),
    tier:         z.enum(["standard", "premium", "enterprise"]),
  },
  ({ customerName, tier }) => ({
    messages: [{
      role: "user",
      content: {
        type: "text",
        text: `Generate a warm, professional greeting for ${customerName} (${tier} tier customer).`,
      },
    }],
  })
);
```

---

## 16.5 HTTP Transport (for remote MCP servers)

For production, run MCP over HTTP/SSE instead of stdio:

```typescript
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";

const app = express();
app.use(express.json());

app.post("/mcp", async (req, res) => {
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: () => crypto.randomUUID() });
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

app.listen(3001);
```

And connect from the agent:

```typescript
import { createMCPClient } from "ai";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const mcpClient = await createMCPClient({
  transport: new StreamableHTTPClientTransport(new URL("http://localhost:3001/mcp")),
});
```

---

## 16.6 Security — MCP Trust Model

MCP servers have significant power: they execute code on behalf of the agent. Security considerations:

1. **Server authentication** — HTTP MCP servers should require an API key or JWT
2. **Tool input validation** — Always validate arguments inside tool handlers (same as Ch. 4)
3. **Resource access control** — Only expose data the caller is authorised to see
4. **Process isolation** — Run MCP servers with minimal OS permissions
5. **Audit logging** — Log every tool invocation with caller identity and arguments

```typescript
// Middleware for HTTP MCP servers
app.use("/mcp", (req, res, next) => {
  const apiKey = req.headers["x-api-key"];
  if (apiKey !== process.env.MCP_API_KEY) {
    return res.status(401).json({ error: "Unauthorised" });
  }
  next();
});
```

---

## 16.7 When to Use MCP vs. Inline Tools

| Use MCP when | Use inline tools when |
|-------------|----------------------|
| Multiple agents need the same tools | Tools are specific to one agent |
| Tools need to run in a separate process | Simple, stateless functions |
| Sharing tools across the organisation | Rapid prototyping |
| Tools need their own dependencies | Tools have no external dependencies |
| Claude Desktop / Cursor integration needed | Production agent microservice |

For the portfolio project, the customer service tools start as inline tools and can be extracted to an MCP server in the Laravel integration chapters.

---

## Chapter Summary

| Concept | Key point |
|---------|-----------|
| MCP | Standard protocol for tools, resources, and prompts |
| MCP server | Separate process exposing capabilities over stdio or HTTP |
| `createMCPClient` | Connect to MCP server from Vercel AI SDK |
| `mcpClient.tools()` | Get tools from server — drop into `generateText` like normal tools |
| Resources | Read-only data; prompts are reusable templates |
| Security | Authenticate callers; validate inputs; audit log everything |

---

*Next: Chapter 17 — Human Handoff & Escalation*
