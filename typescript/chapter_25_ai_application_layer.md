# Chapter 25: AI Application Layer with TypeScript (Hour 25)

TypeScript is the dominant language for building AI-powered applications — calling LLM APIs, streaming responses, building agents, and wiring AI into web and mobile apps. This chapter covers the practical patterns used in production AI apps.

## 1. The Anthropic SDK

The official Anthropic SDK is TypeScript-first. Every request and response is fully typed.

```bash
npm install @anthropic-ai/sdk
```

```typescript
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

interface MessageResult {
    content: string;
    inputTokens: number;
    outputTokens: number;
}

async function askClaude(prompt: string): Promise<MessageResult> {
    const message = await client.messages.create({
        model:      "claude-sonnet-4-6",
        max_tokens: 1024,
        messages:   [{ role: "user", content: prompt }],
    });

    const textBlock = message.content.find(block => block.type === "text");
    if (!textBlock || textBlock.type !== "text") throw new Error("No text response");

    return {
        content:      textBlock.text,
        inputTokens:  message.usage.input_tokens,
        outputTokens: message.usage.output_tokens,
    };
}

const result = await askClaude("Explain TypeScript generics in one paragraph.");
console.log(result.content);
```

## 2. Streaming Responses

Streaming returns tokens as they are generated — essential for a good UX in chat applications.

```typescript
async function streamClaude(prompt: string): Promise<void> {
    const stream = client.messages.stream({
        model:      "claude-sonnet-4-6",
        max_tokens: 1024,
        messages:   [{ role: "user", content: prompt }],
    });

    // Stream text to the console as it arrives
    stream.on("text", (text) => process.stdout.write(text));

    // Await the final complete message
    const finalMessage = await stream.finalMessage();
    console.log("\n\nTotal tokens:", finalMessage.usage.input_tokens + finalMessage.usage.output_tokens);
}
```

## 3. Tool Use (Function Calling)

Tool use lets the model call typed functions you define — the model decides when and how to call them.

```typescript
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

// Define tools with JSON schema — TypeScript types the definitions
const tools: Anthropic.Tool[] = [
    {
        name:        "get_weather",
        description: "Get the current weather for a city",
        input_schema: {
            type: "object",
            properties: {
                city:    { type: "string",  description: "City name" },
                unit:    { type: "string",  enum: ["celsius", "fahrenheit"] },
            },
            required: ["city"],
        },
    },
    {
        name:        "search_products",
        description: "Search for products in our catalog",
        input_schema: {
            type: "object",
            properties: {
                query:    { type: "string" },
                maxPrice: { type: "number" },
            },
            required: ["query"],
        },
    },
];

// Type the tool inputs
interface WeatherInput    { city: string; unit?: "celsius" | "fahrenheit" }
interface SearchInput     { query: string; maxPrice?: number }

type ToolInput = WeatherInput | SearchInput;

// Execute the tool and return a result
async function executeTool(name: string, input: ToolInput): Promise<string> {
    if (name === "get_weather") {
        const { city, unit = "celsius" } = input as WeatherInput;
        return `Weather in ${city}: 28°${unit === "celsius" ? "C" : "F"}, sunny`;
    }
    if (name === "search_products") {
        const { query } = input as SearchInput;
        return JSON.stringify([{ id: 1, name: `Result for "${query}"`, price: 99 }]);
    }
    return "Tool not found";
}

// Agentic loop — continues until the model stops using tools
async function runAgent(userMessage: string): Promise<string> {
    const messages: Anthropic.MessageParam[] = [
        { role: "user", content: userMessage },
    ];

    while (true) {
        const response = await client.messages.create({
            model:      "claude-sonnet-4-6",
            max_tokens: 1024,
            tools,
            messages,
        });

        if (response.stop_reason === "end_turn") {
            const textBlock = response.content.find(b => b.type === "text");
            return textBlock?.type === "text" ? textBlock.text : "";
        }

        if (response.stop_reason === "tool_use") {
            // Add the assistant's response (including tool calls) to history
            messages.push({ role: "assistant", content: response.content });

            // Execute each tool call and collect results
            const toolResults: Anthropic.ToolResultBlockParam[] = [];

            for (const block of response.content) {
                if (block.type === "tool_use") {
                    const result = await executeTool(block.name, block.input as ToolInput);
                    toolResults.push({
                        type:       "tool_result",
                        tool_use_id: block.id,
                        content:    result,
                    });
                }
            }

            // Feed results back to the model
            messages.push({ role: "user", content: toolResults });
        }
    }
}

const answer = await runAgent("What's the weather in Bangkok? Also search for TypeScript books.");
console.log(answer);
```

## 4. Vercel AI SDK (Next.js Integration)

The Vercel AI SDK is the easiest way to add streaming AI to a Next.js app.

```bash
npm install ai @ai-sdk/anthropic
```

