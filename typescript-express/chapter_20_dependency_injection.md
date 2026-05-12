# Chapter 20 — Dependency Injection with TSyringe

## Learning Objectives

By the end of this chapter you will be able to:
- Set up TSyringe for IoC container management
- Register services and repositories as injectable tokens
- Inject dependencies into classes without global imports
- Swap implementations for testing without changing production code

---

## 20.1 Why Dependency Injection

Without DI, services import concrete implementations:

```typescript
// task.service.ts — tightly coupled
import { taskRepository } from "../repositories/task.repository.js"; // concrete import
import { redis }          from "../lib/redis.js";
```

Problems:
- Hard to test — importing the module executes side effects (DB connections)
- Cannot swap Redis for an in-memory store in tests
- Class instantiation is scattered across the codebase

With DI, dependencies are declared as constructor parameters and injected by a container.

---

## 20.2 Installing TSyringe

```bash
npm install tsyringe reflect-metadata
```

Enable decorators in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata":  true
  }
}
```

Import `reflect-metadata` once at the top of your entry point:

```typescript
// src/server.ts — very first import
import "reflect-metadata";
```

---

## 20.3 Injectable Repository

```typescript
// src/repositories/task.repository.ts
import { injectable } from "tsyringe";
import { prisma }     from "../lib/prisma.js";

@injectable()
export class TaskRepository {
  async findById(id: number) {
    return prisma.task.findUnique({ where: { id } });
  }
  // ... other methods
}
```

---

## 20.4 Injectable Service

```typescript
// src/services/task.service.ts
import { injectable, inject } from "tsyringe";
import { TaskRepository }     from "../repositories/task.repository.js";
import { RedisService }       from "../lib/redis.service.js";

@injectable()
export class TaskService {
  constructor(
    @inject(TaskRepository) private readonly tasks:  TaskRepository,
    @inject(RedisService)   private readonly cache:  RedisService,
  ) {}

  async list(query: ListTasksQuery) {
    const cacheKey = `tasks:${query.projectId}:${JSON.stringify(query)}`;
    const cached = await this.cache.getJson<Task[]>(cacheKey);
    if (cached) return cached;

    const tasks = await this.tasks.findMany({ projectId: query.projectId });
    await this.cache.setJson(cacheKey, tasks, 300);
    return tasks;
  }
}
```

---

## 20.5 Container Registration

```typescript
// src/container.ts
import "reflect-metadata";
import { container } from "tsyringe";
import { TaskRepository }  from "./repositories/task.repository.js";
import { TaskService }     from "./services/task.service.js";
import { RedisService }    from "./lib/redis.service.js";

// Register all injectable classes
container.registerSingleton(TaskRepository);
container.registerSingleton(RedisService);
container.registerSingleton(TaskService);

export { container };
```

---

## 20.6 Router Factory Using the Container

```typescript
// src/api/v1/tasks/tasks.router.ts
import { Router }      from "express";
import { container }   from "../../../container.js";
import { TaskService } from "../../../services/task.service.js";
import { asyncHandler } from "../../../middleware/asyncHandler.js";

export function createTaskRouter(): Router {
  const router      = Router({ mergeParams: true });
  const taskService = container.resolve(TaskService); // DI resolves all deps

  router.get("/", asyncHandler(async (req, res) => {
    const tasks = await taskService.list({ projectId: Number(req.params.projectId), ...req.query });
    res.json({ ok: true, data: tasks });
  }));

  return router;
}
```

---

## 20.7 Swapping Implementations in Tests

```typescript
// tests/unit/task.service.test.ts
import "reflect-metadata";
import { container } from "tsyringe";
import { TaskRepository } from "../../src/repositories/task.repository.js";
import { TaskService }    from "../../src/services/task.service.js";

// Register a mock repository
class MockTaskRepository {
  findById = vi.fn().mockResolvedValue(null);
  findMany = vi.fn().mockResolvedValue([]);
}

beforeEach(() => {
  container.clearInstances();
  container.registerInstance(TaskRepository, new MockTaskRepository() as any);
});

it("returns empty list", async () => {
  const service = container.resolve(TaskService);
  const result  = await service.list({ projectId: 1, page: 1, limit: 10, sort: "createdAt", order: "desc" });
  expect(result).toEqual([]);
});
```

No `vi.mock()` needed — the container swaps the implementation at test time.

---

## 20.8 Token-Based Registration (Alternative)

For interfaces or primitive values, use injection tokens:

```typescript
// src/tokens.ts
import { InjectionToken } from "tsyringe";
import type { Logger } from "pino";

export const LOGGER_TOKEN = new InjectionToken<Logger>("Logger");

// In container.ts
import { logger } from "./lib/logger.js";
container.registerInstance(LOGGER_TOKEN, logger);

// In a service
@injectable()
class SomeService {
  constructor(@inject(LOGGER_TOKEN) private log: Logger) {}
}
```

---

## Summary

| Concept | Rule |
|---------|------|
| `@injectable()` | Mark every class that can be injected |
| `container.registerSingleton()` | One instance per application lifetime — services and repos |
| `container.resolve()` | Let the container build the dependency tree |
| Test isolation | `container.clearInstances()` + register mock in `beforeEach` |
| `reflect-metadata` | Must be the very first import in the entry point |

---

## Exercise

Open `exercises/chapter_20.ts` and complete all TODOs.
