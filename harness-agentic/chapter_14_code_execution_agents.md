# Chapter 14 — Code Execution Agents

## Learning Objectives

By the end of this chapter you will be able to:
- Build an agent that generates and executes code in a sandboxed environment
- Implement the eval loop: generate → execute → observe → correct
- Apply sandboxing constraints to prevent dangerous code execution
- Use code execution for data analysis and report generation use cases
- Handle code errors gracefully within the agent loop

---

## 14.1 What is a Code Execution Agent?

A code execution agent can write and run code as part of its reasoning. It extends the agent loop with a code execution tool:

```
User: "Analyse this sales data and tell me the top 3 products by revenue"
  → Agent writes JavaScript/Python to parse and analyse data
  → Executes the code in sandbox
  → Reads stdout output
  → Interprets results and replies to user
```

This pattern enables the agent to handle precise computations, data transformations, and analysis that would otherwise require hallucinated approximations.

---

## 14.2 The Eval Loop

```
Generate code
    ↓
Execute in sandbox
    ↓
Did it error? ──Yes──► Append error to history, regenerate corrected code
    ↓ No
Observe output
    ↓
Is output sufficient? ──No──► Generate follow-up code
    ↓ Yes
Synthesise final answer
```

The eval loop is a ReAct loop (Ch. 5) where the Action is code execution.

---

## 14.3 Sandboxing — The Critical Constraint

**Never execute LLM-generated code without sandboxing.** An LLM can generate:
- `rm -rf /` — deletes the filesystem
- Network requests to exfiltrate data
- Infinite loops that consume CPU
- Code that reads sensitive files

**Sandboxing options:**

| Approach | Security | Setup |
|----------|----------|-------|
| `vm` module (Node.js) | Medium | Easy — built in |
| Docker container | High | Medium |
| E2B (cloud sandbox) | High | Easy — API |
| Pyodide (Python in WASM) | High | Medium |

For this course we use the `vm` module for TypeScript sandboxes and E2B for Python sandboxes.

---

## 14.4 Node.js vm Sandbox

```typescript
import * as vm from "vm";

interface SandboxResult {
  stdout:   string;
  stderr:   string;
  success:  boolean;
  error?:   string;
  durationMs: number;
}

function executeInSandbox(code: string, timeoutMs: number = 3000): SandboxResult {
  const start = Date.now();
  const output: string[] = [];
  const errors: string[] = [];

  const sandbox = vm.createContext({
    console: {
      log:   (...args: unknown[]) => output.push(args.map(String).join(" ")),
      error: (...args: unknown[]) => errors.push(args.map(String).join(" ")),
      warn:  (...args: unknown[]) => output.push("[WARN] " + args.map(String).join(" ")),
    },
    Math,
    JSON,
    Array,
    Object,
    String,
    Number,
    parseInt,
    parseFloat,
    // Deliberately excluded: process, require, fetch, fs, __dirname, etc.
  });

  try {
    vm.runInContext(code, sandbox, { timeout: timeoutMs });
    return {
      stdout:     output.join("\n"),
      stderr:     errors.join("\n"),
      success:    true,
      durationMs: Date.now() - start,
    };
  } catch (err) {
    return {
      stdout:     output.join("\n"),
      stderr:     errors.join("\n"),
      success:    false,
      error:      err instanceof Error ? err.message : String(err),
      durationMs: Date.now() - start,
    };
  }
}
```

The sandbox context explicitly whitelists safe globals — `Math`, `JSON`, `Array`, etc. — and excludes everything else.

---

## 14.5 Code Execution Tool

```typescript
import { tool } from "ai";
import { z } from "zod";

const executeCodeTool = tool({
  description: `Execute JavaScript code in a secure sandbox.
