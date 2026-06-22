# Chapter 14: Real Workflows — TDD, Debugging, Large Codebases, Refactoring, Review

You now know the features. This chapter assembles them into **battle-tested workflows** for the things you actually do all day. Each is a recipe built from the core loop (Ch. 4) plus the right features. Steal them, then adapt.

## 1. Test-Driven Development with Claude

TDD is *unusually* effective with an agent, because tests give Claude an objective, automatic way to verify its own work — turning "I think this is right" into "the suite is green."

**The workflow:**

```
1. "Write tests for <behavior>. Cover these cases: … Don't write the
    implementation yet — I want the tests to fail first."
2. Run them — confirm they fail for the right reason (red).
3. "Now implement <behavior> until all those tests pass. Don't modify
    the tests to make them pass."
4. Claude codes, runs the suite, iterates until green.
5. Review the implementation; commit.
```

Why it works: the tests are a **specification Claude can't argue with**. The explicit "don't modify the tests" guard is important — otherwise an agent under pressure may "fix" a failing test by weakening it. Pair this with a `Stop` hook that runs the suite (Ch. 12) and verification becomes automatic.

## 2. Debugging

Resist the urge to say "fix the bug." Make Claude **understand before it changes** — that's the whole game in debugging.

**The workflow:**

```
1. Give it the evidence: the error message, stack trace, repro steps,
    and what you expected vs. got. (MCP can fetch logs/Sentry directly — Ch. 13.)
2. "Diagnose the root cause. Explain what's happening before changing
    anything." (Keep it read-only — plan mode is ideal here.)
3. Review its diagnosis. Does the causal story actually make sense?
4. "Fix it, and add a regression test that fails without the fix."
5. Run; confirm the new test passes and nothing else broke.
```

The most common debugging failure is letting Claude *patch a symptom* before it's found the cause. Forcing the explanation step catches "you're treating the symptom, the real bug is upstream" while it's still just a conversation.

## 3. Navigating a large/unfamiliar codebase

Claude is an excellent guide to code *you* don't know yet — and you don't have to load the whole repo to use it.

**The workflow:**

```
1. "Give me a high-level map of this repo: the main packages and what
    each is responsible for."
2. "Trace what happens when a user submits the checkout form, file by file."
3. Use a read-only exploration subagent (Ch. 10) for broad 'where is X used?'
    searches so the answers don't flood your main context.
4. Once oriented, switch to the core loop for the actual change.
```

Onboarding to a new codebase is one of Claude Code's killer apps. Spend ten minutes having it explain the terrain before you touch anything.

## 4. Refactoring

Refactoring with an agent is safe *if* you anchor it to behavior preservation and tight scope.

**The workflow:**

```
1. Ensure tests exist first. No tests? "Write characterization tests that
    capture the CURRENT behavior of <module> before we refactor." Commit them.
2. "Refactor <module> for <goal: readability / extract duplication / etc.>.
    Do NOT change behavior or public signatures. The tests must still pass."
3. Keep scope explicit: "Only touch <these files>."
4. After each coherent step, run tests and commit. Small, verified increments
    beat one giant refactor diff.
```

The tests are your safety net; "don't change behavior/signatures" plus a tight scope is your guardrail against the classic "I asked for a cleanup and got a rewrite."

## 5. Code review

Claude is a tireless first-pass reviewer — best used to catch the boring-but-costly stuff before a human looks.

**The workflow:**

```
1. "Review the current diff. Check: correctness/edge cases, type safety,
    error handling, and CLAUDE.md convention violations. List findings as a
    checklist with severity. Don't fix yet."
2. Triage the list yourself — you decide what's real.
3. "Fix items 1, 3, and 5. Leave the rest." (Or fix them yourself.)
```

Save that prompt as `/review` (Ch. 9) or a review skill (Ch. 11) so it's consistent every time. A `PreToolUse`-style review in CI via headless mode (Ch. 13) extends this to every PR automatically.

## 6. Orchestrating bigger work

When a task is too big for one clean loop:

```
1. Have Claude write a PLAN.md breaking it into independent, commit-able steps (Ch. 6).
2. For each step: /clear → "read PLAN.md, do step N" → verify → commit → update PLAN.md.
3. Fan out genuinely independent steps to subagents in parallel (Ch. 10).
4. The main thread stays the coordinator, synthesizing results.
```

This is the scale-up of the core loop: persistent plan on disk, clean context per step, parallelism where the work allows.

## 7. The meta-pattern

Notice what every workflow above shares:

1. **Understand before acting** (explore / diagnose / map).
2. **Establish a verification mechanism** (tests, types, lint).
3. **Constrain scope** ("don't change X").
4. **Work in verified, committed increments.**

If you ever face a workflow not listed here, build it from those four moves. They generalize to anything.

## 8. Frequently Asked Questions

**Q: Which workflow should I master first?**
TDD and debugging. They give the biggest reliability gains because both center on *verification* — the thing that turns an agent from "plausible" to "correct." Once self-verification is a habit, everything else improves.

**Q: These all start with 'understand first.' Isn't that slow?**
It's slower to *first code* and faster to *correct, committed code*. The understanding step is where wrong large diffs get prevented. On trivial tasks, skip it; on anything real, it pays for itself.

**Q: How do I keep Claude from "fixing" failing tests by deleting them?**
Say so explicitly ("do not modify the tests to make them pass") and review the diff. For high stakes, treat the tests as committed/locked before implementation so any change to them is glaringly visible in the diff.

## Action Item for Chapter 14

Pick **one** workflow that matches something on your plate this week and run it end-to-end exactly as written:

1. Do TDD on a small new function, *or* debug a real bug by forcing the diagnosis-first step.
2. Note where the workflow caught something a "just do it" prompt would have missed.
3. Turn the prompt you used most into a saved slash command or skill for next time.
</content>
