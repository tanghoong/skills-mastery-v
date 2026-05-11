# Chapter 7 — REST API Design

## Learning Objectives

By the end of this chapter you will be able to:
- Design consistent typed response envelopes for all API responses
- Implement cursor-based and offset pagination with typed metadata
- Choose correct HTTP methods and status codes for every operation
- Design idiomatic resource URLs including nested resources
- Handle partial updates with PATCH correctly

---

## 7.1 Typed Response Envelope

Every endpoint in TaskFlow returns the same outer shape. This consistency lets clients handle responses generically.

```typescript
// src/types/api.ts

// Success envelope
export interface ApiSuccess<T> {
  ok: true;
  data: T;
}

// Success with pagination metadata
export interface ApiList<T> {
  ok: true;
  data: T[];
  meta: PaginationMeta;
}

// Error envelope
export interface ApiError {
  ok: false;
  error: {
    code:       string;
    message:    string;
    statusCode: number;
    details?:   unknown;
  };
}

// Pagination metadata
export interface PaginationMeta {
  page:       number;
  limit:      number;
  total:      number;
  totalPages: number;
  hasNext:    boolean;
  hasPrev:    boolean;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
export type ApiListResponse<T> = ApiList<T> | ApiError;
```

---

## 7.2 Response Helper Functions

```typescript
// src/lib/response.ts
import type { Response } from "express";
import type { ApiSuccess, ApiList, PaginationMeta } from "../types/api.js";

export function sendOk<T>(res: Response, data: T, status = 200): void {
  res.status(status).json({ ok: true, data } satisfies ApiSuccess<T>);
}

export function sendCreated<T>(res: Response, data: T): void {
  sendOk(res, data, 201);
}

export function sendList<T>(
  res: Response,
  data: T[],
  meta: PaginationMeta
): void {
  res.json({ ok: true, data, meta } satisfies ApiList<T>);
}

export function buildMeta(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}
```

Usage:
```typescript
router.get("/tasks", asyncHandler(async (req, res) => {
  const { page, limit, status } = req.query;
  const { tasks, total } = await taskService.list({ page, limit, status });
  sendList(res, tasks, buildMeta(page, limit, total));
}));
```

---

## 7.3 URL Design Rules

```
# Resources are nouns, plural
GET  /api/v1/projects          ✓
GET  /api/v1/getProjects       ✗ (verb)
GET  /api/v1/project           ✗ (singular)

# Nested resources for owned entities
GET  /api/v1/projects/:projectId/tasks          ✓
GET  /api/v1/tasks?projectId=123               ✓ (also ok for search)

# Actions that don't fit CRUD — use verbs as sub-resources
POST /api/v1/tasks/:taskId/assign              ✓
POST /api/v1/tasks/:taskId/complete            ✓
POST /api/v1/auth/logout                       ✓

# IDs in path, filters in query
GET  /api/v1/projects/42/tasks?status=in_progress&priority=high  ✓
GET  /api/v1/projects/42/tasks/status/in_progress                ✗
```

---

## 7.4 HTTP Method Semantics

| Method | Body | Idempotent | Use For |
|--------|------|-----------|---------|
| GET | No | Yes | Retrieve resources |
| POST | Yes | No | Create resource, trigger action |
| PUT | Yes | Yes | Replace entire resource |
| PATCH | Yes | No | Partial update |
| DELETE | No | Yes | Delete resource |

For TaskFlow, use `PATCH` for all updates — full resource replacement (`PUT`) is rarely useful in practice and requires clients to send every field.

---

## 7.5 PATCH — Partial Updates

The key rule: fields absent from the PATCH body should not be changed.

