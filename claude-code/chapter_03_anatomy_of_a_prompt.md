# Chapter 3: Anatomy of a Great Prompt

This is the most important chapter in the course. Everything else is features; this is the core skill. A great Claude Code prompt has **five ingredients**. You won't always need all five, but knowing them turns vague requests into precise direction.

## 1. The five ingredients

```
GOAL        — what outcome you want, stated as a result not a task
CONTEXT     — what Claude needs to know that it can't easily discover
SCOPE       — boundaries: what to touch, what to leave alone
EXAMPLES    — concrete patterns, inputs/outputs, or "like X" references
CONSTRAINTS — rules: conventions, libraries, "don't do Y"
```

Compare:

❌ **Weak prompt**
> Add caching.

✅ **Strong prompt**
> **Goal:** Cache the results of `getUserProfile()` so repeated calls within 60s don't hit the database.
> **Context:** It's called on every page render in `apps/web`; the DB query is the slow part.
> **Scope:** Only change `packages/database/src/users.ts`. Don't touch the API routes.
> **Example:** We already cache with `lru-cache` in `getOrgSettings()` — follow that pattern.
> **Constraints:** Keep it type-safe, no `any`. Cache key is the userId.

The second prompt will succeed on the first try. The first will trigger a guessing game.

## 2. Goal: describe the outcome, not the keystrokes

Claude is good at *figuring out how*. It's bad at *reading your mind about what*. State the end state.

- ❌ "Open `auth.ts` and add an if statement that checks the token."
- ✅ "Reject requests with an expired JWT before they reach the handler, returning 401."

The second lets Claude pick the cleanest implementation (maybe middleware, maybe a guard) instead of forcing your half-formed idea.

> **Exception:** when you *do* know exactly how you want it done (a specific pattern, a specific file), say so. Specifying the *how* is a constraint, not a crutch — it's fine when intentional.

## 3. Context: front-load what it can't discover

Claude can read your code. It cannot read:

- Your **intent** ("this is a temporary hack for a demo Friday").
- **External facts** ("the staging DB is read-only", "this API is deprecated").
- **History** ("we tried Redis here and it caused a memory leak").
- **Unwritten conventions** (unless they live in `CLAUDE.md` — Chapter 5).

Give it the non-obvious context up front. You don't need to explain things it can just read — that wastes the context window. The art is supplying *only* what it can't find on its own.

## 4. Scope: the underrated superpower

Unbounded prompts produce unbounded changes. Telling Claude what **not** to touch is often more valuable than telling it what to do.

> "Refactor `parseConfig` for readability. **Don't change its signature or behavior** — this is a pure cleanup. Don't touch any other function."

Scope prevents the classic failure where you ask for a small fix and get a 14-file "improvement" you now have to review and partly revert.

## 5. Examples: the cheapest accuracy boost

One concrete example is worth a paragraph of description. Examples come in three flavors:

- **Pattern reference:** "Follow the same structure as `UserRepository`."
- **Input/output:** "`slugify('Hello World!')` should return `'hello-world'`."
- **Anchor file:** "Model the new `PostsController` on `CommentsController`."

When you point at existing code, you also keep the codebase *consistent* — Claude mirrors your conventions instead of inventing new ones.

## 6. Constraints: the rules of the road

Constraints are the guardrails that keep output idiomatic:

- Tech: "Use `zod` for validation, not manual checks."
- Style: "Prefer `interface` over `type` for object shapes."
- Safety: "No `any`. `strict` mode must still pass."
- Process: "Don't commit. Don't run migrations."

Many constraints repeat across every task — those belong in `CLAUDE.md` so you stop retyping them (Chapter 5). One-off constraints go in the prompt.

## 7. The "specificity ladder"

You don't need a five-part essay for every request. Match effort to risk:

| Task risk | Prompt style |
|-----------|--------------|
| Trivial, reversible ("rename this var") | One line is fine |
| Moderate ("add a function") | Goal + a constraint or example |
| High / wide-reaching ("refactor auth") | All five ingredients + plan mode (Ch. 7) |

Mastery isn't writing long prompts. It's writing *exactly as much as the task needs* — and no more.

## 8. Iterate; don't perfect

You will not write the perfect prompt every time, and you don't need to. Claude Code is conversational: send a good-enough prompt, watch the first move, and **correct**. Often the fastest path is:

```
1. Decent prompt
2. Watch Claude's plan / first edit
3. "Actually, use X instead of Y" / "stop — wrong file"
4. Continue
```

A tight feedback loop beats an essay you spent five minutes crafting. (Chapter 8 is entirely about correcting.)

## 9. Frequently Asked Questions

**Q: Should I tell Claude *how* to do it or let it decide?**
Default to describing the *outcome* and let it choose the approach — it's often better than your first idea, and it stays consistent with your codebase. Override with a specific approach only when you have a real reason (a known constraint, a required pattern).

**Q: My prompts get long. Is that bad?**
Long isn't bad; *unfocused* is bad. If you're repeating the same constraints every session, move them to `CLAUDE.md` (Ch. 5). If a single task genuinely needs a lot of context, that's fine — but consider plan mode so you can verify before it acts.

**Q: What if I don't know enough to scope it?**
Then your first prompt is an *exploration* prompt: "Explain how authentication currently works in this repo and which files are involved." Read the answer, *then* write your scoped change request. (This is the Explore step of Chapter 4.)

## Action Item for Chapter 3

Take the task you wrote down in Chapter 1. Write **two** versions of a prompt for it:

1. A one-liner (what you'd naively type).
2. A five-ingredient version (goal, context, scope, examples, constraints).

Run **both** in separate Claude Code sessions on the same starting code. Compare the results. The gap you observe *is* the skill this chapter teaches.
</content>
