# Claude Code Mastery — Complete Overview

A hands-on course that takes you from *"I just installed it"* to *"I can drive Claude Code like a senior pair-programmer and automate my whole workflow."*

The throughline of this course is one idea:

> **Claude Code is not a chatbot that writes code. It is an autonomous agent that reads, plans, edits, runs, and verifies — and your job is to *steer* it.** Mastery is mostly about giving it the right context, the right scope, and the right feedback at the right time.

---

## Who this is for

You're comfortable in a terminal and you write (or want to write) real code, but you're **new to Claude Code** specifically. You may have used ChatGPT-style copy-paste coding before — this course will retrain those habits, because driving an agent is a different skill.

By the end you will be able to:

- Write prompts that get the right result on the first or second try.
- Give Claude persistent project context with `CLAUDE.md`.
- Use plan mode, permission modes, and context management deliberately.
- Build custom slash commands, skills, hooks, and connect MCP servers.
- Run multi-agent and headless/automated workflows.
- Diagnose *why* a session went sideways and recover fast.

---

## Full Curriculum (16 Chapters)

### Phase 1 — Foundations (Ch. 1–4)

| Ch | File | What you'll learn |
|----|------|-------------------|
| 1 | [chapter_01_what_is_claude_code.md](chapter_01_what_is_claude_code.md) | The agent mental model — read/plan/edit/run loop, why it's not autocomplete |
| 2 | [chapter_02_setup_first_session.md](chapter_02_setup_first_session.md) | Install, auth, your first session, the essential keys & commands |
| 3 | [chapter_03_anatomy_of_a_prompt.md](chapter_03_anatomy_of_a_prompt.md) | The 5 ingredients of a great prompt: goal, context, scope, examples, constraints |
| 4 | [chapter_04_core_loop.md](chapter_04_core_loop.md) | The Explore → Plan → Code → Commit workflow that prevents 80% of bad outputs |

### Phase 2 — Steering Claude (Ch. 5–8)

| Ch | File | What you'll learn |
|----|------|-------------------|
| 5 | [chapter_05_claude_md_memory.md](chapter_05_claude_md_memory.md) | `CLAUDE.md` — giving Claude durable project memory & conventions |
| 6 | [chapter_06_context_management.md](chapter_06_context_management.md) | The context window, `/clear`, `/compact`, and when to start fresh |
| 7 | [chapter_07_plan_and_permission_modes.md](chapter_07_plan_and_permission_modes.md) | Plan mode, permission modes, and controlling what Claude can do |
| 8 | [chapter_08_course_correcting.md](chapter_08_course_correcting.md) | Interrupting, redirecting, undoing, and rescuing a derailed session |

### Phase 3 — Power Features (Ch. 9–13)

| Ch | File | What you'll learn |
|----|------|-------------------|
| 9  | [chapter_09_slash_commands.md](chapter_09_slash_commands.md) | Built-in slash commands + writing your own reusable prompt commands |
| 10 | [chapter_10_subagents.md](chapter_10_subagents.md) | Subagents & the Agent tool — parallel work and context isolation |
| 11 | [chapter_11_skills.md](chapter_11_skills.md) | Custom Skills — packaging expertise Claude loads on demand |
| 12 | [chapter_12_hooks.md](chapter_12_hooks.md) | Hooks — deterministic automation around Claude's actions |
| 13 | [chapter_13_mcp_and_headless.md](chapter_13_mcp_and_headless.md) | MCP servers (extra tools) + headless/print mode for scripting & CI |

### Phase 4 — Workflows & Mastery (Ch. 14–16)

| Ch | File | What you'll learn |
|----|------|-------------------|
| 14 | [chapter_14_real_workflows.md](chapter_14_real_workflows.md) | TDD, debugging, large-codebase navigation, refactoring, code review |
| 15 | [chapter_15_prompt_patterns_antipatterns.md](chapter_15_prompt_patterns_antipatterns.md) | A reusable prompt-pattern library + the anti-patterns that waste your time |
| 16 | [chapter_16_capstone_playbook.md](chapter_16_capstone_playbook.md) | Capstone: assemble your own personal Claude Code playbook |

---

## How to take this course

1. **Read the chapter** (`claude-code/chapter_NN_*.md`).
2. **Do the exercise** in `claude-code/exercises/chapter_NN.md` — most are *prompting drills*, not code. You run them **inside a real Claude Code session** and observe what happens.
3. **Reflect** using the review prompts at the bottom of each exercise.
4. **Update the progress tracker** in [exercises/README.md](exercises/README.md).

This course is unusual: the "exercises" are conversations with Claude Code itself. The best way to learn to prompt an agent is to prompt it, watch it, and adjust. Treat every drill as a small experiment.

---

## The One-Page Mental Model (read this first)

```
┌─────────────────────────────────────────────────────────────┐
│  YOU (the director)                                          │
│    │                                                         │
│    │  goal + context + scope + constraints                   │
│    ▼                                                         │
│  CLAUDE CODE (the agent)                                     │
│    │                                                         │
│    ├─ EXPLORE  reads files, searches, builds understanding   │
│    ├─ PLAN     proposes an approach (review it!)             │
│    ├─ ACT      edits files, runs commands, tests             │
│    └─ VERIFY   runs tests/linters, checks its own work       │
│    │                                                         │
│    ▼                                                         │
│  RESULT  →  you review  →  course-correct  →  loop           │
└─────────────────────────────────────────────────────────────┘
```

Everything in this course is about making each arrow in that diagram better:
better context in, better steering during, better verification out.

---

## Quick-Reference Cheat Sheet

*(You'll understand all of these by the end. Bookmark this page.)*

| Want to… | Do this |
|----------|---------|
| Give Claude project rules | Add a `CLAUDE.md` (Ch. 5) |
| Make Claude plan before coding | Use **plan mode** / `EnterPlanMode` (Ch. 7) |
| Start a clean context | `/clear` (Ch. 6) |
| Shrink a long context | `/compact` (Ch. 6) |
| Save a reusable prompt | Custom **slash command** in `.claude/commands/` (Ch. 9) |
| Run independent work in parallel | **Subagents** (Ch. 10) |
| Package reusable expertise | **Skills** (Ch. 11) |
| Auto-run a linter after edits | **Hooks** (Ch. 12) |
| Add external tools (DB, GitHub) | **MCP servers** (Ch. 13) |
| Script Claude in CI | **Headless / print mode** `claude -p` (Ch. 13) |
| Undo Claude's last change | Stop + revert (Ch. 8) |

> Note: exact key bindings and command names can vary by Claude Code version and platform. When in doubt, run `/help` inside a session and check the official docs at https://code.claude.com/docs. This course teaches the *concepts and habits*, which stay stable even as the UI evolves.
</content>
</invoke>