Use this to perform calculations, data analysis, or transformations.
Available globals: Math, JSON, Array, Object, String, Number, parseInt, parseFloat, console.log.
NOT available: process, require, fetch, fs, network access.
Output results by calling console.log().`,
  parameters: z.object({
    code: z.string().describe("Valid JavaScript code to execute. Use console.log() to output results."),
    description: z.string().describe("Brief description of what this code does — helps with debugging."),
  }),
  execute: async ({ code }) => {
    const result = executeInSandbox(code, 3000);
    if (!result.success) {
      return JSON.stringify({
        success: false,
        error:   result.error,
        stdout:  result.stdout,
        hint:    "Fix the error and try again. Check for: syntax errors, undefined variables, division by zero.",
      });
    }
    return JSON.stringify({
      success:    true,
      output:     result.stdout,
      durationMs: result.durationMs,
    });
  },
});
```

---

## 14.6 Self-Correcting Code Agent

```typescript
async function dataAnalysisAgent(
  data: object,
  question: string
): Promise<string> {
  const { text } = await generateText({
    model: openrouter(MODELS.balanced),
    system: `You are a data analysis agent. You have access to a JavaScript code execution sandbox.
When given data and a question, write JavaScript code to analyse the data and answer the question.
The data is available as the variable 'data' in your code.
Always use console.log() to output your answer.
If your code fails, read the error and fix it.`,
    messages: [
      { role: "user", content: `Data: ${JSON.stringify(data)}\n\nQuestion: ${question}` },
    ],
    tools: {
      executeCode: tool({
        description: executeCodeTool.description,
        parameters:  executeCodeTool.parameters,
        execute: async ({ code }) => {
          // Inject the data variable into the sandbox context
          const wrappedCode = `const data = ${JSON.stringify(data)};\n${code}`;
          const result = executeInSandbox(wrappedCode, 3000);
          return JSON.stringify(result.success
            ? { success: true, output: result.stdout }
            : { success: false, error: result.error, stdout: result.stdout }
          );
        },
      }),
    },
    maxSteps: 5,  // allow up to 5 code generation + correction cycles
  });

  return text;
}
```

---

## 14.7 Use Case — Report Generation

```typescript
const salesData = [
  { product: "XR-200 Door Handle", units: 142, revenue: 7099.58 },
  { product: "Hinge Set XR-200",   units: 89,  revenue: 2669.11 },
  { product: "Door Seal Kit",       units: 234, revenue: 4672.66 },
  { product: "Adaptor Plate AP-200", units: 67, revenue: 669.33  },
];

const report = await dataAnalysisAgent(
  salesData,
  "Which product generates the most revenue? What is the average revenue per unit for each product? Format as a table."
);

console.log(report);
```

---

## 14.8 Security — What to Block

Beyond the sandbox, validate generated code before execution:

```typescript
const BLOCKED_PATTERNS = [
  /require\s*\(/,            // require() - module loading
  /process\./,               // process.env, process.exit, etc.
  /fetch\s*\(/,              // network requests
  /import\s+/,               // ES module imports
  /eval\s*\(/,               // meta-eval
  /Function\s*\(/,           // Function constructor
  /setTimeout|setInterval/,  // timing attacks
  /\bfs\b/,                  // file system (if somehow available)
  /Buffer\./,                // Buffer (Node.js global)
  /global\./,                // global object
];

function isCodeSafe(code: string): { safe: boolean; reason?: string } {
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(code)) {
      return { safe: false, reason: `Blocked pattern detected: ${pattern.source}` };
    }
  }
  return { safe: true };
}
```

Use this as a pre-flight check before passing code to the sandbox.

---

## Chapter Summary

| Concept | Key point |
|---------|-----------|
| Code execution agent | Agent generates + executes code as a tool call |
| Eval loop | Generate → execute → observe error → correct → repeat |
| Sandboxing | Always required; `vm` module whitelist approach |
| Code tool | Explicit `description` listing available and blocked globals |
| Self-correction | `maxSteps: 5` lets the agent fix its own code errors |
| Pre-flight validation | Block dangerous patterns before sandbox execution |

---

*Next: Chapter 15 — Web & File System Agents*
