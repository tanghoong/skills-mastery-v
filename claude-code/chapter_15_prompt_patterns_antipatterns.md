# Chapter 15: The Prompt Pattern Library & Anti-Patterns

This chapter is your **reference card**. Part A is a library of reusable prompt patterns — proven phrasings you can adapt. Part B is the catalog of anti-patterns that waste the most time, each paired with its fix. Skim it now; come back to it often.

---

## Part A — The Prompt Pattern Library

Each pattern is a *shape*, not a script. Fill in the brackets.

### Exploration patterns

> **Map-the-territory:** "Give me a high-level map of `<repo/dir>`: the main parts and what each is responsible for. Don't change anything."

> **Trace-the-flow:** "Trace what happens when `<event>`, file by file, from `<start>` to `<end>`. Read-only."

> **Explain-then-confirm:** "Before any changes, explain how `<feature>` currently works and which files are involved. I'll confirm before we proceed."

### Planning patterns

> **Plan-and-wait:** "Propose a plan to `<goal>`. List the files you'd change and what you'd do in each. Wait for my approval before coding."

> **Compare-approaches:** "Give me 2–3 ways to `<goal>` with trade-offs. Recommend one and say why. Don't implement yet."

### Implementation patterns

> **Five-ingredient (Ch. 3):** "Goal: `<outcome>`. Context: `<non-obvious facts>`. Scope: only touch `<files>`, leave `<X>` alone. Example: follow `<existing pattern>`. Constraints: `<rules>`."

> **Mirror-an-example:** "Create `<new thing>` modeled on `<existing thing>`. Match its structure, naming, and error handling."

> **Behavior-preserving:** "Refactor `<target>` for `<goal>`. Do NOT change behavior or public signatures. Tests must still pass. Only touch `<files>`."

### Verification patterns

> **Self-verify:** "After the change, run `<test/typecheck/lint>` and fix anything that breaks before telling me you're done."

> **Red-green TDD (Ch. 14):** "Write failing tests for `<behavior>` covering `<cases>` — implementation comes after. Don't write the implementation yet."

### Review & correction patterns

> **Checklist-review:** "Review the current diff for correctness, type safety, error handling, and convention violations. List findings with severity. Don't fix yet."

> **Specific-redirect (Ch. 8):** "That's wrong because `<reason>`. Instead, `<the right thing>`. Specifically `<concrete detail>`."

### Meta patterns

> **Scratchpad (Ch. 6):** "Maintain `PLAN.md` with the goal, decisions, and remaining steps. Update it as we go so we survive a context reset."

> **Teach-me:** "As you do this, explain the *why* behind each decision so I learn the codebase, not just the result."

---

## Part B — Anti-Patterns (and their fixes)

### 1. The vague one-liner

❌ "Fix the bug." / "Make it better." / "Add auth."
**Why it fails:** no goal, context, or scope — Claude guesses, often wrong.
✅ **Fix:** apply the five ingredients (Ch. 3), or start with an exploration prompt if you can't yet scope it.

### 2. Skipping straight to code on a hard task

❌ Asking for a big feature with no explore/plan step.
**Why it fails:** you review a large wrong diff instead of a short wrong plan.
✅ **Fix:** explore → plan → approve → code (Ch. 4); use plan mode for risky changes (Ch. 7).

### 3. The marathon session

❌ Ten unrelated tasks in one ever-growing context.
**Why it fails:** context pollution — Claude forgets, conflates tasks, degrades (Ch. 6).
✅ **Fix:** one coherent task per context; `/clear` between tasks; commit checkpoints.

### 4. Watching 12 edits fly by, then reacting

❌ Looking away while Claude executes, reviewing only at the end.
**Why it fails:** a wrong assumption at edit #2 contaminates edits #3–12 (Ch. 8 cost curve).
✅ **Fix:** watch the first edit or two; **Esc** and redirect at the first sign of drift.

### 5. Vague corrections

❌ "No, not like that." / "Still wrong."
**Why it fails:** Claude re-guesses; you loop.
✅ **Fix:** say what's wrong *and* what right looks like, concretely (Specific-redirect).

### 6. Dumping huge context

❌ "Read this entire 4,000-line file and the whole `/src` tree."
**Why it fails:** floods the window with noise, crowding out reasoning (Ch. 6).
✅ **Fix:** point at the *relevant* part; let subagents do broad searches (Ch. 10).

### 7. Putting "always/never" rules in CLAUDE.md and hoping

❌ Expecting a `CLAUDE.md` line to *guarantee* the linter always runs.
**Why it fails:** instructions are probabilistic, not enforced.
✅ **Fix:** if it must happen every time, make it a **hook** (Ch. 12).

### 8. No verification mechanism

❌ Accepting "Done!" with nothing checking the work.
**Why it fails:** "looks plausible" ≠ "correct."
✅ **Fix:** give Claude tests/types/lint to run; ask it to self-verify; consider a `Stop` hook.

### 9. The sunk-cost rescue

❌ Spending 20 minutes nursing a confused, polluted session.
**Why it fails:** the context is the problem; more prompting muddies it further.
✅ **Fix:** `/clear`, fold the lesson into a sharper prompt, start clean (Ch. 8).

### 10. Trusting unattended autonomy on important code

❌ Bypass-permissions or unsupervised headless runs against production.
**Why it fails:** no human checkpoint + real capability + possibly untrusted input = real damage.
✅ **Fix:** match autonomy to stakes; sandbox automation; keep permissions/hooks meaningful (Ch. 7, 13).

---

## The two-sentence summary of the whole course

> **Put the right context in, scope the task tightly, let Claude plan before it acts, give it a way to verify, and steer the moment it drifts.** Everything else — `CLAUDE.md`, skills, hooks, subagents, MCP — is just a more powerful way to do one of those five things.

## Action Item for Chapter 15

1. Copy Part A's patterns you find most useful into your own notes (or a `/`-command file).
2. Go back through your recent Claude Code history and find **one** anti-pattern from Part B you're guilty of. Write the specific fix you'll apply next time.
3. Turn your single most-used pattern into a saved slash command or skill.
</content>
