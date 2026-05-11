# Chapter 23 — Performance

## Learning Objectives

By the end of this chapter you will be able to:
- Identify N+1 query problems and fix them with Prisma `include`
- Profile slow endpoints with `clinic.js` or `0x`
- Configure connection pool size correctly
- Use `Promise.all` for parallelising independent async operations
- Add response compression

---

## 23.1 N+1 Queries — The Most Common Performance Bug

```typescript
// N+1 — fetches 1 task list query + 1 user query per task
const tasks = await prisma.task.findMany({ where: { projectId } });
for (const task of tasks) {
  const assignee = await prisma.user.findUnique({ where: { id: task.assigneeId! } }); // N queries
  // use assignee...
}

// FIX — one query with include
const tasks = await prisma.task.findMany({
  where:   { projectId },
  include: { assignee: { select: { id: true, name: true, email: true } } },
});
// tasks[n].assignee is always loaded — no extra queries
```

To detect N+1 in development, enable Prisma query logging:

```typescript
const prisma = new PrismaClient({
  log: ["query"], // logs every SQL statement to console
});
```

Watch for repeated `SELECT` queries that differ only by `WHERE id = X`.

---

## 23.2 Parallelise Independent Async Operations

```typescript
// SEQUENTIAL — 300ms (each query waits for the previous)
const tasks    = await taskRepository.count(where);
const projects = await projectRepository.count({ orgId });
const members  = await orgRepository.countMembers(orgId);

// PARALLEL — ~100ms (all three fire simultaneously)
const [taskCount, projectCount, memberCount] = await Promise.all([
  taskRepository.count(where),
  projectRepository.count({ orgId }),
  orgRepository.countMembers(orgId),
]);
```

Any time you have two or more `await` calls where the second doesn't depend on the first, use `Promise.all`.

---

## 23.3 Response Compression

```bash
npm install compression
npm install -D @types/compression
```

```typescript
import compression from "compression";

app.use(compression({
  threshold: 1024, // only compress responses > 1 KB
  filter: (req, res) => {
    // Don't compress if the client said not to
    if (req.headers["x-no-compression"]) return false;
    return compression.filter(req, res);
  },
}));
```

Typical JSON API responses compress 70–80% — a 50 KB response becomes 10–15 KB. Add compression before route handlers.

---

## 23.4 Connection Pool Sizing

Prisma uses a connection pool. The default is `min=2, max=10`. Tune based on your database plan:

```typescript
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `${config.db.url}?connection_limit=20&pool_timeout=30`,
    },
  },
});
```

Rule of thumb: `max_connections = (number_of_cpu_cores * 2) + effective_spindle_count`. For Railway Postgres Starter, stay under 20 total connections across all app instances.

For Redis, `ioredis` maintains one persistent connection per client instance — one `redis` singleton is correct.

---

## 23.5 Pagination — Never Return Unbounded Results

```typescript
// WRONG — returns all tasks in a project (could be 10,000)
const tasks = await prisma.task.findMany({ where: { projectId } });

// CORRECT — always paginate
const tasks = await prisma.task.findMany({
  where: { projectId },
  take:  query.limit,  // max 100
  skip:  (query.page - 1) * query.limit,
});
```

The Zod schema enforces `limit` between 1 and 100. This is a hard cap — even if the client requests 10,000.

---

## 23.6 Select Only Required Fields

```typescript
// Fetches all columns — includes passwordHash which you definitely don't want to serialize
const user = await prisma.user.findUnique({ where: { id } });

// Select only what you need
const user = await prisma.user.findUnique({
  where:  { id },
  select: { id: true, name: true, email: true, avatarUrl: true },
  // passwordHash is NOT selected — cannot accidentally leak it
});
```

`select` also reduces the amount of data transferred from the database.

---

## 23.7 Index Design

Add indexes for columns you filter or sort by frequently:

```prisma
model Task {
  // ...
  projectId Int
  status    TaskStatus
  assigneeId Int?
  createdAt DateTime @default(now())

  @@index([projectId, status])           // list tasks by project + status
  @@index([assigneeId])                  // find tasks assigned to a user
  @@index([projectId, createdAt])        // pagination sorting
}
```

Check that indexes are being used:

```sql
-- In psql or prisma studio
EXPLAIN ANALYSE
SELECT * FROM "Task"
WHERE "projectId" = 42 AND "status" = 'IN_PROGRESS'
ORDER BY "createdAt" DESC
LIMIT 20;
```

Look for `Index Scan` — if you see `Seq Scan` on a large table, add an index.

---

## 23.8 Profiling with clinic.js

```bash
npm install -g clinic
npm install -g autocannon

# Profile 30 seconds of traffic
clinic doctor -- node dist/server.js

# Load test (1000 requests, 10 concurrent)
autocannon -c 10 -d 30 http://localhost:3000/api/v1/projects/1/tasks
```

`clinic doctor` generates a flame graph that shows where CPU time is spent. Common findings:
- JSON serialisation of large responses (reduce payload size)
- Synchronous crypto operations blocking the event loop (move to worker threads)
- Missing database indexes (query time dominates)

---

## 23.9 Memory Leak Detection

```typescript
// Quick check — log memory every 30 seconds in production
setInterval(() => {
  const used = process.memoryUsage();
  logger.info({
    rss:      Math.round(used.rss / 1024 / 1024),
    heapUsed: Math.round(used.heapUsed / 1024 / 1024),
    external: Math.round(used.external / 1024 / 1024),
  }, "Memory usage (MB)");
}, 30_000);
```

If `heapUsed` grows steadily over time without a ceiling, you have a leak. Common causes: event listeners not removed, cached arrays growing unboundedly, holding references to closed socket connections.

---

## Summary

| Issue | Solution |
|-------|---------|
| N+1 queries | Prisma `include` — load related data in one query |
| Sequential awaits | `Promise.all` for independent async calls |
| Large responses | `compression` middleware + select only needed fields |
| Connection exhaustion | Tune `connection_limit` in DATABASE_URL |
| Slow queries | Prisma query logging + `EXPLAIN ANALYSE` + add indexes |
| Unbounded lists | Always paginate — max 100 per page |

---

## Exercise

Open `exercises/chapter_23.ts` and complete all TODOs.
