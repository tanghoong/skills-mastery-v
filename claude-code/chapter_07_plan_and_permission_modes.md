# Chapter 7: Plan Mode & Permission Modes

Two of Claude Code's controls give you precise authority over *when it thinks* versus *when it acts*, and *what it's allowed to do*. Used together, they let you run on a spectrum from "ask me before everything" to "go fully autonomous" — matching the control level to the task's risk.

## 1. Plan mode — research and propose, but don't touch

In Chapter 4 you got the planning benefit by *asking* for a plan. **Plan mode** formalizes it: Claude explores and proposes a plan **without making any edits or running state-changing commands** until you explicitly approve. It's a read-only investigation mode with an approval gate at the end.

Typical flow:

1. Enter plan mode (toggle it on, or your version may bind it to a key like Shift+Tab — check `/help`).
2. Give your request. Claude reads, searches, and reasons.
3. Claude presents a **plan** — files it'll change, the approach, trade-offs.
4. You approve (it proceeds to implement) or refine (adjust and re-plan).

**Use plan mode when:**

- The change is non-trivial or touches many files.
- You're unfamiliar with the code and want to understand before changing.
- You want to compare approaches before committing to one.
- The cost of a wrong large diff is high.

**Skip it when:** the task is small and reversible — planning a one-line rename is wasted ceremony.

> Plan mode is the Explore + Plan steps of the core loop, enforced. It's the safest way to point Claude at unfamiliar or risky code.

## 2. Why planning first is so effective

A model that's allowed to act will often start acting before fully understanding — and then rationalize. Plan mode removes the temptation: with editing off the table, Claude spends its effort on *understanding*. You review a paragraph, not a 300-line diff. Corrections cost a sentence. This is the cheapest quality lever you have on hard tasks.

## 3. Permission modes — controlling what Claude can do

Separately, Claude Code gates *consequential actions* (editing files, running shell commands) behind **permissions**. Permission modes set how much it asks:

| Mode (conceptual) | Behavior | When to use |
|-------------------|----------|-------------|
| **Default / ask** | Prompts before edits & commands | Learning; risky or unfamiliar repos |
| **Accept edits** | Auto-accepts file edits, still gates other actions | Trusted, well-scoped editing sessions |
| **Plan** | Read-only; no edits at all until approved | Investigation, risky changes (see §1) |
| **Bypass / "yolo"** | Acts without asking | Sandboxes, throwaway repos, automation — **never on important code unsupervised** |

Exact names and how you switch vary by version (often a keypress cycles them, or `/help` shows the command). The *concept* is what matters: you choose how much rope the agent gets.

## 4. The risk/control trade-off

```
more control  ◄─────────────────────────────────►  more autonomy
  plan mode      default/ask     accept-edits      bypass
  (read-only)   (confirm each)  (auto-edit)      (no prompts)
   safest                                          fastest/riskiest
```

The skill is matching the slider to the situation:

- **Unfamiliar prod codebase, big change** → plan mode, then default/ask.
- **Greenfield feature in a scratch project** → accept-edits to move fast.
- **Disposable sandbox or scripted automation** → bypass is fine.
- **Anything you can't easily revert** → tighten up; make it ask.

> A useful default for real work: **plan mode to design, accept-edits to execute the approved plan, and commit often** so every step is a checkpoint you can roll back to.

## 5. Allow-lists: fewer prompts without going fully open

You don't have to choose between "prompt for everything" and "prompt for nothing." Claude Code lets you **pre-approve specific safe actions** — e.g. always allow `npm test` or `git status` — so routine, harmless commands stop interrupting you while genuinely consequential ones still ask. These live in your settings (project or personal). This is how experienced users get a smooth flow *and* keep guardrails on the dangerous stuff.

## 6. A note on safety

Permission prompts exist because an agent can run real commands in your real environment. Treat them as a feature, not friction — especially:

- When working in a repo you care about.
- When Claude is acting on instructions or data from **outside sources** (a web page, an issue, a file) that could try to steer it somewhere you didn't intend.
- Before anything destructive (deleting files, force-pushing, dropping a database).

Loosen permissions deliberately and locally, never reflexively.

## 7. Frequently Asked Questions

**Q: Plan mode vs just asking "make a plan first"?**
Asking works and is great for quick cases. Plan mode *guarantees* nothing gets edited until you approve — better for risky or large changes where you don't want Claude to start acting on a misread.

**Q: The permission prompts are slowing me down. Bad idea to turn them off?**
Don't turn them *all* off — pre-approve the *safe, routine* ones (allow-list) and keep prompts on consequential actions. That gets you speed without losing the guardrail that catches "wait, why is it editing that?"

**Q: Is bypass mode ever okay?**
Yes — in sandboxes, throwaway repos, and controlled automation where a mistake costs nothing. It's genuinely dangerous on a codebase you care about, because there's no human checkpoint. Match it to stakes.

## Action Item for Chapter 7

1. Run a real, moderately complex request in **plan mode**. Read the plan, change one thing about it, then approve. Notice how much smaller your review burden was than reviewing a finished diff.
2. Switch to **accept-edits** for a small, well-scoped task and feel the difference in flow.
3. Pre-approve one safe command you run constantly (like your test command) and confirm the prompts for it stop.
</content>
