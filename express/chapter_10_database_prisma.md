# Chapter 10 — Database Layer: Prisma

## Learning Objectives

By the end of this chapter you will be able to:
- Set up Prisma with TypeScript in a Node.js project
- Write a Prisma schema that models the TaskFlow domain
- Run migrations and seed the database
- Use typed Prisma queries — no raw SQL
- Handle Prisma errors with typed error codes
- Manage the singleton PrismaClient correctly

---

## 10.1 Installing Prisma

```bash
npm install @prisma/client
npm install -D prisma

npx prisma init    # creates prisma/schema.prisma and .env
```

Update `prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

---

## 10.2 TaskFlow Schema

```prisma
// prisma/schema.prisma

model User {
  id           Int      @id @default(autoincrement())
  email        String   @unique
  name         String
  passwordHash String
  avatarUrl    String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  memberships    OrgMember[]
  assignedTasks  Task[]        @relation("Assignee")
  comments       Comment[]
  attachments    Attachment[]
  activityLogs   ActivityLog[]
  notifications  Notification[]
}

model Organization {
  id        Int      @id @default(autoincrement())
  name      String
  slug      String   @unique
  plan      Plan     @default(FREE)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  members  OrgMember[]
  projects Project[]
}

model OrgMember {
  orgId  Int
  userId Int
  role   OrgRole @default(MEMBER)

  org  Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)
  user User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([orgId, userId])
}

model Project {
  id          Int           @id @default(autoincrement())
  orgId       Int
  name        String
  description String?
  status      ProjectStatus @default(ACTIVE)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  org    Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)
  tasks  Task[]
  labels Label[]
}

model Task {
  id          Int          @id @default(autoincrement())
  projectId   Int
  title       String
  description String?
  status      TaskStatus   @default(BACKLOG)
  priority    TaskPriority @default(NONE)
  assigneeId  Int?
  dueDate     DateTime?
  position    Int          @default(0)
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  project     Project      @relation(fields: [projectId], references: [id], onDelete: Cascade)
  assignee    User?        @relation("Assignee", fields: [assigneeId], references: [id])
  comments    Comment[]
  attachments Attachment[]
  labels      TaskLabel[]
  activities  ActivityLog[]
}

model Comment {
  id        Int      @id @default(autoincrement())
  taskId    Int
  userId    Int
  content   String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  task Task @relation(fields: [taskId], references: [id], onDelete: Cascade)
  user User @relation(fields: [userId], references: [id])
}

model Attachment {
  id        Int      @id @default(autoincrement())
  taskId    Int
  userId    Int
  filename  String
  url       String
  size      Int      // bytes
  mimeType  String
  createdAt DateTime @default(now())

  task Task @relation(fields: [taskId], references: [id], onDelete: Cascade)
  user User @relation(fields: [userId], references: [id])
}

model Label {
  id        Int     @id @default(autoincrement())
  projectId Int
  name      String
  color     String  // hex colour, e.g. "#FF5733"

  project Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  tasks   TaskLabel[]
}

model TaskLabel {
  taskId  Int
  labelId Int

  task  Task  @relation(fields: [taskId], references: [id], onDelete: Cascade)
  label Label @relation(fields: [labelId], references: [id], onDelete: Cascade)

  @@id([taskId, labelId])
}

model ActivityLog {
  id         Int      @id @default(autoincrement())
  entityType String   // "task", "project", "comment"
  entityId   Int
  userId     Int
  action     String   // "created", "updated", "deleted", "assigned"
  meta       Json?    // arbitrary JSON for diff/context
  createdAt  DateTime @default(now())

  user User @relation(fields: [userId], references: [id])
  task Task? @relation(fields: [entityId], references: [id], map: "activity_task")
}

model Notification {
  id        Int      @id @default(autoincrement())
  userId    Int
  type      String
  title     String
  body      String
  isRead    Boolean  @default(false)
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

enum Plan {
  FREE
  PRO
  ENTERPRISE
}

enum OrgRole {
  OWNER
  ADMIN
  MEMBER
  VIEWER
}

enum ProjectStatus {
  ACTIVE
  ARCHIVED
}

enum TaskStatus {
  BACKLOG
  TODO
  IN_PROGRESS
  IN_REVIEW
  DONE
  CANCELLED
}

enum TaskPriority {
  URGENT
  HIGH
  MEDIUM
  LOW
  NONE
}
```

---

## 10.3 Running Migrations

```bash
# Create and apply a migration
npx prisma migrate dev --name init

# Generate the TypeScript client
npx prisma generate

# View the database in the browser
npx prisma studio
```

After `generate`, Prisma creates fully typed query builders. TypeScript knows the exact shape of every model.

---

## 10.4 PrismaClient Singleton

```typescript
// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";
import { config } from "../config/env.js";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: config.isDev ? ["query", "error", "warn"] : ["error"],
  });

