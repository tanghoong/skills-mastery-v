# Chapter 12: Hooks — Deterministic Automation Around Claude's Actions

Everything so far has *influenced* Claude (context, prompts, skills). **Hooks** are different: they are **deterministic** code that runs automatically at defined points in Claude's lifecycle — guaranteed, every time, whether or not Claude "decides" to. If you've ever thought "Claude should *always* run the linter after editing" or "never let it touch this file," that's a hook.

## 1. Why hooks exist: "always" needs a guarantee

There's a critical distinction:

- **Instructions** (in `CLAUDE.md` or a prompt) are *probabilistic*. Claude usually follows them, but "usually" isn't "always."
- **Hooks** are *deterministic*. They're shell commands the **harness** runs — not Claude — so they execute every single time the trigger fires, no judgment involved.

> If your requirement contains the word **"always"** or **"never"** — *always* format after edits, *never* commit secrets, *always* run tests before declaring done — that's a hook, not a `CLAUDE.md` line. This is the key lesson of the chapter.

## 2. When hooks fire

Hooks attach to **events** in the session lifecycle. The common ones:

| Event (conceptual) | Fires when… | Classic use |
|--------------------|-------------|-------------|
| **PreToolUse** | Before Claude runs a tool (e.g. an edit or command) | Block edits to protected files; validate/deny risky commands |
| **PostToolUse** | After a tool runs | Auto-format/lint the file Claude just edited; run type-check |
| **UserPromptSubmit** | When you submit a message | Inject extra context; enforce policies |
| **Stop / SubagentStop** | When Claude finishes responding | Run the test suite; notify you |
| **SessionStart** | When a session begins | Ensure deps are installed, the project can build |
| **Notification** | When Claude needs attention | Send a desktop/Slack ping |

Names vary by version — check the docs — but the model is the same: *"when X happens in the session, run this command."*

## 3. What a hook can do

A hook is a shell command (so it can be anything you can script). Beyond just running, hooks can **influence the flow**:

- **Observe:** log what Claude did, send a notification.
- **Modify/augment:** format code, inject extra context into the prompt.
- **Block:** a `PreToolUse` hook can *deny* an action — e.g. refuse any edit to `secrets.env`, or veto a `git push --force`. This is real, enforced guardrailing, not a polite request.

```
PostToolUse(edit *.ts)  →  run `prettier --write` on the file
PreToolUse(Bash)        →  if command matches `rm -rf /`, deny it
Stop                    →  run `npm test`; report failures
SessionStart            →  run `npm install` so the env is ready
```

## 4. Where hooks are configured

Hooks live in your **settings files** (project `.claude/settings.json`, or personal settings), mapping an event (and often a matcher, like "only for edits to `*.ts`") to a command. Because the harness — not the model — executes them, they can't be skipped, talked out of, or forgotten by Claude.

> This is also why hooks are the right tool for **policy**: a teammate's Claude, your Claude, and a CI run all obey the same hook because it's wired into the harness, not into a prompt the model might interpret loosely.

## 5. Canonical use cases

- **Auto-format / auto-lint** after every edit, so output is always clean (`PostToolUse`).
- **Run tests when Claude says it's done** and surface failures (`Stop`).
- **Protect sensitive files/commands** — deny edits to secrets, block destructive git ops (`PreToolUse`).
- **Guarantee a healthy environment** at session start — install deps, generate types (`SessionStart`). *This is exactly what a "session-start hook" sets up for cloud/web sessions: making sure the project can actually run tests and linters.*
- **Notify you** when Claude needs input or finishes a long job (`Notification`/`Stop`).

## 6. Hooks vs. everything else

| Need | Reach for |
|------|-----------|
| Context Claude should know | `CLAUDE.md` (Ch. 5) |
| A procedure Claude applies when relevant | Skill (Ch. 11) |
| A prompt you invoke | Slash command (Ch. 9) |
| Something that must happen **automatically & every time** | **Hook** |

The discriminator is **automatic + guaranteed**. The moment a requirement is "this should happen on its own, without anyone asking, every time," you've left prompt-land and entered hook-land.

## 7. A word of caution

Because hooks run real commands automatically with your permissions, treat them like any automation:

- Start simple (a formatter on edit) before wiring complex logic.
- Be careful with **blocking** hooks — an overly aggressive deny rule can stall every session.
- Review hooks you didn't write before trusting a repo's settings, the same way you'd review any script that runs on your machine.

## 8. Frequently Asked Questions

**Q: Why not just put "always run the linter" in CLAUDE.md?**
Because `CLAUDE.md` is a *request* the model usually honors — not a guarantee. For anything that genuinely must happen *every* time (formatting, secret protection, tests-before-done), only a hook gives certainty, because the harness runs it regardless of what Claude decides.

**Q: Do hooks slow things down?**
A little — they run real commands. Keep them fast and targeted (format only the edited file, not the whole repo). The reliability is usually well worth a few seconds.

**Q: Can a hook stop Claude from doing something dangerous?**
Yes — a `PreToolUse` hook can inspect a pending action and **deny** it (block edits to protected paths, veto destructive commands). That's one of the strongest safety mechanisms Claude Code offers.

## Action Item for Chapter 12

1. Identify one "always/never" rule you care about (e.g. "always format `.ts` files after editing").
2. Add a `PostToolUse` hook to your project settings that runs your formatter on edited files. Make an edit and watch it auto-format — no prompting required.
3. (Stretch) Add a `Stop` hook that runs your test command so you always learn the test status when Claude finishes. Note how this *guarantees* verification rather than hoping for it.
</content>
