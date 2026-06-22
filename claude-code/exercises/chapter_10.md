# Chapter 10 Drill — Parallel & Isolated Investigation

Use a real, reasonably sized repo.

## Steps
1. **Isolation:** Ask a broad search question ("where do we handle file uploads / read env vars / call the old API?"). Notice the main context isn't flooded with every file read.
2. **Parallelism:** In one request, give Claude **two independent** investigations and have it report back on both.
3. **Boundary check:** Try delegating a task that depends heavily on your current in-session context, and observe where a fresh-context subagent struggles.

## Reflection
- What came back from the search — the *conclusion* or the full file dump? Why does that keep your main context clean?
- Which of your recurring jobs ("audit for X") would make a good *custom* subagent?
- When is sequential (single context) genuinely better than fanning out?
</content>
