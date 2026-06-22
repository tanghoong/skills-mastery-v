# Chapter 10: Subagents & Parallel Work

So far you've worked with a single Claude in a single context. **Subagents** let Claude spin up *other* Claudes — each with its own fresh context — to handle pieces of work. This unlocks two superpowers: **context isolation** (keeping the main thread clean) and **parallelism** (multiple tasks at once). It's the feature that makes Claude Code feel less like a tool and more like a small team.

## 1. The problem subagents solve

Imagine you ask Claude: *"Find everywhere we call the old `/v1` API."* To answer, it might read 30 files. All 30 now sit in your main context window — most of them irrelevant noise once you have the answer (Chapter 6's pollution problem, at scale).

A **subagent** does that search in its *own* context and returns only the **conclusion** ("these 4 files call `/v1`, at these lines"). The 30 files never touch your main window. You keep the answer; you discard the clutter.

> Mental model: a subagent is a colleague you hand a self-contained task. You don't watch them read every file — you get their summary back.

## 2. The two big wins

**1. Context isolation.** Heavy exploration, large-file reading, and noisy searches happen *elsewhere*. Your main thread stays focused and uncluttered, so it stays sharp for the actual decision-making.

**2. Parallelism.** Independent tasks can run **at the same time**. Need to investigate three unrelated bugs? Launch three subagents in parallel and collect three reports, instead of doing them one after another.

```
                 ┌─ subagent A: audit auth code ──┐
main session ────┼─ subagent B: audit DB queries ─┼──► three reports
   (you)         └─ subagent C: audit API routes ─┘     come back
```

## 3. Specialized subagent types

Claude Code ships with (and lets you define) **specialized** subagents tuned for particular jobs. Common built-in flavors include:

- A **read-only exploration** agent — great for "search the whole repo and tell me where X lives" without it accidentally editing anything.
- A **general-purpose** agent — for open-ended multi-step tasks you want handled end-to-end.
- A **planning/architecture** agent — for designing an approach to a hard change.

You can also define **custom subagents** with their own instructions, allowed tools, and even their own model — e.g. a "test-writer" agent or a "security-reviewer" agent that always behaves a certain way. (Configuration specifics evolve; check the docs for the current format.)

## 4. How you use them

Mostly, you don't micromanage this — you *ask for the outcome* and let Claude delegate:

```
Search the codebase and list every place we read from process.env directly.
```

Claude may dispatch an exploration subagent automatically and hand you the consolidated list. For explicit parallel work, just ask for it:

```
Investigate these three independently and report back on each:
1. Why the login test is flaky.
2. Whether we have any unbounded DB queries.
3. Which dependencies are a major version behind.
```

Claude can fan these out as separate subagents and bring back three reports.

## 5. When subagents shine — and when they don't

**Great for:**

- Broad searches across many files ("where is X used?").
- Independent, parallelizable investigations.
- Heavy exploration you don't want polluting the main context.
- Distinct sub-tasks with clear, separable boundaries.

**Not worth it for:**

- Small tasks in files already in your context (just do it inline).
- Tightly *coupled* work where pieces constantly depend on each other — coordination overhead outweighs the benefit, and the subagent lacks your main thread's context.

> A subagent starts fresh — it does **not** inherit your conversation. So a task that relies on a lot of in-session context you've built up is often better done in the main thread. Delegate work that's *self-contained*.

## 6. The mental shift

Single-agent thinking: *"I'll have Claude do A, then B, then C."*
Multi-agent thinking: *"A, B, and C are independent — fan them out. The main thread stays clean and just synthesizes the results."*

This is the beginning of **orchestration**: you as the director coordinating workers, rather than a single long linear conversation. We go deeper on orchestration patterns in Chapter 14 and Chapter 16.

## 7. Frequently Asked Questions

**Q: Do subagents share my main conversation/context?**
No — each starts with a fresh context. That isolation is the *point* (it keeps your main window clean), but it means you must give a subagent everything it needs in its task description. Don't assume it knows what you and the main agent just discussed.

**Q: Will I see everything a subagent did?**
You get its **result/summary**, not its full play-by-play — that's deliberate, so the detail doesn't flood your context. If you need its reasoning, ask it (or the main agent) to include more in the report.

**Q: Is parallel always faster?**
Only for *independent* work. Coupled tasks that need to share state constantly are usually faster and cleaner done sequentially in one context. Use parallelism when the pieces genuinely don't depend on each other.

## Action Item for Chapter 10

1. Ask Claude a broad search question about a real repo ("where do we handle file uploads?") and notice it can explore without dumping every file into your main context.
2. Give it **two independent** investigation tasks in one request and observe it report back on both.
3. Reflect: in your current project, name one recurring job (e.g. "audit for X") that would make a good *custom* subagent. You'll have the option to build it after Chapter 11.
</content>
