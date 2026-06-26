# Chapter 8: Course-Correcting — Interrupt, Redirect, Recover

No matter how good your prompt is, Claude will sometimes head the wrong way. Experts aren't people who never get bad output — they're people who **notice early and correct fast**. This chapter is the recovery toolkit. It's short, but it's what makes the difference between a 2-minute redirect and a 20-minute mess.

## 1. The most important key: Esc

**Press Esc to interrupt Claude mid-action.** This is your steering wheel. The moment you see it heading wrong — wrong file, wrong approach, misunderstanding — stop it. Don't politely wait for it to finish a wrong path out of some instinct not to "interrupt."

```
[Claude is editing the wrong module]
You: <Esc>
You: Stop — that's the legacy module. The active one is apps/web/src/auth.
     Undo that and work there instead.
```

Interrupting early is *cheaper* than letting it finish: less to review, less to revert, less polluted context.

## 2. The cost curve of correction

```
cost of fixing
   │                                         ╱
   │                                      ╱
   │                                 ╱
   │                          ╱
   │              ╱
   │   ____╱
   └──────────────────────────────────────────► time since drift started
     plan step   first edit   5 edits    "done", build broken
```

Catching a wrong assumption at the **plan** step is nearly free. Catching it after the feature is "done" means untangling a diff. This is *why* Chapters 4 and 7 push planning so hard — and why you should watch the first edit or two of any real task instead of looking away.

## 3. Redirecting: be specific about the correction

When you correct, apply Chapter 3 in miniature — say what's wrong *and* what right looks like:

- ❌ "No, that's wrong." (Wrong how? Now it guesses again.)
- ✅ "That adds a new util; instead reuse the existing `formatDate` in `lib/date.ts`."
- ✅ "You changed the function signature — keep it identical, only change the body."

A precise correction usually lands on the next try. A vague one starts another round of guessing.

## 4. When to redirect vs. when to restart

| Situation | Best move |
|-----------|-----------|
| Small wrong turn, rest is fine | Esc + specific redirect, continue |
| Claude is confused but context is salvageable | Re-state the goal crisply, point at the right files |
| Context is polluted / it's tangled two tasks / repeated failures | **`/clear` and start over** with a better prompt |
| The diff is a mess | Revert the changes, then `/clear`, then retry with a plan |

**Don't fall for the sunk-cost trap.** If a session has gone sideways and Claude keeps missing, a clean `/clear` + a sharper prompt is almost always faster than nursing the confused session back to health. Restarting is a *strategy*, not a failure.

## 5. Undoing changes

Because Claude edits real files, you need real undo:

- **Ask Claude to revert:** "Undo the changes you just made to `cart.ts`." It can do this if the edits are fresh in context.
- **Use git:** the strongest safety net. If you committed before starting (Ch. 4), `git restore` / `git checkout` / resetting to the last commit wipes the experiment cleanly. This is *why* "commit before a risky task" is a rule.
- **Check before destructive undo:** make sure you're not throwing away *good* changes mixed in with bad ones.

> The combination **commit checkpoint → let Claude try → revert if wrong** turns risky changes into safe experiments. Lean on git; it's your undo stack.

## 6. Diagnosing *why* it drifted (so it stops happening)

Every derail is feedback about your setup. After a bad turn, ask: *why?*

| Root cause | Permanent fix |
|------------|---------------|
| It didn't know a convention | Add it to `CLAUDE.md` (Ch. 5) |
| It touched the wrong file | Scope explicitly next time; name the file (Ch. 3) |
| It misunderstood the goal | Explore/plan before coding (Ch. 4, 7) |
| It "forgot" mid-session | Context was polluted — `/clear` more, tasks smaller (Ch. 6) |
| It acted before you could review | Use plan mode / watch the first edit (Ch. 7) |

Mastery is converting each derail into a `CLAUDE.md` line or a habit, so the *class* of mistake doesn't recur.

## 7. Frequently Asked Questions

**Q: I feel rude interrupting it. Should I let it finish?**
No. It's a program, not a person — there's nothing to offend, and letting a wrong path finish only creates more to clean up. Interrupt the instant you see drift.

**Q: It keeps making the same mistake even after I correct it.**
Two likely causes: (1) the correction was vague — be concrete about the desired result; or (2) the context is now muddled by the failed attempts — `/clear` and start fresh with the lesson baked into your prompt or `CLAUDE.md`. Repeating yourself into a confused context rarely works.

**Q: How do I avoid needing to correct so much?**
You can't eliminate it, but Chapters 4–7 minimize it: plan before acting, scope tightly, keep context clean, give it `CLAUDE.md`. Correction is normal; *frequent* correction means tightening your inputs.

## Action Item for Chapter 8

1. In a scratch repo, give Claude a slightly ambiguous task and **deliberately Esc** the moment it does something you didn't intend. Practice the interrupt until it's reflex.
2. Practice the safety pattern: `git commit` a checkpoint → ask for a risky change → `git restore` to throw it away cleanly.
3. Recall your last frustrating AI-coding session. Identify which root cause in §6 it was, and write the `CLAUDE.md` line or habit that would have prevented it.
</content>