```typescript
const UpdateTaskSchema = z.object({
  title:       z.string().min(1).max(255).optional(),
  description: z.string().max(5000).optional().nullable(),
  status:      z.enum(["backlog","todo","in_progress","in_review","done","cancelled"]).optional(),
  priority:    z.enum(["urgent","high","medium","low","none"]).optional(),
  assigneeId:  z.number().int().positive().optional().nullable(),
  dueDate:     z.coerce.date().optional().nullable(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field must be provided for update" }
);

type UpdateTaskDto = z.infer<typeof UpdateTaskSchema>;

// Repository — only update fields present in dto
async function updateTask(taskId: number, dto: UpdateTaskDto) {
  return prisma.task.update({
    where: { id: taskId },
    data: dto,  // Prisma only updates fields present in the object
  });
}
```

---

## 7.6 Status Codes for Every Scenario

```typescript
// 200 — successful GET or PATCH
res.json({ ok: true, data: task });

// 201 — resource created (POST)
res.status(201).json({ ok: true, data: newTask });

// 204 — deleted, no body
res.status(204).send();

// The error middleware handles 400, 401, 403, 404, 409, 422, 500
// Never set error status codes manually in route handlers
throw new NotFoundError("Task", taskId); // errorHandler converts to 404
```

---

## 7.7 Offset Pagination (Simple)

```typescript
const PaginationSchema = z.object({
  page:  z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

async function listTasks(projectId: number, query: z.infer<typeof PaginationSchema>) {
  const { page, limit } = query;
  const skip = (page - 1) * limit;

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where: { projectId },
      skip,
      take:  limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.task.count({ where: { projectId } }),
  ]);

  return { tasks, total };
}
```

---

## 7.8 Sorting and Filtering

```typescript
const ListTaskQuerySchema = PaginationSchema.extend({
  status:   z.enum(["backlog","todo","in_progress","in_review","done","cancelled"]).optional(),
  priority: z.enum(["urgent","high","medium","low","none"]).optional(),
  assignee: z.coerce.number().int().positive().optional(),
  sort:     z.enum(["createdAt","dueDate","priority","title"]).default("createdAt"),
  order:    z.enum(["asc","desc"]).default("desc"),
});

type ListTaskQuery = z.infer<typeof ListTaskQuerySchema>;

async function listTasks(projectId: number, query: ListTaskQuery) {
  const where: Prisma.TaskWhereInput = {
    projectId,
    ...(query.status    && { status:     query.status }),
    ...(query.priority  && { priority:   query.priority }),
    ...(query.assignee  && { assigneeId: query.assignee }),
  };

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      skip:    (query.page - 1) * query.limit,
      take:    query.limit,
      orderBy: { [query.sort]: query.order },
    }),
    prisma.task.count({ where }),
  ]);

  return { tasks, total };
}
```

---

## 7.9 TaskFlow Full Route Registration

```typescript
// src/api/v1/index.ts
import { Router } from "express";

export function createV1Router(): Router {
  const router = Router();

  // Public routes (no auth)
  router.use("/auth", createAuthRouter());

  // Protected routes — authenticate applied at router level
  router.use(authenticate);

  router.use("/orgs",                                    createOrgRouter());
  router.use("/orgs/:orgId/members",                    createMemberRouter());
  router.use("/orgs/:orgId/projects",                   createProjectRouter());
  router.use("/projects/:projectId/tasks",              createTaskRouter());
  router.use("/projects/:projectId/tasks/:taskId/comments",    createCommentRouter());
  router.use("/projects/:projectId/tasks/:taskId/attachments", createAttachmentRouter());
  router.use("/me/notifications",                       createNotificationRouter());

  return router;
}
```

---

## Summary

| Concept | Rule |
|---------|------|
| Response envelope | Always `{ ok, data }` or `{ ok, error }` — never bare JSON |
| URL nouns | Plural nouns for resources, verbs only for actions |
| PATCH semantics | Only update fields present in the body |
| Status 204 | Delete with no response body |
| Pagination | Always paginate list endpoints — never return unbounded arrays |

---

## Exercise

Open `exercises/chapter_07.ts` and complete all TODOs.
