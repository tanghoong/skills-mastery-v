# Chapter 2 — OpenRouter Setup & Model Routing

## Learning Objectives

By the end of this chapter you will be able to:
- Create an OpenRouter account and obtain an API key
- Make your first LLM call using the Vercel AI SDK via OpenRouter
- Understand model IDs, pricing tiers, and routing strategies
- Select models by task type to control cost without sacrificing quality
- Set up environment variables and project dependencies correctly

---

## 2.1 What is OpenRouter?

OpenRouter is an API gateway that sits in front of every major LLM provider:

```
Your code
    │
    ▼
OpenRouter  ──► Anthropic (Claude)
            ──► OpenAI (GPT-4o, o3)
            ──► Google (Gemini)
            ──► Meta (Llama)
            ──► Mistral
            ──► ... 200+ models
```

**Why this matters for agentic systems:**
- One API key, one endpoint, any model
- Per-request model selection — you can swap models mid-pipeline
- Unified cost dashboard across all providers
- OpenAI-compatible API surface — works with any SDK that speaks OpenAI

The course uses OpenRouter throughout so you can choose the best model for each task without changing your code.

---

## 2.2 Account Setup

1. Create an account at [openrouter.ai](https://openrouter.ai)
2. Go to **Keys** and create a new API key
3. Add credits (even $5 is plenty to complete the whole course)
4. Copy the key — you will store it in `.env`

```bash
# .env (never commit this file)
OPENROUTER_API_KEY=sk-or-v1-...
```

> **Security note:** Add `.env` to `.gitignore` immediately. Never paste your API key in a prompt, a tool call, or agent state. Chapter 22 covers secrets management in depth.

---

## 2.3 Project Setup

```bash
# Create the project
mkdir harness-agent && cd harness-agent
npm init -y

# Runtime dependencies
npm install ai @ai-sdk/openai zod dotenv

# Dev dependencies
npm install -D typescript tsx @types/node

# Create tsconfig
npx tsc --init --strict --target ES2022 --module NodeNext --moduleResolution NodeNext
```

The `ai` package is the Vercel AI SDK core. `@ai-sdk/openai` is used because OpenRouter speaks the OpenAI API format.

---

## 2.4 Your First OpenRouter Call

```typescript
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import "dotenv/config";

const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY!,
});

const { text } = await generateText({
  model: openrouter("anthropic/claude-3-haiku"),
  prompt: "What is an agentic system? Answer in two sentences.",
});

console.log(text);
```

Run it:
```bash
tsx chapter_02_demo.ts
```

---

## 2.5 Model IDs and the OpenRouter Catalogue

OpenRouter model IDs follow the pattern `provider/model-name`:

| Model ID | Provider | Strength | Speed | Cost |
|----------|----------|----------|-------|------|
| `anthropic/claude-3-haiku` | Anthropic | Fast, cheap, good at simple tasks | ⚡⚡⚡ | $ |
| `anthropic/claude-3-5-sonnet` | Anthropic | Balanced: smart + fast | ⚡⚡ | $$ |
| `anthropic/claude-opus-4` | Anthropic | Most capable | ⚡ | $$$$ |
| `openai/gpt-4o-mini` | OpenAI | Fast, cheap | ⚡⚡⚡ | $ |
| `openai/gpt-4o` | OpenAI | Strong reasoning | ⚡⚡ | $$$ |
| `google/gemini-flash-1.5` | Google | Very fast, large context | ⚡⚡⚡ | $ |
| `meta-llama/llama-3.1-70b-instruct` | Meta | Open-source, no data retention | ⚡⚡ | $ |
| `mistralai/mistral-7b-instruct` | Mistral | Cheapest capable model | ⚡⚡⚡ | ¢ |

You can browse the full catalogue at [openrouter.ai/models](https://openrouter.ai/models) and filter by price, context window, or provider.

---

## 2.6 Model Routing Strategy

The core insight: **not every task in an agent pipeline needs your best model.**

A common production routing pattern:

```
Task Type                         Model choice
─────────────────────────────     ─────────────────────────────
Intent classification             claude-3-haiku or gpt-4o-mini
Simple slot extraction            claude-3-haiku
Tool call planning (simple)       claude-3-haiku
RAG synthesis (complex)           claude-3-5-sonnet
Multi-step reasoning              claude-3-5-sonnet
Final response composition        claude-3-5-sonnet
Complex code / analysis           claude-opus-4 (sparingly)
```

**Rule of thumb:** Start with the cheapest model that gets the job done at 90%+ accuracy on your test set. Upgrade only the steps where a cheaper model fails.

---

## 2.7 Per-Request Model Selection in Code

```typescript
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY!,
});

// Cheap model for fast classification
async function classifyIntent(message: string): Promise<string> {
  const { text } = await generateText({
    model: openrouter("anthropic/claude-3-haiku"),
    prompt: `Classify this customer message as one of: order_status, delivery, product, general\n\nMessage: ${message}\n\nReply with only the category name.`,
    maxTokens: 10,
  });
  return text.trim();
}

// More capable model for nuanced synthesis
async function synthesiseResponse(context: string, question: string): Promise<string> {
  const { text } = await generateText({
    model: openrouter("anthropic/claude-3-5-sonnet"),
    prompt: `Given this context:\n${context}\n\nAnswer the customer question: ${question}`,
    maxTokens: 500,
  });
  return text;
}
```

---

## 2.8 Usage Metadata — Reading Token Counts

The Vercel AI SDK returns usage data on every call. Always capture it:

```typescript
const { text, usage } = await generateText({
  model: openrouter("anthropic/claude-3-haiku"),
  prompt: "Hello",
});

console.log(`Input tokens:  ${usage.promptTokens}`);
console.log(`Output tokens: ${usage.completionTokens}`);
console.log(`Total tokens:  ${usage.totalTokens}`);
```

Use this to:
- Build cost tracking (Ch. 18)
- Set token budget guards
- Monitor context window usage in long conversations

---

## 2.9 HTTP Headers for OpenRouter

OpenRouter accepts optional headers that improve dashboard visibility and unlock certain features:

```typescript
const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY!,
  headers: {
    "HTTP-Referer": "https://your-app.com",   // shown in dashboard
    "X-Title": "Customer Service Agent",       // shown in dashboard
  },
});
```

These are optional but recommended in production — they help you identify traffic in the OpenRouter dashboard when you have multiple projects sharing one key.

---

## 2.10 Model Fallbacks

OpenRouter supports automatic fallbacks when a model is unavailable. You can also implement fallbacks in code:

```typescript
const MODELS = {
  fast:     "anthropic/claude-3-haiku",
  balanced: "anthropic/claude-3-5-sonnet",
  fallback: "openai/gpt-4o-mini",
} as const;

type ModelTier = keyof typeof MODELS;

async function callWithFallback(
  prompt: string,
  tier: ModelTier = "fast"
): Promise<string> {
  try {
    const { text } = await generateText({
      model: openrouter(MODELS[tier]),
      prompt,
    });
    return text;
  } catch {
    if (tier === "fast") return callWithFallback(prompt, "fallback");
    throw new Error(`All model tiers failed for prompt: ${prompt.slice(0, 50)}`);
  }
}
```

---

## 2.11 Environment Variable Pattern

For the rest of the course, every exercise file uses this setup:

```typescript
import { createOpenAI } from "@ai-sdk/openai";
import "dotenv/config";

if (!process.env.OPENROUTER_API_KEY) {
  throw new Error("OPENROUTER_API_KEY is not set. Copy .env.example to .env and add your key.");
}

export const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  headers: {
    "HTTP-Referer": "https://harness-agent.local",
    "X-Title": "Harness Agentic Course",
  },
});

export const MODELS = {
  fast:     "anthropic/claude-3-haiku"     as const,
  balanced: "anthropic/claude-3-5-sonnet"  as const,
  powerful: "anthropic/claude-opus-4"      as const,
} satisfies Record<string, string>;
```

You will copy this pattern into your own `src/client.ts` once and import it everywhere.

---

## 2.12 Cost Awareness — This Chapter

| Task | Model | Approx. cost per 1000 calls |
|------|-------|----------------------------|
| `classifyIntent` (10 tokens out) | claude-3-haiku | ~$0.03 |
| `synthesiseResponse` (500 tokens out) | claude-3-5-sonnet | ~$1.50 |
| Full conversation (10 turns, mixed) | haiku + sonnet | ~$0.15 |

These numbers are approximate and change as providers update pricing. The pattern — cheap model for simple steps, better model only where needed — is the core cost optimisation strategy.

---

## Chapter Summary

| Concept | Key point |
|---------|-----------|
| OpenRouter | One API endpoint for 200+ models |
| Model ID format | `provider/model-name` |
| Vercel AI SDK | `generateText`, `streamText`, `generateObject` — core functions |
| Model routing | Match model capability to task complexity |
| Usage metadata | Always capture `usage.promptTokens` and `usage.completionTokens` |
| Environment | API key in `.env`, never in code |

---

> **Python Sidebar**
>
> In Python, the equivalent setup uses the `openai` package pointed at OpenRouter:
> ```python
> from openai import OpenAI
> client = OpenAI(
>     base_url="https://openrouter.ai/api/v1",
>     api_key=os.environ["OPENROUTER_API_KEY"],
> )
> response = client.chat.completions.create(
>     model="anthropic/claude-3-haiku",
>     messages=[{"role": "user", "content": "Hello"}],
> )
> ```
> LangChain, LlamaIndex, and DSPy all support OpenRouter via the same OpenAI-compatible base URL.

---

*Next: Chapter 3 — The Claude API & Message Structure*
