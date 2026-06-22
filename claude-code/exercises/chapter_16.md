# Chapter 16 Drill — Capstone

Build the system, then use all of it on one real feature.

## The five artifacts (build for a real project)
1. **CLAUDE.md** — purpose, commands, 3–7 emphasized conventions, architecture map, gotchas.
2. **Three slash commands** — including a `/review` and one that takes `$ARGUMENTS`.
3. **One skill** — a repeated procedure with a sharp "use when…" trigger.
4. **One hook** — auto-format on edit, or run-tests-on-finish.
5. **MY_CLAUDE_PLAYBOOK.md** — your top patterns, your personal anti-pattern + fix, your default workflows, your control-slider defaults.

## The capstone feature
Ship one small real feature using the full stack: `/clear` → plan mode → approve → implement (commands/skill fire) → hook formats → `/review` → TDD/verify green → commit → update CLAUDE.md/PLAN.md → `/clear`.

## Reflection / Retro
- Where did the *system* save you time vs. ad-hoc prompting?
- Where did you still course-correct? What artifact would prevent that next time? (Add it.)
- Score yourself against the mastery rubric (Ch. 16 §4). Which boxes aren't checked yet, and what's your plan for each?

## Final step
Commit `CLAUDE.md`, `.claude/commands/`, `.claude/skills/`, your settings (hooks), and `MY_CLAUDE_PLAYBOOK.md`. The system is now durable and shareable.
</content>
