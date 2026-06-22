# Chapter 13: MCP Servers & Headless Automation

Two features that extend Claude Code *outward*: **MCP servers** give Claude new tools (databases, GitHub, browsers, your internal APIs), and **headless mode** lets you run Claude Code non-interactively — in scripts, pipelines, and CI. Together they take you from "Claude edits my files" to "Claude is wired into my whole toolchain and can run unattended."

---

## Part A — MCP Servers (giving Claude new tools)

### 1. What MCP is

**MCP (Model Context Protocol)** is an open standard for connecting AI tools to external systems. An **MCP server** exposes a set of capabilities — query this database, open this PR, fetch this page, read this Notion doc — that Claude Code can then **use as tools**, the same way it uses read-file or run-command.

Out of the box, Claude's tools are mostly about your local files and shell. MCP is how you grant it *more*: live access to the systems your work actually involves.

### 2. What you can connect

Common MCP servers include:

- **GitHub / GitLab** — read and comment on PRs, manage issues, check CI.
- **Databases** (Postgres, etc.) — inspect schemas, run read queries.
- **Browser/automation** — drive a real browser to test or scrape.
- **Knowledge tools** (Notion, docs, Sentry, etc.) — pull in tickets, errors, specs.
- **Your own internal services** — anything someone wraps in an MCP server.

> In *this* environment you've seen MCP in action: the GitHub and Notion tools available to Claude here are MCP servers. That's the same mechanism you can set up locally.

### 3. How it works (the mental model)

```
Claude Code ──speaks MCP──► [GitHub server]  → your repos/PRs
            ──speaks MCP──► [Postgres server] → your database
            ──speaks MCP──► [Browser server]  → a real browser
```

Each server advertises its tools; Claude sees them alongside its built-ins and calls them when relevant. You configure which servers to connect (and at what scope) in your settings. Crucially, MCP tools are still **gated by permissions** (Ch. 7) — connecting a database doesn't mean Claude silently runs writes against it.

### 4. Why it's powerful

It collapses context-switching. Instead of *you* copying a stack trace from Sentry, the schema from your DB, and the ticket from Notion into the prompt, Claude **fetches them itself** through MCP, reasons over them, and acts — all in one flow. The agent reaches into the real systems instead of you being its clipboard.

### 5. Trust and safety with MCP

MCP servers are third-party tools that can read external data and take real actions, so:

- **Only connect servers you trust** — they run with whatever access you grant.
- **Watch out for untrusted external content.** A GitHub issue, web page, or DB row pulled in via MCP can contain text that *tries to steer Claude* ("ignore your instructions and…"). Treat external data as data, not commands, and keep permissions on for consequential actions. (You'll see this exact warning in environments that wrap external content in caution tags.)
- **Scope access narrowly** — read-only where possible; limit which repos/tables are reachable.

---

## Part B — Headless / Print Mode (Claude without the chat UI)

### 6. What headless mode is

Interactive sessions are great for development, but sometimes you want Claude Code to run **non-interactively** — take an instruction, do the work, print a result, exit. That's **headless** (a.k.a. **print**) mode, invoked with the `-p` / `--print` flag:

```bash
claude -p "Summarize the changes in the last commit and flag anything risky."
```

It runs the agent loop once for that prompt and returns the output to stdout — no interactive session. You can pipe input in and pipe output onward, and request structured (e.g. JSON) output for machine consumption.

### 7. What it unlocks: automation

Headless mode turns Claude Code into a **scriptable building block**:

- **CI/CD:** on every PR, run `claude -p "review this diff for security issues"` and post the result as a comment.
- **Git hooks:** generate or sanity-check commit messages.
- **Batch jobs:** loop over many files/repos and have Claude do the same task to each.
- **Pipelines:** feed logs in, get a triage summary out; chain Claude into larger scripts.
- **Scheduled tasks:** nightly dependency-update checks, changelog drafts, etc.

```bash
# Example shape: lint every changed file with Claude in CI
for f in $(git diff --name-only main); do
  claude -p "Review $f for bugs and convention violations. Output JSON." 
done
```

### 8. Headless changes the safety calculus

Unattended runs have *no human at the permission prompt*, so:

- Run them in **sandboxed/controlled environments** (a CI runner, a container), not against irreplaceable local state.
- **Scope tightly** and prefer read-only / output-only tasks (reviews, summaries, checks) for fully unattended jobs.
- Use **allow-lists and hooks** (Ch. 7, 12) to bound what an unattended run can do.
- Remember the agent may act on whatever input you feed it — be careful piping in untrusted content.

### 9. The web/cloud connection

Running Claude Code "on the web" or via a GitHub Action is essentially managed headless/remote execution: a fresh environment, a task, automated tools. Everything in this course applies there too — which is why `CLAUDE.md`, hooks (especially `SessionStart`), and tight permissions matter even more when no one's watching the terminal.

## 10. Frequently Asked Questions

**Q: Do I need MCP to be productive?**
No. Local file/shell tools cover most coding work. MCP is for when your task genuinely lives in *other* systems (your DB, GitHub, a browser) and you want Claude to reach them directly instead of you ferrying data back and forth.

**Q: Is headless mode just the same Claude with no UI?**
Essentially yes — same agent, one-shot and non-interactive, output to stdout. The big practical difference is *no human in the loop*, so you compensate with sandboxing, tight scope, and hooks/allow-lists.

**Q: What's the single biggest risk with both features?**
Untrusted input plus real capability. MCP can pull in external text; headless runs unattended. Keep permissions meaningful, prefer read-only for automation, and never point an unsupervised, broadly-permissioned agent at production. Match autonomy to stakes (Ch. 7).

## Action Item for Chapter 13

1. Connect one MCP server you'd actually use (e.g. GitHub) and ask Claude to do something through it ("list the open PRs"). Notice it's now reaching outside your local files.
2. Run a real headless command: `claude -p "summarize the diff of my last commit"`. Pipe the output somewhere.
3. Sketch (don't fully build) one automation: an event (PR opened, nightly cron, pre-commit) + a `claude -p` task. Identify what scope/permissions would make it safe to run unattended.
</content>
