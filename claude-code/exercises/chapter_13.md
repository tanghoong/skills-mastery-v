# Chapter 13 Drill — MCP & Headless

## Steps
1. **MCP:** Connect one MCP server you'd actually use (e.g. GitHub). Ask Claude to do something through it ("list the open PRs"). Notice it's reaching beyond local files.
2. **Headless:** Run `claude -p "summarize the diff of my last commit"`. Pipe the output somewhere (a file, another command).
3. **Design an automation:** Sketch (don't fully build) one automation = an event (PR opened / nightly cron / pre-commit) + a `claude -p` task.

## Reflection
- For the MCP task, what would you otherwise have had to copy-paste into the prompt yourself?
- For your sketched automation, what scope and permissions would make it safe to run **unattended**? (Ch. 13 §8.)
- Where could untrusted external content sneak into either feature, and how would you guard against it?
</content>
