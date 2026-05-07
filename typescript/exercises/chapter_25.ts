// ============================================================
// Chapter 25 — AI Application Layer
// Setup: npm install @anthropic-ai/sdk
// Run:   ANTHROPIC_API_KEY=sk-ant-... tsx exercises/chapter_25.ts
// ============================================================

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from env

// ----------------------------------------------------------------
// Exercise 1: Basic typed message
// Write an async function `ask(question: string): Promise<string>`
// that sends the question to Claude and returns the text response.
// Handle the case where the response has no text block.
// Then use it to ask: "What are the top 3 benefits of TypeScript?"
// ----------------------------------------------------------------

// TODO: implement ask()

// (async () => {
//   const answer = await ask("What are the top 3 benefits of TypeScript?");
//   console.log(answer);
// })();


// ----------------------------------------------------------------
// Exercise 2: Streaming response
// Write `askStreaming(question: string): Promise<void>` that streams
// the response token by token to the console (no newline between tokens).
// Print a newline and the total token count after the stream ends.
// ----------------------------------------------------------------

// TODO: implement askStreaming()

// (async () => {
//   await askStreaming("Explain TypeScript generics in simple terms.");
// })();


// ----------------------------------------------------------------
// Exercise 3: Tool use — calculator agent
// Define two tools for Claude:
//   calculate: { expression: string }   — evaluates a math expression
//   getExchangeRate: { from: string; to: string } — returns a mock rate
//
// Implement executeTool(name, input) that handles both.
// Write runCalculatorAgent(query: string): Promise<string> that runs
// the agentic loop until Claude gives a final answer.
// ----------------------------------------------------------------

// TODO: implement tools, executeTool, and runCalculatorAgent

// (async () => {
//   const answer = await runCalculatorAgent(
//     "If 1 USD = 1.35 SGD, how much is $250 USD in SGD? Show the calculation."
//   );
//   console.log(answer);
// })();


// ----------------------------------------------------------------
// Exercise 4: Structured output with Zod
// Install: npm install zod
// Define a Zod schema for: CodeReview { score: number (1-10), issues: string[], suggestions: string[], summary: string }
// Write `reviewCode(code: string): Promise<CodeReview>` that asks
// Claude to review the code and forces a structured JSON response.
// Test it by reviewing the following snippet:
// ----------------------------------------------------------------

const codeToReview = `
function getData(url) {
  return fetch(url).then(r => r.json()).catch(e => console.log(e));
}
`;

// TODO: implement reviewCode using generateObject or manual JSON parsing

// (async () => {
//   const review = await reviewCode(codeToReview);
//   console.log("Score:", review.score);
//   console.log("Issues:", review.issues);
//   console.log("Suggestions:", review.suggestions);
// })();


// ----------------------------------------------------------------
// Exercise 5: Multi-turn chat
// Build a `ChatSession` class with:
//   - private messages: Anthropic.MessageParam[]
//   - send(userMessage: string): Promise<string>
//     — appends the user message, sends to Claude, appends the response,
//       returns the assistant's text
//   - getHistory(): Anthropic.MessageParam[]
//   - reset(): void
//
// Simulate a 3-turn conversation where you:
//   Turn 1: "My name is Charlie. I'm learning TypeScript."
//   Turn 2: "What's my name and what am I learning?"  ← tests memory
//   Turn 3: "Give me one exercise to practice what I'm learning."
// ----------------------------------------------------------------

// TODO: implement ChatSession

// (async () => {
//   const chat = new ChatSession();
//   console.log(await chat.send("My name is Charlie. I'm learning TypeScript."));
//   console.log(await chat.send("What's my name and what am I learning?"));
//   console.log(await chat.send("Give me one exercise to practice what I'm learning."));
//   console.log("\nHistory length:", chat.getHistory().length); // 6 (3 user + 3 assistant)
// })();