```typescript
// src/app/api/chat/route.ts
import { anthropic } from "@ai-sdk/anthropic";
import { streamText, Message } from "ai";

export async function POST(request: Request) {
    const { messages }: { messages: Message[] } = await request.json();

    const result = streamText({
        model:    anthropic("claude-sonnet-4-6"),
        system:   "You are a helpful TypeScript tutor.",
        messages,
    });

    return result.toDataStreamResponse();
}
```

```typescript
// src/app/chat/page.tsx — streaming chat UI
"use client";

import { useChat } from "ai/react";

export default function ChatPage() {
    const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
        api: "/api/chat",
    });

    return (
        <div>
            <div>
                {messages.map(msg => (
                    <div key={msg.id} style={{ textAlign: msg.role === "user" ? "right" : "left" }}>
                        <strong>{msg.role}:</strong> {msg.content}
                    </div>
                ))}
                {isLoading && <p>Thinking...</p>}
            </div>

            <form onSubmit={handleSubmit}>
                <input
                    value={input}
                    onChange={handleInputChange}
                    placeholder="Ask a TypeScript question..."
                />
                <button type="submit" disabled={isLoading}>Send</button>
            </form>
        </div>
    );
}
```

## 5. Structured Output with Zod

Force the model to return JSON that matches a Zod schema — get typed, validated AI responses.

```typescript
import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";

const productSchema = z.object({
    name:        z.string(),
    price:       z.number().positive(),
    category:    z.enum(["electronics", "clothing", "food", "other"]),
    tags:        z.array(z.string()),
    inStock:     z.boolean(),
    description: z.string().max(200),
});

type Product = z.infer<typeof productSchema>;

async function extractProductFromText(text: string): Promise<Product> {
    const { object } = await generateObject({
        model:  anthropic("claude-sonnet-4-6"),
        schema: productSchema,
        prompt: `Extract product information from this text: "${text}"`,
    });

    return object; // typed as Product — guaranteed to match the schema
}

const product = await extractProductFromText(
    "The new iPhone 16 Pro is $999, it's an electronics device with features like ProRes video. Currently available."
);

console.log(product.category); // "electronics"
console.log(product.price);    // 999
```

## 6. RAG — Retrieval Augmented Generation

RAG adds your own data as context to the model's responses.

```typescript
import { embed, embedMany, cosineSimilarity } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai"; // for embeddings

interface Document {
    id: string;
    content: string;
    embedding?: number[];
}

// Step 1: Embed your documents (run once, store in a vector DB)
async function indexDocuments(docs: Omit<Document, "embedding">[]): Promise<Document[]> {
    const { embeddings } = await embedMany({
        model: openai.embedding("text-embedding-3-small"),
        values: docs.map(d => d.content),
    });

    return docs.map((doc, i) => ({ ...doc, embedding: embeddings[i] }));
}

// Step 2: Find the most relevant documents for a query
async function findRelevant(
    query: string,
    documents: Document[],
    topK: number = 3
): Promise<Document[]> {
    const { embedding: queryEmbedding } = await embed({
        model: openai.embedding("text-embedding-3-small"),
        value: query,
    });

    return documents
        .filter(d => d.embedding)
        .map(doc => ({
            doc,
            score: cosineSimilarity(queryEmbedding, doc.embedding!),
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, topK)
        .map(({ doc }) => doc);
}

// Step 3: Generate an answer grounded in the retrieved documents
async function answerWithContext(query: string, documents: Document[]): Promise<string> {
    const relevant = await findRelevant(query, documents);
    const context  = relevant.map(d => d.content).join("\n\n");

    const { text } = await generateText({
        model:  anthropic("claude-sonnet-4-6"),
        prompt: `Answer using only the context below.\n\nContext:\n${context}\n\nQuestion: ${query}`,
    });

    return text;
}
```

## Action Item for Hour 25:

- Build a TypeScript CLI tool that:
  1. Accepts a question as a command-line argument
  2. Has two tools: `read_file(path: string)` and `list_files(directory: string)`
  3. Uses Claude with tool use to answer questions about files on disk
  4. Runs the agentic loop until Claude gives a final answer without calling any tools
  5. Streams the final answer to the terminal

---

## You Have Completed the Full TypeScript + Ecosystem Curriculum!

| Phase | Chapters | Focus |
|-------|----------|-------|
| **Language Core**   | 1–8   | Types, generics, OOP, type system |
| **Advanced TS**     | 9–17  | Async, modules, decorators, patterns |
| **Frontend**        | 18–19 | React, Next.js |
| **Backend**         | 20–22 | NestJS, Prisma, tRPC |
| **Quality & Mobile**| 23–24 | Testing, React Native |
| **AI Layer**        | 25    | LLM APIs, streaming, tool use, RAG |

**Final project recommendation:** Build a full-stack AI-powered app — Next.js frontend + tRPC + Prisma + Claude AI — using strict TypeScript throughout. This single project exercises every chapter.
