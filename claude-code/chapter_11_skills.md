# Chapter 11: Skills — Packaging Expertise Claude Loads on Demand

Slash commands (Ch. 9) are prompts *you* fire. **Skills** are reusable packages of expertise that **Claude reaches for automatically** when a task matches. They're how you teach Claude Code a procedure, a domain, or a house style *once* and have it apply that knowledge whenever it's relevant — without you remembering to ask.

## 1. What a Skill is

A Skill is a folder containing instructions (and optionally scripts and reference files) that describes **how to do a particular kind of task**. Each skill has a name and, crucially, a **description of when it should be used**. Claude reads those descriptions and, when your request matches one, pulls the full skill into context and follows it.

Think of skills as **onboarding playbooks for specific jobs**:

- "How we write database migrations in this repo."
- "How to generate our company's standard PDF report."
- "Our process for reviewing security-sensitive changes."
- "How to scaffold a new tRPC router the way we like it."

You've actually been *using* skills throughout your sessions in this repo — things like a code-review skill or a research skill are exactly this mechanism.

## 2. Skill vs. slash command vs. CLAUDE.md

This trio confuses everyone at first. The distinction is **trigger** and **size**:

| Tool | What it holds | How it triggers |
|------|---------------|-----------------|
| `CLAUDE.md` | Small, always-relevant rules | Loaded **every** session, automatically |
| **Skill** | A whole procedure / body of know-how | Loaded **when a task matches** its description |
| Slash command | A specific prompt | **You** type `/name` |

The key advantage of a skill over stuffing everything into `CLAUDE.md`: skills are loaded **only when relevant**, so they don't burn context on every session. You can have *dozens* of skills; only the matching one(s) get pulled in. This is called **progressive disclosure** — Claude sees a lightweight list of skill names/descriptions always, but only loads the full content on demand.

> **Rule of thumb:** always-needed rules → `CLAUDE.md`. Occasionally-needed deep procedures → a Skill. A prompt you manually invoke → a slash command.

## 3. Anatomy of a Skill

At minimum a skill is a folder with a primary instruction file (Markdown) that has:

- **A name** — what the skill is.
- **A description** — *when to use it*. This is the most important part; it's how Claude decides to invoke the skill. Write it like a trigger: "Use when the user wants to … / when working on …".
- **The instructions** — the actual procedure, conventions, gotchas, and steps.

Optionally it can bundle:

- **Scripts** Claude can run as part of the procedure.
- **Reference files / templates** it can read or copy from.

```
.claude/skills/
  db-migration/
    SKILL.md          ← name + "when to use" + the migration procedure
    template.sql      ← optional supporting file
```

(Exact folder/file naming and metadata format evolve — check the docs for the current spec. The *concept* — a described, on-demand, self-contained capability — is stable.)

## 4. Writing a good Skill

The make-or-break is the **description / trigger**. If it's vague, Claude won't know when to use the skill; if it's sharp, the skill fires exactly when it should.

- ❌ Description: "Database stuff." (Too vague — won't trigger reliably.)
- ✅ Description: "Use when creating or modifying a Prisma migration, or when the user asks to change the database schema."

The body, then, is just an excellent set of instructions — Chapter 3's principles applied to a procedure. Be concrete, include the steps, name the files, state the constraints, show a template.

## 5. Where skills come from

- **Built-in skills** ship with Claude Code (review, research, and others).
- **Your own skills** live in your project (`.claude/skills/`, shared with the team) or personally (`~/.claude/skills/`).
- **Shared/community skills** can be dropped into a project so everyone benefits.

Because project skills are committed, they're another form of **shared team capability**: write the "how we do X here" skill once, and every teammate's Claude follows the same playbook.

## 6. Skills + subagents + commands = your toolkit

Now you can see the layered system:

```
CLAUDE.md      → who we are, always (context)
Skills         → how we do specific jobs, on demand (expertise)
Slash commands → buttons you press (invocable prompts)
Subagents      → extra workers to parallelize/isolate (capacity)
```

Mastery is knowing which layer a given need belongs to. A recurring, well-defined procedure that Claude should apply automatically → **skill**. The same procedure but you want to trigger it explicitly → wrap it in a **command** too.

## 7. Frequently Asked Questions

**Q: Skill vs. CLAUDE.md — why not put everything in CLAUDE.md?**
Because `CLAUDE.md` loads *every session* and competes for context. A detailed 200-line procedure you need 5% of the time would waste context 95% of the time. As a skill, it's invisible until a matching task pulls it in. Reserve `CLAUDE.md` for the always-relevant essentials.

**Q: Do I have to invoke a skill manually?**
Usually no — that's the point. Claude matches your task to the skill's description and loads it on its own. (Some setups also let you invoke one explicitly.) A well-written "when to use" description is what makes automatic triggering reliable.

**Q: When should I build my first skill?**
When you notice you keep explaining the *same multi-step procedure* to Claude across sessions, and it's too big or too situational for `CLAUDE.md`. That recurring "let me explain how we do X again" is the signal.

## Action Item for Chapter 11

1. List the skills currently available in your environment (your tooling shows them; or ask Claude what skills it has). Read one built-in skill's description to see how the "when to use" trigger is phrased.
2. Identify one procedure in your project you've explained to Claude more than once.
3. Draft a `SKILL.md` for it: a sharp "use when…" description plus the step-by-step instructions. Try a task that should trigger it and see if Claude picks it up.
</content>
