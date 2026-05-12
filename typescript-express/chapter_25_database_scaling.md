# Chapter 25 — Database Scaling: Read Replicas & Connection Pools

## Learning Objectives

By the end of this chapter you will be able to:
- Configure a Prisma client for read replica routing
- Route write queries to the primary and read queries to replica(s)
- Tune connection pool size for multi-instance deployments
- Use Prisma extensions for cross-cutting concerns
- Understand when to scale the database vs the application

---

## 25.1 Why Read Replicas

A single PostgreSQL instance handles both reads and writes. Under high read traffic:
- Writes block reads on the same connections
- Query time increases as the pool fills up
- The database CPU saturates even though most queries are reads

A **read replica** is a hot copy of the primary that handles SELECT queries. Writes still go to the primary and replicate asynchronously.

```
Write ──► Primary DB ──► (async replication) ──► Read Replica
Read  ──► Read Replica
```

---

## 25.2 Two PrismaClient Instances

```typescript
// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";
import { config }       from "../config/env.js";

// Primary — for writes and anything that needs fresh data
export const prismaPrimary = new PrismaClient({
  datasources: { db: { url: config.db.primaryUrl } },
  log: config.isDev ? ["query", "error"] : ["error"],
});

// Replica — for reads, reports, analytics
export const prismaReplica = new PrismaClient({
  datasources: { db: { url: config.db.replicaUrl ?? config.db.primaryUrl } },
  log: config.isDev ? ["query", "error"] : ["error"],
});

// Convenience: auto-route based on operation type
export const prisma = prismaPrimary; // default is always primary for safety
```

Update the env schema:

```typescript
// src/config/env.ts
DATABASE_URL:         z.string().url(),          // primary
DATABASE_REPLICA_URL: z.string().url().optional(), // replica (if configured)
```

---

## 25.3 Routing Reads to the Replica

```typescript
// src/repositories/base.repository.ts
import { prismaPrimary, prismaReplica } from "../lib/prisma.js";

export abstract class BaseRepository {
  protected get readDb() {
    return prismaReplica; // SELECT queries
  }

  protected get writeDb() {
    return prismaPrimary; // INSERT, UPDATE, DELETE
  }
}

// src/repositories/task.repository.ts
export class TaskRepository extends BaseRepository {
  // Reads go to replica
  async findById(id: number) {
    return this.readDb.task.findUnique({ where: { id } });
  }

  async findMany(where: Prisma.TaskWhereInput, opts: FindManyOptions = {}) {
    return this.readDb.task.findMany({ where, ...opts });
  }

  async count(where: Prisma.TaskWhereInput) {
    return this.readDb.task.count({ where });
  }

  // Writes go to primary
  async create(data: Prisma.TaskCreateInput) {
    return this.writeDb.task.create({ data });
  }

  async update(id: number, data: Prisma.TaskUpdateInput) {
    return this.writeDb.task.update({ where: { id }, data });
  }

  async delete(id: number) {
    await this.writeDb.task.delete({ where: { id } });
  }
}
```

---

## 25.4 Read-Your-Writes Consistency

A problem with async replication: after a write, the replica may not have the data yet. If you immediately read from the replica, you get stale data:

```typescript
// PROBLEM
const task = await taskRepository.create({ ... }); // write to primary
const fresh = await taskRepository.findById(task.id); // read from replica — may be stale!

// SOLUTION 1: Read from primary immediately after write
const fresh = await this.writeDb.task.findUnique({ where: { id: task.id } });

// SOLUTION 2: Return the created record (already available from create())
async create(data: Prisma.TaskCreateInput) {
  const task = await this.writeDb.task.create({ data, include: { assignee: true } });
  return task; // return the freshly-created record — no second read needed
}
```

Rule: always return the created/updated record from the service — don't re-fetch it.

---

## 25.5 Prisma Extensions

Prisma extensions let you add middleware-like logic to all queries:

```typescript
// src/lib/prisma.ts — extended client with soft-delete support
import { PrismaClient } from "@prisma/client";

const basePrisma = new PrismaClient();

export const prisma = basePrisma.$extends({
  // Add a timestamp to every update automatically
  query: {
    $allModels: {
      async update({ args, query }) {
        args.data = { ...args.data, updatedAt: new Date() };
        return query(args);
      },
    },

    // Soft-delete extension: filter out deleted records
    task: {
      async findMany({ args, query }) {
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
      async findUnique({ args, query }) {
        const result = await query(args);
        if (result?.deletedAt) return null; // treat soft-deleted as missing
        return result;
      },
    },
  },
});
```

---

## 25.6 Connection Pool Tuning

```
# docker-compose.prod.yml postgres
POSTGRES_MAX_CONNECTIONS=100

# DATABASE_URL with pool settings
DATABASE_URL=postgresql://user:pass@host:5432/db?connection_limit=20&pool_timeout=30

# Per service/dyno: 20 connections
# If you scale to 3 instances: 60 connections total (well within 100)
```

Formula:
```
connection_limit = (postgres_max_connections / number_of_instances) - 5 (reserve for admin)
```

---

## 25.7 PgBouncer (Connection Pooler)

When you have many short-lived connections (serverless, many app instances), PostgreSQL connection overhead becomes the bottleneck. PgBouncer sits between your app and Postgres:

```
App instances (many connections) ──► PgBouncer (pooled) ──► Postgres (few connections)
```

Railway provides PgBouncer as an option on their PostgreSQL plugin. Enable it and use the PgBouncer URL as `DATABASE_URL`.

Important: Prisma does not work with PgBouncer in `transaction` mode — use `session` mode or set `pgbouncer=true` in the connection string:

```
DATABASE_URL=postgresql://...?pgbouncer=true&connection_limit=1
```

---

## 25.8 Reporting Queries

For admin/analytics routes that aggregate data, always use the replica and add indexes to support the aggregation:

```typescript
// src/api/v1/orgs/analytics.router.ts
router.get(
  "/:orgId/analytics",
  authenticate,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const orgId = Number(req.params.orgId);

    // All of these hit the replica
    const [tasksByStatus, tasksByPriority, completedThisWeek] = await Promise.all([
      prismaReplica.task.groupBy({
        by:    ["status"],
        where: { project: { orgId } },
        _count: { _all: true },
      }),
      prismaReplica.task.groupBy({
        by:    ["priority"],
        where: { project: { orgId } },
        _count: { _all: true },
      }),
      prismaReplica.task.count({
        where: {
          project: { orgId },
          status:  "DONE",
          updatedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    sendOk(res, { tasksByStatus, tasksByPriority, completedThisWeek });
  })
);
```

---

## Summary

| Concept | Rule |
|---------|------|
| `prismaPrimary` / `prismaReplica` | Two clients — writes always to primary |
| `BaseRepository.readDb` | All `find*` and `count` go to replica |
| Read-your-writes | Return the created record — don't re-fetch via replica |
| `connection_limit` | `(max_connections / instances) - 5` |
| Prisma extensions | Cross-cutting concerns (timestamps, soft-delete) without repeating code |
| Reporting queries | Use replica + `groupBy` — never run analytics on primary |

---

## Exercise

Open `exercises/chapter_25.ts` and complete all TODOs.
