# Chapter 9 Drill — Build Your First Custom Command

## Steps
1. Run `/help`; note two built-in commands you hadn't used.
2. Create `.claude/commands/review.md` with a checklist-review prompt (see Ch. 9 §3). Make a tiny code change and run `/review`.
3. Create one command that uses `$ARGUMENTS` — e.g. `.claude/commands/explain.md` ("Explain `$ARGUMENTS` in this codebase, with the key files involved"). Invoke it with an argument.

## Reflection
- What multi-line prompt do you retype most? Is it a command, a skill, or a `CLAUDE.md` rule? (Use the table in Ch. 9 §5.)
- Did your custom command show up in `/help`? If not, check the filename and location.
- Which of your new commands would benefit the whole team if committed to `.claude/commands/`?
</content>
