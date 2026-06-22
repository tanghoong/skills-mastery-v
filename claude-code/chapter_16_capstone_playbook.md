# Chapter 16: Capstone — Build Your Personal Claude Code Playbook

You've learned the mental model, the prompting craft, the steering controls, the power features, and the workflows. The capstone isn't a quiz — it's you **assembling everything into a personal, living system** that makes you measurably faster and more reliable with Claude Code. By the end you'll have artifacts you actually use every day.

## 1. The goal

Turn knowledge into **infrastructure**. A master of Claude Code doesn't re-derive good practice each session — they've encoded it into:

```
CLAUDE.md      ← their project's always-on context & conventions
skills/        ← their repeated procedures, loaded on demand
commands/      ← their go-to prompts, one keystroke away
hooks          ← their non-negotiable "always/never" automations
a playbook     ← their personal cheat-sheet of patterns & workflows
```

The capstone is building these five for a real project.

## 2. Capstone deliverables

Complete these against a project you actually work on.

### Deliverable 1 — A real CLAUDE.md (Ch. 5)

Write or upgrade your project's `CLAUDE.md` so it contains, concisely:

- One-line purpose of the project.
- The commands: test, typecheck/build, lint, dev server.
- 3–7 conventions, with emphasis on the non-negotiable ones.
- An architecture map (what each dir/package owns).
- Any gotchas ("staging DB is read-only", "don't run migrations").

**Done when:** a fresh session can correctly recite your conventions when asked.

### Deliverable 2 — Three slash commands (Ch. 9)

Create `.claude/commands/` with at least:

- A `/review` (checklist review of the diff, no fixes).
- A workflow command you'll reuse (e.g. `/tdd`, `/pr`, `/explain`).
- One command that takes `$ARGUMENTS`.

**Done when:** you've used each at least once in a real session.

### Deliverable 3 — One skill (Ch. 11)

Identify a multi-step procedure you've explained to Claude more than once and package it as a skill with a sharp "use when…" description.

**Done when:** a matching task triggers it without you naming it explicitly.

### Deliverable 4 — One hook (Ch. 12)

Wire up at least one deterministic automation — most people start with auto-format on edit (`PostToolUse`) or run-tests-on-finish (`Stop`).

**Done when:** it fires automatically, every time, with no prompting.

### Deliverable 5 — Your personal playbook (Ch. 15)

A single Markdown file (`MY_CLAUDE_PLAYBOOK.md`) containing:

- Your 5–10 most-used prompt patterns (adapted from Ch. 15 Part A).
- The anti-pattern *you* personally fall into + your fix.
- Your default workflow for each of: new feature, bug, refactor, review.
- Your "control slider" defaults (when you use plan mode vs. accept-edits vs. bypass).

**Done when:** you'd be comfortable handing it to a teammate as "how I work with Claude Code."

## 3. Capstone challenge: ship a feature using the whole system

Tie it together. Pick a small but real feature and complete it using *every* layer:

```
1.  /clear to start clean.                                    (Ch. 6)
2.  Plan mode: explore + propose an approach; refine it.      (Ch. 4, 7)
3.  Approve; let it implement under accept-edits.             (Ch. 7)
4.  Your skill / commands fire where relevant.                (Ch. 9, 11)
5.  Hook auto-formats; you run /review on the diff.           (Ch. 12, 9)
6.  TDD or self-verify so tests/types are green.              (Ch. 14)
7.  Commit. Update PLAN.md / CLAUDE.md with anything learned. (Ch. 4, 5)
8.  /clear. Done.
```

Afterward, write a short retro: *Where did the system save me time? Where did I still have to course-correct, and what artifact would prevent that next time?* Feed the answer back into your CLAUDE.md / playbook. That feedback loop **is** mastery.

## 4. The mastery rubric

You've mastered Claude Code when you can honestly check these:

- [ ] You instinctively give context *before* asking, not after it goes wrong.
- [ ] You scope changes by default, including what *not* to touch.
- [ ] You reach for plan mode on anything risky without thinking about it.
- [ ] You `/clear` between tasks reflexively and keep contexts clean.
- [ ] You Esc and redirect early instead of nursing a bad session.
- [ ] Your "always/never" rules live in hooks, not hopes.
- [ ] You know whether a need belongs in CLAUDE.md, a command, a skill, or a hook.
- [ ] You match autonomy to stakes (sandbox vs. production) deliberately.
- [ ] You convert each derail into a durable artifact so it doesn't recur.
- [ ] You give Claude a way to verify, and you trust green over "looks right."

## 5. Keep growing

Claude Code evolves fast — new commands, modes, and capabilities arrive regularly. Your durable advantage isn't memorizing today's flags; it's the **operating system in your head**: context in, scope tight, plan first, verify always, steer early. Run `/help`, skim the docs (https://code.claude.com/docs) when something feels new, and keep folding lessons back into your CLAUDE.md, skills, commands, hooks, and playbook.

> You started this course thinking of Claude Code as a tool that writes code. You're finishing it as a director who runs an agent — and increasingly, a small team of agents. That shift, not any single feature, is the mastery.

## Final Action Item

1. Complete all five capstone deliverables for a real project.
2. Do the capstone challenge feature and write the one-paragraph retro.
3. Commit your `CLAUDE.md`, `.claude/commands/`, `.claude/skills/`, settings (hooks), and `MY_CLAUDE_PLAYBOOK.md`. Your future self and your teammates inherit it all.

Congratulations — you've finished the Claude Code Mastery course. Now go direct.
</content>
