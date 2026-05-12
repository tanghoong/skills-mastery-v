# Chapter 15 — Testing Express with Vitest + Supertest

## Learning Objectives

By the end of this chapter you will be able to:
- Configure Vitest for a TypeScript Express project
- Write integration tests that hit real HTTP endpoints
- Set up and tear down a test database per test suite
- Mock external dependencies (S3, Redis, email) in tests
- Achieve the 70% coverage required by the Codex review

---

## 15.1 Installing Dependencies

```bash
npm install -D vitest @vitest/coverage-v8 supertest @types/supertest
```

---

## 15.2 Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    envFile:     ".env.test",
    setupFiles:  ["tests/setup.ts"],
    coverage: {
      provider:   "v8",
      reporter:   ["text", "json", "html"],
      thresholds: {
        global: { statements: 70, branches: 70, functions: 70, lines: 70 },
      },
      include: ["src/**/*.ts"],
      exclude: ["src/types/**", "src/config/**", "src/**/*.d.ts"],
    },
    // Run test files sequentially to avoid DB conflicts
    pool:        "forks",
    poolOptions: { forks: { singleFork: true } },
  },
});
```

---

## 15.3 Test Setup and Teardown

```typescript
// tests/setup.ts
import { beforeAll, afterAll, beforeEach } from "vitest";
import { prisma } from "../src/lib/prisma.js";

beforeAll(async () => {
  // Reset test database before entire suite
  await prisma.$executeRaw`TRUNCATE TABLE "User", "Organization", "Project", "Task" RESTART IDENTITY CASCADE`;
});

afterAll(async () => {
  await prisma.$disconnect();
});

// tests/helpers/db.ts — typed helpers for seeding test data
export async function createTestUser(overrides?: Partial<{
  name: string; email: string; password: string;
}>) {
  const { hashPassword } = await import("../../src/lib/password.js");
  return prisma.user.create({
    data: {
      name:         overrides?.name    ?? "Test User",
      email:        overrides?.email   ?? `test-${Date.now()}@example.com`,
      passwordHash: await hashPassword(overrides?.password ?? "password123"),
    },
  });
}

export async function createTestOrg(ownerId: number) {
  const org = await prisma.organization.create({
    data: { name: "Test Org", slug: `test-org-${Date.now()}` },
  });
  await prisma.orgMember.create({
    data: { orgId: org.id, userId: ownerId, role: "OWNER" },
  });
  return org;
}
```

---

## 15.4 Auth Helpers

```typescript
// tests/helpers/auth.ts
import request from "supertest";
import { createApp } from "../../src/app.js";

const app = createApp();

export async function loginAs(email: string, password = "password123"): Promise<string> {
  const res = await request(app)
    .post("/api/v1/auth/login")
    .send({ email, password });

  if (res.status !== 200) {
    throw new Error(`Login failed: ${JSON.stringify(res.body)}`);
  }

  return res.body.data.accessToken as string;
}
```

---

## 15.5 Integration Tests — Task API

```typescript
// tests/api/tasks.test.ts
import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app.js";
import { createTestUser, createTestOrg } from "../helpers/db.js";
import { loginAs } from "../helpers/auth.js";

const app = createApp();

