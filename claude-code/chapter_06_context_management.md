# Chapter 6: Context Management — /clear, /compact, and Knowing When to Reset

In Chapter 1 you learned that Claude's context window is finite, short-term, per-session memory. This chapter teaches you to *manage* it deliberately. Context management is the skill that most separates frustrated users from fluent ones, because almost every "Claude got dumber halfway through" story is really a context problem.

## 1. What's in the context window

At any moment, the window holds:

- The system prompt + your `CLAUDE.md`.
- Your messages and Claude's replies so far.
- The contents of every file Claude has read this session.
- The output of every command it has run (test logs, search results, etc.).

It's a **budget**. Big files and noisy command output spend it fast. When it gets near full, older content is summarized or dropped — which is when Claude starts "forgetting" earlier decisions or repeating itself.

## 2. The symptoms of a polluted context

Learn to recognize these — they're your cue to act:

- Claude **forgets** a decision you made earlier in the session.
- It **re-reads** files it already read, or re-asks something you answered.
- Its answers get **vaguer** or it mixes up two unrelated tasks.
- It references a file/approach from a *different* task you did earlier.

None of these mean "the model is bad." They mean "the working memory is cluttered."

## 3. /clear — the reset button (use it a lot)

`/clear` wipes the conversation and starts a fresh context (your `CLAUDE.md` reloads automatically — you don't lose project memory).

**Use `/clear` between unrelated tasks.** This is the single most impactful habit in this chapter. Finished adding the discount feature? `/clear` before you start the bug fix. A fresh context means:

- No leftover assumptions from the previous task.
- Full budget available for the new one.
- Sharper, faster, more accurate work.

> **New-user mistake:** doing six different tasks in one marathon session because "it already has all my files loaded." That loaded context is now *noise* for task #6. Clear it.

## 4. /compact — summarize without losing the thread

Sometimes you're deep in **one** long task and don't want to lose the thread, but the window is filling. `/compact` asks Claude to **summarize the conversation so far** and continue from that compressed summary — keeping the gist, dropping the bulk.

Use `/compact` when:

- You're mid-task and genuinely need the history, but it's getting long.
- You want to preserve key decisions while reclaiming space.

You can often steer the summary: *"Compact, but keep the API contract we agreed on and the list of files still to change."*

| Situation | Use |
|-----------|-----|
| Switching to a different task | `/clear` |
| Same task, context getting long | `/compact` |
| Things feel "off," easier to restart | `/clear` (and re-state the task crisply) |

## 5. Keep noise out of the window in the first place

Prevention beats cleanup:

- **Don't dump huge files.** Ask Claude to read the *relevant part* ("read the `checkout` function in cart.ts"), not "read this 4,000-line file."
- **Tame loud commands.** A failing test suite that prints 2,000 lines floods the window. Ask Claude to run a *focused* test, or pipe to a filter.
- **Externalize durable knowledge.** Decisions you'll need later go in `CLAUDE.md`, a planning doc, or a commit message — not just floating in chat history that you'll `/clear` away.
- **Commit often.** A commit is durable memory; once work is committed you can `/clear` freely and the agent can re-read the code if needed.

## 6. The "scratchpad file" technique

For multi-session or very large efforts, have Claude maintain a plain Markdown file (e.g. `PLAN.md` or `NOTES.md`) capturing the goal, decisions, and remaining steps. Then:

- When you `/clear` or start tomorrow, just say "read PLAN.md to get up to speed."
- The plan survives context resets because it lives on **disk**, not in the window.

This is how you run work that's too big for a single context: persist state to a file, reset the window, reload the file.

## 7. The golden rule

> **One coherent task per context.** Start it clean, work it, commit it, `/clear`, next.

If you do nothing else from this chapter, do that. It single-handedly fixes most "Claude got worse over time" complaints.

## 8. Frequently Asked Questions

**Q: Does /clear delete my code or my CLAUDE.md?**
No. `/clear` only resets the *conversation context*. Your files on disk, your commits, and your `CLAUDE.md` are untouched — and `CLAUDE.md` reloads on the next message.

**Q: /compact vs /clear — when do I really need compact?**
Reach for `/clear` by default. Use `/compact` only when you're *in the middle of one task* whose history you can't afford to lose but which has grown long. If you're between tasks, `/clear` is almost always better.

**Q: How do I know the window is filling up?**
Watch for the symptoms in §2, and note that some versions show a context/usage indicator. Don't obsess over the number — build the *habit* (clear between tasks) and you'll rarely hit the ceiling.

## Action Item for Chapter 6

1. In your next work session, deliberately `/clear` **between** two unrelated tasks and notice how the second task feels sharper.
2. Take one genuinely long single task and try `/compact` mid-way; observe that Claude continues coherently from the summary.
3. Start a `PLAN.md` for any multi-step effort and practice the "clear, then reload the plan" cycle once.
</content>
