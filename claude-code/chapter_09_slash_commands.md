# Chapter 9: Slash Commands — Built-in and Your Own

Slash commands are the keyboard shortcuts of Claude Code. You've already met a few (`/help`, `/clear`, `/compact`). This chapter rounds out the built-ins and then teaches the real power move: **writing your own** to turn a repeated, fiddly prompt into a one-word command.

## 1. Built-in slash commands

Typed with a leading `/`, these control the session itself rather than asking Claude to do coding work. The exact set depends on your version — **always run `/help` to see yours** — but you'll commonly find:

| Command | What it does |
|---------|--------------|
| `/help` | Lists all available commands for your version |
| `/clear` | Resets the conversation context (Ch. 6) |
| `/compact` | Summarizes and compresses the context (Ch. 6) |
| `/config` | Opens settings (model, theme, etc.) |
| `/exit` | Ends the session |

There are typically many more (for reviewing changes, managing context, configuration, and so on). The habit to build: **when you wonder "can Claude Code just do X?", check `/help` first.** Many one-off needs already have a command.

## 2. Custom slash commands — the big idea

A **custom slash command** is a reusable prompt you save once and invoke by name. Anytime you catch yourself typing the same multi-line instruction repeatedly, that's a candidate.

Examples worth saving as commands:

- `/review` → "Review the current diff for bugs, type-safety, and convention violations. Don't fix yet — list findings."
- `/test` → "Run the test suite. If anything fails, diagnose and fix it, then re-run until green."
- `/pr` → "Summarize the changes on this branch into a clear PR description with a testing section."

Instead of re-typing the paragraph, you type `/review`.

## 3. How custom commands work

Custom commands are just **Markdown files** in a commands directory:

| Location | Scope |
|----------|-------|
| `.claude/commands/` in your repo | Shared with the team (commit it) |
| `~/.claude/commands/` | Personal, available in every project |

The **filename becomes the command name**: `.claude/commands/review.md` → `/review`. The file's contents are the prompt that gets sent when you invoke it.

A minimal `review.md`:

```markdown
Review the current git diff. Check for:
- Correctness bugs and edge cases
- Type safety (no `any`; strict mode holds)
- Violations of conventions in CLAUDE.md

List findings as a checklist. Do not fix anything yet — wait for my go-ahead.
```

That's it. Now `/review` runs that prompt in any session.

## 4. Arguments make commands flexible

Commands become far more useful when they accept input. Claude Code supports placeholders (commonly `$ARGUMENTS`, and often positional `$1`, `$2`) that get substituted with whatever you type after the command.

`.claude/commands/fix-issue.md`:

```markdown
Investigate and fix issue #$ARGUMENTS.
1. Read the issue and reproduce it.
2. Find the root cause — explain it before fixing.
3. Fix it, add a regression test, and run the suite.
```

Invoked as `/fix-issue 412`, it slots `412` into the prompt. One template, infinite uses.

> Some versions also let command files run shell snippets or reference files to pull context in automatically. Check the docs for the advanced syntax your version supports — but even the plain "saved prompt" form is hugely valuable on its own.

## 5. When to make a command vs. a skill vs. CLAUDE.md

A quick map (you'll meet skills next chapter):

| Tool | Best for | Trigger |
|------|----------|---------|
| `CLAUDE.md` | Always-on rules & context | Automatic, every session (Ch. 5) |
| **Slash command** | A specific repeated *action/prompt* you invoke | You type `/name` |
| **Skill** | Reusable *expertise/procedure* Claude pulls in when relevant | Claude loads it on demand (Ch. 11) |

Rule of thumb: if it's a prompt *you* deliberately fire off, it's a command. If it's know-how Claude should reach for automatically when a task matches, it's a skill.

## 6. Building your command library

Treat your `commands/` directory like a growing toolbox:

- Start with the 2–3 prompts you already retype most.
- Commit project commands so the whole team shares the same `/review`, `/test`, `/pr`.
- Keep personal/cross-project ones in `~/.claude/commands/`.
- Refine them over time — a command is just a prompt, so Chapter 3 still applies to writing them well.

## 7. Frequently Asked Questions

**Q: How is a custom command different from just retyping the prompt?**
Functionally the result is the same — a command is a *saved* prompt. The value is consistency and speed: the team's `/review` always checks the same things, and you stop re-deriving the wording every time.

**Q: Do commands run automatically?**
No — *you* invoke them by typing `/name`. Things that should happen automatically belong in `CLAUDE.md` (context) or hooks (actions around events, Ch. 12), not slash commands.

**Q: Where do I see what commands exist?**
`/help` lists built-ins and your custom commands. If a custom one doesn't show up, check the filename and that it's in `.claude/commands/` (project) or `~/.claude/commands/` (personal).

## Action Item for Chapter 9

1. Run `/help` and note two built-in commands you hadn't used.
2. Create `.claude/commands/review.md` with the review prompt from §3. Make a tiny code change and run `/review`. You just built your first tool.
3. Create one command that takes `$ARGUMENTS` (e.g. a `/explain` that explains whatever file or topic you pass it) and use it.
</content>