describe("Tasks API", () => {
  let token:     string;
  let projectId: number;

  beforeAll(async () => {
    const user = await createTestUser({ email: "task-tester@test.com" });
    const org   = await createTestOrg(user.id);
    const project = await prisma.project.create({
      data: { orgId: org.id, name: "Test Project" },
    });
    projectId = project.id;
    token = await loginAs(user.email);
  });

  describe("POST /api/v1/projects/:id/tasks", () => {
    it("creates a task with valid body", async () => {
      const res = await request(app)
        .post(`/api/v1/projects/${projectId}/tasks`)
        .set("Authorization", `Bearer ${token}`)
        .send({ title: "Write tests", priority: "high" });

      expect(res.status).toBe(201);
      expect(res.body.ok).toBe(true);
      expect(res.body.data.title).toBe("Write tests");
      expect(res.body.data.priority).toBe("HIGH");
    });

    it("returns 422 when title is missing", async () => {
      const res = await request(app)
        .post(`/api/v1/projects/${projectId}/tasks`)
        .set("Authorization", `Bearer ${token}`)
        .send({ priority: "high" }); // no title

      expect(res.status).toBe(422);
      expect(res.body.ok).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
      expect(res.body.error.details.body.title).toBeDefined();
    });

    it("returns 401 without auth token", async () => {
      const res = await request(app)
        .post(`/api/v1/projects/${projectId}/tasks`)
        .send({ title: "Unauthorized task" });

      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/v1/projects/:id/tasks", () => {
    it("returns paginated task list", async () => {
      const res = await request(app)
        .get(`/api/v1/projects/${projectId}/tasks?page=1&limit=10`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toMatchObject({
        page:  1,
        limit: 10,
      });
    });
  });

  describe("PATCH /api/v1/projects/:id/tasks/:taskId", () => {
    it("updates task status", async () => {
      // Create a task first
      const createRes = await request(app)
        .post(`/api/v1/projects/${projectId}/tasks`)
        .set("Authorization", `Bearer ${token}`)
        .send({ title: "Task to update" });

      const taskId = createRes.body.data.id;

      const res = await request(app)
        .patch(`/api/v1/projects/${projectId}/tasks/${taskId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "in_progress" });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("IN_PROGRESS");
    });

    it("returns 404 for non-existent task", async () => {
      const res = await request(app)
        .patch(`/api/v1/projects/${projectId}/tasks/999999`)
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "done" });

      expect(res.status).toBe(404);
    });
  });
});
```

---

## 15.6 Unit Tests — Service Layer

```typescript
// tests/unit/task.service.test.ts
import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("../../src/repositories/task.repository.js");
vi.mock("../../src/repositories/activity.repository.js");

import { taskRepository } from "../../src/repositories/task.repository.js";
import { TaskService }    from "../../src/services/task.service.js";

const taskService = new TaskService();
const mockUser = { id: 1, orgId: 1, role: "member" as const, email: "a@b.com" };

describe("TaskService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("throws NotFoundError when task does not exist", async () => {
    vi.mocked(taskRepository.findByIdWithRelations).mockResolvedValue(null);

    await expect(taskService.getById(99, mockUser))
      .rejects
      .toMatchObject({ code: "NOT_FOUND", statusCode: 404 });
  });

  it("throws ForbiddenError when task belongs to different org", async () => {
    vi.mocked(taskRepository.findByIdWithRelations).mockResolvedValue({
      id: 1, projectId: 5, project: { orgId: 999 }, // different org
    } as any);

    await expect(taskService.getById(1, mockUser))
      .rejects
      .toMatchObject({ code: "FORBIDDEN", statusCode: 403 });
  });
});
```

---

## 15.7 package.json Test Scripts

```json
{
  "scripts": {
    "test":          "vitest run",
    "test:watch":    "vitest watch",
    "test:coverage": "vitest run --coverage",
    "test:ui":       "vitest --ui"
  }
}
```

---

## 15.8 What to Test

| Priority | What | Type |
|---------|------|------|
| Must | Auth middleware — valid/expired/missing token | Integration |
| Must | Validation errors — missing fields, wrong types | Integration |
| Must | 404 for missing resources | Integration |
| Must | 403 for wrong role | Integration |
| Must | Happy path for core CRUD | Integration |
| Should | Service layer error paths | Unit |
| Should | Pagination metadata | Integration |
| Nice | File upload size/type rejection | Integration |

Integration tests (Supertest) give the most confidence. Unit tests are faster and better for edge cases in business logic.

---

## Summary

| Concept | Rule |
|---------|------|
| `createApp()` factory | Tests import the app without starting `listen()` |
| Test database | Separate `.env.test` pointing at `taskflow_test` database |
| Reset between suites | `TRUNCATE ... RESTART IDENTITY CASCADE` in `beforeAll` |
| Coverage gate | 70% threshold configured in `vitest.config.ts` |
| Auth in tests | `loginAs()` helper returns a real JWT — no mocking of auth |

---

## Exercise

Open `exercises/chapter_15.ts` and complete all TODOs.
