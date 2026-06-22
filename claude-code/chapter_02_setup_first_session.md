# Chapter 2: Setup & Your First Session

Now we get hands-on. By the end of this chapter you'll have Claude Code running and you'll have completed a real (tiny) task with it.

## 1. Installing Claude Code

Claude Code is available as a CLI, a desktop app, a web app (claude.ai/code), and IDE extensions (VS Code, JetBrains). This course assumes the **terminal CLI**, because the concepts transfer everywhere and the CLI exposes the most.

```bash
# Install (npm method)
npm install -g @anthropic-ai/claude-code

# Verify
claude --version
```

> Installation details change over time. The canonical, always-current instructions live at **https://code.claude.com/docs**. If the command above is out of date, follow the docs — then come back.

## 2. Authenticating

The first time you run `claude`, it walks you through authentication (a Claude subscription or an Anthropic API key). Follow the prompts. You only do this once per machine.

```bash
cd your-project       # always launch from your project root
claude                # starts an interactive session
```

**Why launch from the project root?** Claude treats the launch directory as its working directory — the home base for reading and editing. Launch from the repo root so it can see the whole project (Chapter 6 covers how it navigates without reading everything).

## 3. The anatomy of a session

When you run `claude`, you get an interactive prompt. You type a request in plain English, press Enter, and watch Claude work — you'll see it read files, run searches, propose edits, and ask for permission when needed.

A few things you'll see and use constantly:

| Action | How | Notes |
|--------|-----|-------|
| Send a message | Type, then Enter | Plain English. Be specific (Ch. 3). |
| Interrupt Claude | **Esc** | Stops it mid-action so you can redirect (Ch. 8). |
| See available commands | `/help` | Lists slash commands for *your* version. |
| Start fresh | `/clear` | Wipes the conversation/context (Ch. 6). |
| Reference a file | Mention its path, or use `@` file-completion | Helps Claude jump straight to it. |
| Exit | `/exit` or Ctrl-D | Ends the session. |

> **Habit to build now:** run `/help` in your first session and skim the list. It's the single best way to learn what *your* version can do, since features evolve.

## 4. Your first task (do this for real)

Pick something small and safe. The goal is to watch the agent loop, not to ship anything.

Try this in a throwaway or scratch repo:

```
Create a file called hello.ts that exports a function greet(name: string)
returning "Hello, <name>!". Then write a one-line usage example as a comment.
```

Watch what happens:

- Claude may **ask permission** before creating the file. Approve it.
- It creates the file, then often **summarizes** what it did.
- Notice it didn't ask you *where* or *how* in excruciating detail — it inferred sensible defaults. That's the agent filling gaps. (Sometimes it guesses wrong — that's what steering is for.)

Now do a follow-up to feel iteration:

```
Now add a second function, shout(name), that returns the greeting in all caps.
Reuse greet() instead of duplicating the string.
```

Notice that you **didn't re-explain the file** — Claude still has it in context from a moment ago. That's the context window working *for* you.

## 5. The three things that go wrong on day one

1. **Launching from the wrong directory.** If Claude "can't find" your code, check where you started it. Launch from the repo root.
2. **Vague first prompts.** "Fix the bug" with no context sends the agent exploring blindly. Chapter 3 is the cure.
3. **Letting it run too long without review.** New users often watch 10 edits fly by, then realize step 2 was wrong. Use **Esc** early and often while you're learning.

## 6. Frequently Asked Questions

**Q: CLI, IDE extension, or web — which should I learn on?**
Learn the concepts on the **CLI** (this course). The IDE extensions and web app are the same engine with different surfaces; everything you learn here applies. The CLI also makes context and permissions most visible, which is exactly what a beginner needs to *see*.

**Q: Do I need to configure anything before being productive?**
No. Claude Code works out of the box. Configuration (`CLAUDE.md`, permissions, hooks, MCP) is how you go from "works" to "tailored to my project" — that's the rest of this course.

**Q: It asked permission for everything and it's slow. Can I stop that?**
Yes — permission modes (Chapter 7) let you pre-approve categories of actions. But while learning, the prompts are *educational*: they show you exactly what the agent wanted to do. Keep them on for now.

## Action Item for Chapter 2

1. Install Claude Code and complete the two-step `greet`/`shout` task above in a scratch directory.
2. Run `/help` and write down **three** commands you didn't know existed.
3. Mid-task, deliberately press **Esc** once just to feel the interrupt. You'll rely on it later.
</content>
