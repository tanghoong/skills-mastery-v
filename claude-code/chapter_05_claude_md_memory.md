# Chapter 5: CLAUDE.md — Giving Claude Memory

In Chapter 1 we said Claude starts each session like a brilliant new hire with zero context. `CLAUDE.md` is the **onboarding document** you hand that new hire — automatically, every session, forever. It's the single highest-leverage configuration in all of Claude Code.

## 1. What CLAUDE.md is

`CLAUDE.md` is a plain-Markdown file that Claude Code **reads automatically at the start of every session**. Whatever you put in it becomes durable, always-on context. You're reading inside a repo that has one right now — the project instructions you've seen referenced throughout your TypeScript course are *its* `CLAUDE.md`.

It turns this:

> *(every session)* "Remember, we use the Result pattern, prefer interfaces, never use any, and the database package owns all Prisma calls…"

into this:

> *(once, in CLAUDE.md)* and then never again.

## 2. Where it lives (and the hierarchy)

Claude Code looks for `CLAUDE.md` in a few places and **merges** them:

| Location | Scope | Use for |
|----------|-------|---------|
| **Project root** `./CLAUDE.md` | This repo, shared with team (commit it) | Project conventions, architecture, commands |
| **Subdirectory** `./apps/web/CLAUDE.md` | That folder | Module-specific rules |
| **Personal** `~/.claude/CLAUDE.md` | All your projects (not committed) | Your personal preferences across every repo |

More specific files layer on top of more general ones. A rule in `apps/web/CLAUDE.md` applies when working in `apps/web`, in addition to the root file.

> Some teams also keep an untracked `CLAUDE.local.md` for personal, machine-specific notes they don't want to commit. Check your version's docs for the exact filenames it recognizes.

## 3. What to put in it

Good `CLAUDE.md` content is **stable, project-wide, and frequently needed**:

- **Commands:** how to run tests, lint, build, start the dev server.
- **Conventions:** "prefer `interface` for objects, `type` for unions"; "no `any`."
- **Architecture:** the directory map and what each package owns.
- **Patterns:** "business logic returns `Result<T,E>` instead of throwing."
- **Gotchas:** "the staging DB is read-only"; "don't run migrations automatically."
- **Definitions of done:** "every change must pass `npm run typecheck`."

Look at this repo's own `CLAUDE.md` for a real, well-structured example — it documents the layout, the conventions, the run commands, and the project's purpose. That's the template.

## 4. What NOT to put in it

`CLAUDE.md` is loaded *every session*, so it costs context-window space every time. Keep it lean:

- ❌ Don't paste entire files or long code — Claude can read those on demand.
- ❌ Don't include one-off task instructions — those go in the prompt.
- ❌ Don't write an essay. Terse, scannable bullets beat prose.
- ❌ Don't let it rot. An outdated rule actively misleads the agent.

> **Rule of thumb:** if you'd tell it to *every* new hire, it belongs in `CLAUDE.md`. If it's about *today's* task, it belongs in the prompt.

## 5. How to write it well

`CLAUDE.md` is itself a prompt — apply Chapter 3. Be specific and imperative:

```markdown
## Conventions
- Use `interface` for object shapes, `type` for unions/primitives.
- Never use `any`. Use `unknown` + narrowing if the type is genuinely unknown.
- Business logic returns `Result<T, E>` — do NOT throw in services.

## Commands
- Test:      npm run test
- Typecheck: npm run typecheck   ← must pass before any change is "done"
- Dev:       npm run dev

## Architecture
- packages/database — the ONLY place Prisma is imported.
- packages/trpc     — shared router; web + mobile both consume it.
```

Notice the emphasis markers (`NEVER`, `ONLY`, `← must pass`). Claude weights clear, strong instructions — vague suggestions get vaguer compliance.

## 6. Living with it

- **Grow it from pain.** Every time you find yourself repeating an instruction, add it to `CLAUDE.md`. The file should accrete the lessons of your sessions.
- **Prune it when it's wrong.** A stale rule is worse than no rule.
- **Commit it.** Your whole team (and future you) inherits the same context. This is one of Claude Code's quiet superpowers: shared, version-controlled agent memory.
- **Some versions** let you append to it quickly from inside a session (e.g. a `#`-prefixed memory shortcut). Run `/help` to see what yours offers.

## 7. Frequently Asked Questions

**Q: Does Claude always obey CLAUDE.md?**
It treats it as high-priority instruction, but it's guidance, not a hard lock. Clear, specific, well-emphasized rules are followed reliably; vague ones less so. If something is being ignored, make it sharper and shorter, and put the most important rules near the top.

**Q: Won't a big CLAUDE.md eat my context window?**
Yes — that's exactly why you keep it lean. The trade is worth it for *frequently needed* info, because re-typing it every session would cost more. Push rarely-needed detail into separate docs Claude reads on demand.

**Q: We're a team. Personal vs project?**
Project conventions → committed `./CLAUDE.md` (shared). Your personal habits → `~/.claude/CLAUDE.md` (yours, all repos). Don't put personal preferences in the shared file.

## Action Item for Chapter 5

1. Open this repo's `CLAUDE.md` and read it as a *model* — note how it covers purpose, layout, commands, and conventions concisely.
2. For your own project, draft a `CLAUDE.md` with at least: a one-line purpose, the test/build commands, and three conventions.
3. Start a fresh Claude Code session and ask: *"Based on my project instructions, what conventions should you follow here?"* If it can't recite your rules, they're not clear enough — tighten them.
</content>
