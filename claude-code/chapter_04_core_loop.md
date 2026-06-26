# Chapter 4: The Core Loop — Explore → Plan → Code → Commit

You now know how Claude thinks (Ch. 1) and how to phrase a request (Ch. 3). This chapter gives you the **workflow** that ties it together. If you internalize one process from this course, make it this one. It prevents the majority of frustrating sessions.

## 1. The loop

```
EXPLORE  →  PLAN  →  CODE  →  COMMIT
   ▲                            │
   └────────── repeat ──────────┘
```

The instinct of new users is to jump straight to **CODE** ("just write the feature"). The instinct of experts is to spend most of their energy on **EXPLORE** and **PLAN**, because a good plan makes the code almost automatic — and a bad plan makes the code a mess no matter how clever it is.

## 2. EXPLORE — build shared understanding first

Before asking for a change, ask Claude to *understand and explain* the relevant code. You're doing two things: verifying Claude has the right picture, and giving yourself one too.

```
Before changing anything, read the files involved in user signup and explain:
1. The flow from form submission to database write.
2. Where validation currently happens.
3. Any error handling already in place.
Don't write any code yet.
```

Why this matters: if Claude's explanation is wrong, you just caught a misunderstanding **for free**, before any code was written. If it's right, you've primed its context with exactly the files the change will touch.

> **Tip:** "Don't write any code yet" is a magic phrase. It keeps Claude in read-only exploration so you can align before it acts.

## 3. PLAN — get the approach in writing

Once Claude understands the terrain, ask for a *plan*, not code:

```
Propose a plan to add rate-limiting to the signup endpoint.
List the files you'd change and what you'd do in each. Wait for my approval.
```

Now you review a short plan instead of a large diff. Catching "you're modifying the wrong middleware" here costs one sentence to fix. Catching it after the code is written costs a revert.

Claude Code has a dedicated **plan mode** that formalizes exactly this — it researches and proposes without making changes until you approve. We cover it in Chapter 7. For now, you can get 80% of the benefit just by asking for a plan in plain English.

## 4. CODE — let it execute the approved plan

With an agreed plan, the coding step is often a one-liner: *"Looks good, go ahead."* Because the context already holds the right files and an approved approach, the edits tend to land cleanly.

While it codes:

- **Watch the first edit or two.** If the first file looks wrong, Esc and correct — don't wait for all of them.
- **Let it verify.** Encourage it to run tests/types/lint: "After the change, run the type-checker and fix anything that breaks." Self-verification is what separates an agent from a code generator.

## 5. COMMIT — capture the win, then reset

When a unit of work is done and verified, commit it. Commits are how an *agent's* work becomes durable memory (the code + the message), and they create clean checkpoints to roll back to.

```
Commit this with a clear message. Don't include unrelated changes.
```

Then — crucially — **start the next task with a clean context** (`/clear`, Chapter 6). One coherent task per context window keeps Claude sharp. Cramming five unrelated tasks into one long session is the #1 cause of degraded output.

> Note: Claude won't commit or push unless asked (and good practice is to branch first). You stay in control of your git history.

## 6. Why the loop works

Each step de-risks the next:

| Step | What it prevents |
|------|------------------|
| Explore | Claude acting on a wrong understanding |
| Plan | Large, wrong, hard-to-review diffs |
| Code | Unverified changes that break the build |
| Commit + reset | Context rot and tangled, unrelated changes |

Skipping steps is fine for *trivial* tasks (rename a variable — just do it). The loop earns its keep on anything moderate or risky.

## 7. A worked example (condensed)

```
You:    Read the cart checkout code and explain how totals are calculated.
        Don't change anything.
Claude: [explains: subtotal in cart.ts, tax in tax.ts, no discount handling]
You:    Right. Plan how to add a percentage discount code. List files + changes.
Claude: [plan: add discount.ts, apply in cart.ts total, validate code format]
You:    Good, but validation belongs in a separate validateCode() — adjust the plan.
Claude: [revised plan]
You:    Go. Run the tests after.
Claude: [edits, runs tests, 1 fails, fixes it, tests pass]
You:    Commit it. Message: "feat: percentage discount codes at checkout".
You:    /clear        ← ready for the next task with a clean slate
```

Notice how little code *you* read, and how early the one correction happened.

## 8. Frequently Asked Questions

**Q: Isn't all this explore/plan overhead slower?**
For trivial tasks, yes — so skip it there. For real features, it's *much* faster overall, because you avoid the slow path of reviewing and reverting a large wrong change. Measure end-to-end (until it's actually correct), not just time-to-first-code.

**Q: Claude started coding when I only wanted a plan. Why?**
Your prompt probably read as a command to implement. Add "Don't write code yet — just propose a plan and wait for approval," or use plan mode (Ch. 7), which enforces it.

**Q: How big should one loop be?**
One coherent, commit-able unit of work — something you could describe in a single sentence and review in one sitting. If a task needs three commits, that's three loops, ideally with a context reset between them.

## Action Item for Chapter 4

Pick a real change in a real project and run the **full loop** deliberately, narrating each phase to yourself:

1. Ask Claude to explore and explain (no code).
2. Ask for a plan and *change one thing* about it.
3. Approve and let it code + verify.
4. Commit.
5. `/clear`.

Then reflect: at which step did you catch something you'd otherwise have missed?
</content>
