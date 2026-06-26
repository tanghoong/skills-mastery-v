# Chapter 1: What Claude Code Is & How It Thinks

Welcome to your Claude Code mastery journey. Before a single prompt, you need the right **mental model**. Most people who struggle with Claude Code struggle because they treat it like the wrong kind of tool. This chapter fixes that.

## 1. It's an agent, not autocomplete

There are three broad ways to use an LLM for coding:

| Tool type | Example | What it does |
|-----------|---------|--------------|
| **Autocomplete** | Tab completion in your editor | Predicts the next few tokens as you type |
| **Chatbot** | A web chat window | You paste code, it replies with code, you copy it back |
| **Agent** | **Claude Code** | Reads your files, runs commands, edits code, runs tests, and verifies — on its own |

Claude Code is the third kind. When you ask it to "add input validation to the signup form," it will actually:

1. **Search** your repo to find the signup form.
2. **Read** the relevant files to understand current patterns.
3. **Plan** what to change.
4. **Edit** the files.
5. **Run** the tests or type-checker to confirm it didn't break anything.

You didn't paste any code. You didn't tell it which file. That autonomy is the whole point — and it's also why *how you prompt* matters so much. You're directing a capable junior engineer, not filling in a search box.

## 2. The agent loop

Internally, every Claude Code task runs a loop:

```
think  →  use a tool  →  observe result  →  think  →  use a tool  →  ...  →  answer
```

The "tools" are things like *read file*, *search code*, *edit file*, *run shell command*. Claude decides which tool to use, looks at the output, and decides what to do next. This is why it can recover from mistakes (a failing test tells it to try again) — and why a misleading instruction from you can send the whole loop down the wrong path.

**Implication for you:** the earlier you correct course, the cheaper it is. A wrong assumption caught at the "plan" step costs nothing; caught after 12 file edits, it costs a cleanup.

## 3. What Claude can see (and what it can't)

Claude Code starts each session knowing **almost nothing** except:

- Your `CLAUDE.md` file(s), if present (Chapter 5).
- The directory it was launched in.
- Whatever it discovers by reading and searching during the session.

It does **not** automatically know:

- Your unstated conventions ("we always use `Result<T,E>`, never throw").
- What you tried yesterday in a different session.
- Code that lives outside the working directory unless told.
- Your intent beyond the words you typed.

> **Mental model:** Claude is a brilliant new hire on day one. Extremely capable, zero context. Everything useful it knows about *your* project, it either reads from disk or hears from you.

## 4. The context window: Claude's working memory

Everything Claude is "aware of" right now lives in its **context window** — a finite budget of tokens holding your messages, its replies, and the file/command output it has read. Think of it as short-term memory.

Two consequences you'll feel constantly:

- **It fills up.** Long sessions, big files, and noisy command output crowd it. When full, older details get summarized or pushed out — Claude can "forget" things from early in the session.
- **It's per-session.** Close the session (or `/clear`) and that memory is gone. Persistent knowledge has to live on disk (`CLAUDE.md`, the code itself, commits).

We dedicate all of Chapter 6 to managing this. For now, just hold the model: *finite, short-term, per-session memory.*

## 5. Why this changes how you prompt

Because Claude is an autonomous agent with finite memory and no built-in knowledge of your intent, the highest-leverage things you can do are:

1. **Front-load context** — tell it (or let it read) what it needs *before* it acts.
2. **Scope tightly** — one clear objective beats a vague mega-request.
3. **Let it plan** — review the approach before it writes 200 lines.
4. **Verify** — give it a way to check its own work (tests, types, lint).
5. **Steer early** — correct at the first sign of drift.

The rest of this course is those five ideas, expanded.

## 6. Frequently Asked Questions

**Q: Is this just a smarter ChatGPT?**
No. The defining difference is *agency*: Claude Code takes actions in your real environment (reads, edits, runs). A chatbot only produces text for you to act on. This makes Claude Code far more powerful and also means sloppy instructions have real consequences (it can edit the wrong file). Hence: steering skills.

**Q: Will it edit my files without asking?**
That depends on the **permission mode** (Chapter 7). By default Claude asks before taking consequential actions. You can loosen or tighten this. You're always in control.

**Q: Does it remember me between sessions?**
Not on its own. Persistent context comes from files you keep in the repo — chiefly `CLAUDE.md`. That's a feature: your project's "memory" is version-controlled and shared with your team.

## Action Item for Chapter 1

You don't need Claude Code installed yet (that's Chapter 2). Instead, **write down**, in 2–3 sentences each:

1. A task you'd want Claude Code to do in your current project.
2. What an oblivious-but-brilliant new hire would need to *know* to do that task well.

Keep this note. In Chapter 3 you'll turn answer #2 into an excellent prompt.
</content>
