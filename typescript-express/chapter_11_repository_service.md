# Chapter 11 — Repository + Service Pattern

## Learning Objectives

By the end of this chapter you will be able to:
- Implement a typed `BaseRepository<T>` with common CRUD operations
- Write service classes that contain all business logic
- Keep route handlers thin — only HTTP concerns
- Use the `Result<T, E>` pattern consistently in the service layer
- Mock repositories in tests without hitting the database

---

## 11.1 Why Layer the Code

Without layering, route handlers become god functions:

```typescript
// WITHOUT layering — everything in the route handler (hard to test, hard to reason about)
router.patch("/:taskId", authenticate, asyncHandler(async (req, res) => {
  const task = await prisma.task.findUnique({ where: { id: Number(req.params.taskId) } });
  if (!task) { res.status(404).json(...); return; }
  if (task.project.orgId !== req.user!.orgId) { res.status(403).json(...); return; }
  if (!["admin","owner"].includes(req.user!.role)) { res.status(403).json(...); return; }
  const updated = await prisma.task.update({ where: { id: task.id }, data: req.body });
  await prisma.activityLog.create({ data: { ... } });
  res.json({ ok: true, data: updated });
}));
```

With layering:

```
Route handler  →  validates HTTP, calls service, sends response
Service        →  business logic, orchestrates repositories
Repository     →  database access, returns typed models
```

---

## 11.2 BaseRepository

```typescript
// src/repositories/base.repository.ts
import { prisma } from "../lib/prisma.js";

export interface FindManyOptions {
  skip?:    number;
  take?:    number;
  orderBy?: Record<string, "asc" | "desc">;
}

export abstract class BaseRepository<
  Model,
  CreateInput,
  UpdateInput,
  WhereUniqueInput
> {
  protected abstract modelName: string;

  abstract findById(id: number): Promise<Model | null>;
  abstract findMany(where: Record<string, unknown>, opts?: FindManyOptions): Promise<Model[]>;
  abstract count(where: Record<string, unknown>): Promise<number>;
  abstract create(data: CreateInput): Promise<Model>;
  abstract update(id: number, data: UpdateInput): Promise<Model>;
  abstract delete(id: number): Promise<void>;
}
```

---

## 11.3 TaskRepository

```typescript
// src/repositories/task.repository.ts
import type { Task, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { BaseRepository, type FindManyOptions } from "./base.repository.js";

export type TaskWithRelations = Task & {
  assignee: { id: number; name: string; email: string } | null;
  labels:   { label: { id: number; name: string; color: string } }[];
  _count:   { comments: number; attachments: number };
};

export class TaskRepository extends BaseRepository<
  Task,
  Prisma.TaskCreateInput,
  Prisma.TaskUpdateInput,
  Prisma.TaskWhereUniqueInput
> {
  protected modelName = "task";

  async findById(id: number): Promise<Task | null> {
    return prisma.task.findUnique({ where: { id } });
  }

  async findByIdWithRelations(id: number): Promise<TaskWithRelations | null> {
    return prisma.task.findUnique({
      where:   { id },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        labels:   { include: { label: true } },
        _count:   { select: { comments: true, attachments: true } },
      },
    });
  }

  async findMany(
    where: Prisma.TaskWhereInput,
    opts: FindManyOptions = {}
  ): Promise<Task[]> {
    return prisma.task.findMany({
      where,
      skip:    opts.skip,
      take:    opts.take,
      orderBy: opts.orderBy ?? { createdAt: "desc" },
    });
  }

  async count(where: Prisma.TaskWhereInput): Promise<number> {
    return prisma.task.count({ where });
  }

  async create(data: Prisma.TaskCreateInput): Promise<Task> {
    return prisma.task.create({ data });
  }

  async update(id: number, data: Prisma.TaskUpdateInput): Promise<Task> {
    return prisma.task.update({ where: { id }, data });
  }

  async delete(id: number): Promise<void> {
    await prisma.task.delete({ where: { id } });
  }
}

export const taskRepository = new TaskRepository();
```

---

## 11.4 TaskService

