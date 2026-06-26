# Chapter 12 Drill — Your First Hook

## Steps
1. Pick one "always/never" rule you care about (e.g. "always format `.ts` after editing").
2. Add a `PostToolUse` hook to your project settings that runs your formatter on edited files. Make an edit and watch it auto-format — with no prompting.
3. (Stretch) Add a `Stop` hook that runs your test command, so you always learn test status when Claude finishes.

(Check the docs for your version's exact settings format.)

## Reflection
- Why couldn't a `CLAUDE.md` line *guarantee* the behavior your hook now enforces?
- What's the difference you felt between "Claude usually does X" and "X happens every time"?
- What destructive action would you want a `PreToolUse` hook to *block*, and why is that safer than a written rule?
</content>