if (config.isDev) globalForPrisma.prisma = prisma;
```

The `globalThis` trick prevents creating multiple `PrismaClient` instances during hot module reload in development — each instance opens its own connection pool.

---

## 10.5 Typed Prisma Queries

```typescript
import { prisma } from "../lib/prisma.js";
import type { Prisma } from "@prisma/client";

// findMany with include — return type is fully inferred
const tasks = await prisma.task.findMany({
  where:   { projectId: 42, status: "IN_PROGRESS" },
  include: { assignee: true, labels: { include: { label: true } } },
  orderBy: { createdAt: "desc" },
  skip:    0,
  take:    20,
});
// tasks: (Task & { assignee: User | null, labels: (TaskLabel & { label: Label })[] })[]
// TypeScript knows the exact type — no casting needed

// findUniqueOrThrow — throws if not found (Prisma maps to P2025)
const task = await prisma.task.findUniqueOrThrow({
  where: { id: 42 },
});

// create
const newTask = await prisma.task.create({
  data: {
    title:     "Fix the login bug",
    projectId: 7,
    priority:  "HIGH",
    status:    "BACKLOG",
  },
});

// update (only fields present in `data` are updated)
const updated = await prisma.task.update({
  where: { id: 42 },
  data:  { status: "DONE", updatedAt: new Date() },
});

// delete
await prisma.task.delete({ where: { id: 42 } });

// transaction — multiple operations atomically
const [task, _activity] = await prisma.$transaction([
  prisma.task.update({ where: { id: 42 }, data: { status: "DONE" } }),
  prisma.activityLog.create({
    data: {
      entityType: "task",
      entityId:   42,
      userId:     req.user!.id,
      action:     "completed",
    },
  }),
]);
```

---

## 10.6 Seeding

```typescript
// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password.js";

const prisma = new PrismaClient();

async function main() {
  const org = await prisma.organization.create({
    data: { name: "Acme Corp", slug: "acme" },
  });

  const user = await prisma.user.create({
    data: {
      name:         "Alice Admin",
      email:        "alice@acme.com",
      passwordHash: await hashPassword("password123"),
      memberships:  {
        create: { orgId: org.id, role: "OWNER" },
      },
    },
  });

  const project = await prisma.project.create({
    data: {
      orgId: org.id,
      name:  "TaskFlow MVP",
    },
  });

  await prisma.task.createMany({
    data: [
      { projectId: project.id, title: "Set up CI/CD",     status: "DONE",        priority: "HIGH" },
      { projectId: project.id, title: "Write auth module", status: "IN_PROGRESS", priority: "URGENT", assigneeId: user.id },
      { projectId: project.id, title: "Add WebSocket",    status: "BACKLOG",     priority: "MEDIUM" },
    ],
  });

  console.log("✅ Seed complete");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

```json
// package.json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

```bash
npx prisma db seed
```

---

## 10.7 Prisma Error Mapping (in errorHandler)

```typescript
import { Prisma } from "@prisma/client";

// Add to errorHandler before the generic 500 fallback:
if (err instanceof Prisma.PrismaClientKnownRequestError) {
  switch (err.code) {
    case "P2025": // record not found
      res.status(404).json({ ok: false, error: { code: "NOT_FOUND", message: "Record not found", statusCode: 404 } });
      return;
    case "P2002": // unique constraint
      res.status(409).json({ ok: false, error: { code: "CONFLICT", message: "Record already exists", statusCode: 409 } });
      return;
    case "P2003": // foreign key constraint
      res.status(409).json({ ok: false, error: { code: "CONFLICT", message: "Referenced record does not exist", statusCode: 409 } });
      return;
  }
}
```

---

## Summary

| Concept | Rule |
|---------|------|
| No raw SQL | Prisma typed queries only — `prisma.model.operation()` |
| PrismaClient singleton | One instance via `globalThis` trick |
| `findUniqueOrThrow` | Throws `P2025` automatically — map it in the error handler |
| `$transaction` | Use for multiple related writes that must be atomic |
| Seed with `tsx` | Seed file uses the same TypeScript types as the app |

---

## Exercise

Open `exercises/chapter_10.ts` and complete all TODOs.