```typescript
// src/services/task.service.ts
import { taskRepository, type TaskWithRelations } from "../repositories/task.repository.js";
import { activityRepository } from "../repositories/activity.repository.js";
import { NotFoundError, ForbiddenError } from "../types/errors.js";
import { hasMinimumRole } from "../types/auth.js";
import type { AuthUser } from "../types/auth.js";
import type { Prisma } from "@prisma/client";

export interface ListTasksQuery {
  projectId: number;
  status?:   string;
  priority?: string;
  assignee?: number;
  page:      number;
  limit:     number;
  sort:      string;
  order:     "asc" | "desc";
}

export interface CreateTaskDto {
  title:       string;
  description?: string;
  priority?:   string;
  assigneeId?: number;
  dueDate?:    Date;
}

export interface UpdateTaskDto {
  title?:       string;
  description?: string | null;
  status?:      string;
  priority?:    string;
  assigneeId?:  number | null;
  dueDate?:     Date | null;
}

export class TaskService {
  async list(query: ListTasksQuery): Promise<{ tasks: Task[]; total: number }> {
    const where: Prisma.TaskWhereInput = {
      projectId:  query.projectId,
      ...(query.status   && { status:     query.status as any }),
      ...(query.priority && { priority:   query.priority as any }),
      ...(query.assignee && { assigneeId: query.assignee }),
    };

    const [tasks, total] = await Promise.all([
      taskRepository.findMany(where, {
        skip:    (query.page - 1) * query.limit,
        take:    query.limit,
        orderBy: { [query.sort]: query.order },
      }),
      taskRepository.count(where),
    ]);

    return { tasks, total };
  }

  async getById(taskId: number, user: AuthUser): Promise<TaskWithRelations> {
    const task = await taskRepository.findByIdWithRelations(taskId);
    if (!task) throw new NotFoundError("Task", taskId);

    // Ownership check — user must be in the same org as the project
    if (task.project?.orgId !== user.orgId) {
      throw new ForbiddenError("You do not have access to this task");
    }

    return task;
  }

  async create(
    projectId: number,
    dto: CreateTaskDto,
    user: AuthUser
  ): Promise<Task> {
    const task = await taskRepository.create({
      title:       dto.title,
      description: dto.description,
      priority:    (dto.priority ?? "NONE") as any,
      assigneeId:  dto.assigneeId,
      dueDate:     dto.dueDate,
      project:     { connect: { id: projectId } },
    });

    await activityRepository.create({
      entityType: "task",
      entityId:   task.id,
      userId:     user.id,
      action:     "created",
    });

    return task;
  }

  async update(
    taskId: number,
    dto: UpdateTaskDto,
    user: AuthUser
  ): Promise<Task> {
    const existing = await taskRepository.findById(taskId);
    if (!existing) throw new NotFoundError("Task", taskId);

    // Only members and above can update tasks
    if (!hasMinimumRole(user.role, "member")) {
      throw new ForbiddenError("Members and above can update tasks");
    }

    const updated = await taskRepository.update(taskId, dto as Prisma.TaskUpdateInput);

    await activityRepository.create({
      entityType: "task",
      entityId:   taskId,
      userId:     user.id,
      action:     "updated",
      meta:       { changes: dto },
    });

    return updated;
  }

  async delete(taskId: number, user: AuthUser): Promise<void> {
    const existing = await taskRepository.findById(taskId);
    if (!existing) throw new NotFoundError("Task", taskId);

    if (!hasMinimumRole(user.role, "admin")) {
      throw new ForbiddenError("Only admins can delete tasks");
    }

    await taskRepository.delete(taskId);
  }
}

export const taskService = new TaskService();
```

---

## 11.5 Thin Route Handler

```typescript
// src/api/v1/tasks/tasks.router.ts
import { Router } from "express";
import { validate }     from "../../../middleware/validate.js";
import { asyncHandler } from "../../../middleware/asyncHandler.js";
import { taskService }  from "../../../services/task.service.js";
import { sendOk, sendCreated, sendList, buildMeta } from "../../../lib/response.js";
import { ListTaskQuerySchema, CreateTaskSchema, UpdateTaskSchema, TaskParamsSchema } from "./tasks.schemas.js";

export function createTaskRouter(): Router {
  const router = Router({ mergeParams: true });

  router.get(
    "/",
    validate({ query: ListTaskQuerySchema }),
    asyncHandler(async (req, res) => {
      const { tasks, total } = await taskService.list({
        projectId: Number(req.params.projectId),
        ...req.query,
      });
      sendList(res, tasks, buildMeta(req.query.page, req.query.limit, total));
    })
  );

  router.post(
    "/",
    validate({ body: CreateTaskSchema }),
    asyncHandler(async (req, res) => {
      const task = await taskService.create(
        Number(req.params.projectId),
        req.body,
        req.user!
      );
      sendCreated(res, task);
    })
  );

  router.patch(
    "/:taskId",
    validate({ params: TaskParamsSchema, body: UpdateTaskSchema }),
    asyncHandler(async (req, res) => {
      const task = await taskService.update(req.params.taskId, req.body, req.user!);
      sendOk(res, task);
    })
  );

  router.delete(
    "/:taskId",
    validate({ params: TaskParamsSchema }),
    asyncHandler(async (req, res) => {
      await taskService.delete(req.params.taskId, req.user!);
      res.status(204).send();
    })
  );

  return router;
}
```

The route handler does three things: parse validated input, call the service, send the response. No business logic, no database access, no error handling — the layers handle all of that.

---

## 11.6 Testability — Mocking the Repository

Because services receive repositories through dependency injection (or module-level imports that can be mocked), you can test services without a real database:

```typescript
// tests/unit/task.service.test.ts
import { vi, describe, it, expect } from "vitest";

// Mock the repository module
vi.mock("../../src/repositories/task.repository.js", () => ({
  taskRepository: {
    findById:              vi.fn(),
    findByIdWithRelations: vi.fn(),
    findMany:              vi.fn(),
    count:                 vi.fn(),
    create:                vi.fn(),
    update:                vi.fn(),
    delete:                vi.fn(),
  },
}));

import { taskRepository } from "../../src/repositories/task.repository.js";
import { taskService }    from "../../src/services/task.service.js";

describe("TaskService.getById", () => {
  it("throws NotFoundError when task does not exist", async () => {
    vi.mocked(taskRepository.findByIdWithRelations).mockResolvedValue(null);
    const user = { id: 1, orgId: 1, role: "member", email: "a@b.com" };
    await expect(taskService.getById(99, user)).rejects.toThrow("Task 99 not found");
  });
});
```

---

## Summary

| Layer | Responsibility |
|-------|---------------|
| Router | Validate input, call service, send response |
| Service | Business logic, orchestrate repos, return Result or throw AppError |
| Repository | Database access, return typed models, no business rules |

---

## Exercise

Open `exercises/chapter_11.ts` and complete all TODOs.
