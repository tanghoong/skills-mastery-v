# Express + TypeScript Mastery — Course Overview

## Mission

Build a **production-grade REST + WebSocket API** using Express and TypeScript strict mode — from zero to a live deployed application that passes an AI code review by Codex.

Every chapter feeds directly into the **TaskFlow** capstone: a team task-management API with auth, real-time updates, background jobs, file storage, and full observability.

---

## Final Goals

| Goal | Definition of Done |
|------|--------------------|
| **Live deployment** | TaskFlow API running on Railway with PostgreSQL + Redis, accessible via public URL |
| **Pass Codex review** | Zero `any`, zero unhandled promises, all inputs validated, auth on every protected route, >70% test coverage, Docker build green |

---

## Curriculum Map

### Phase 1 — Express Foundations with TypeScript (Ch 1–6)

| # | Chapter | Key Skill |
|---|---------|-----------|
| 1 | Setup & Tooling | tsconfig strict, tsx/nodemon, Docker Compose for local dev |
| 2 | Routing & Typed Request/Response | `RequestHandler`, typed `req.body`, `req.params`, `req.query` |
| 3 | Middleware Pipeline | Typed middleware, `NextFunction`, order matters |
| 4 | Request Validation with Zod | Parse-before-use, typed body/params/query, custom error messages |
| 5 | Error Handling | `AppError` class, typed error middleware, HTTP status mapping |
| 6 | Typed Environment Config | `zod.parse(process.env)`, never trust raw env |

### Phase 2 — Core Backend Patterns (Ch 7–12)

| # | Chapter | Key Skill |
|---|---------|-----------|
| 7 | REST API Design | Typed response envelopes, status codes, pagination |
| 8 | Authentication — JWT | Typed JWT payloads, access + refresh tokens, middleware guard |
| 9 | Authorization — RBAC | Branded `UserId`/`RoleId`, permission checks, route guards |
| 10 | Database Layer — Prisma | Typed models, migrations, seeding, query patterns |
| 11 | Repository + Service Pattern | `BaseRepository<T>`, `Result<T, E>`, business logic isolation |
| 12 | File Uploads | `multer` typed, S3/local storage, cleanup on error |

### Phase 3 — Production Patterns (Ch 13–18)

| # | Chapter | Key Skill |
|---|---------|-----------|
| 13 | Structured Logging — Pino | Typed log shapes, correlation IDs, request logging middleware |
| 14 | Security Hardening | `helmet`, rate limiting, CORS typed config, input sanitisation |
| 15 | Testing Express | Vitest + Supertest, typed test helpers, integration vs unit |
| 16 | API Versioning | Typed router factories, `v1/v2` strategy, deprecation headers |
| 17 | Real-Time — Socket.io | Typed events, rooms, auth on WS connections |
| 18 | Caching — Redis | `ioredis` typed client, cache-aside, TTL strategy |

### Phase 4 — Advanced & Production-Ready (Ch 19–26)

| # | Chapter | Key Skill |
|---|---------|-----------|
| 19 | OpenAPI Docs | `zod-to-openapi`, auto-generated Swagger UI |
| 20 | Dependency Injection | TSyringe containers, typed tokens, testability |
| 21 | Event-Driven Internals | Typed `EventEmitter`, domain events, decoupled modules |
| 22 | Docker — Dev to Production | Multi-stage builds, Compose dev/prod, health checks, volumes |
| 23 | Performance | Profiling, connection pooling, N+1 detection, query optimisation |
| 24 | Background Jobs — BullMQ | Typed job definitions, retry strategy, dead-letter queue |
| 25 | Database Scaling | Read replicas, typed `PrismaClient` extensions, connection pools |
| 26 | Capstone: Live Deploy + Codex Review | Railway deploy, env secrets, Codex review checklist & fixes |

---

## Running Exercises

```bash
# Install tsx globally
npm install -g tsx

# Run a chapter exercise from the express/ directory
tsx exercises/chapter_01.ts

# Run with watch mode (for iterative development)
tsx watch exercises/chapter_01.ts
```

## Docker Local Dev (start here in Ch 1)

```bash
# From express/ directory — spins up postgres + redis
docker compose up -d

# Tear down (keeps volumes)
docker compose stop

# Full reset including data
docker compose down -v
```

---

## TypeScript Conventions (enforced throughout)

```typescript
// strict: true in every tsconfig — no exceptions

// Prefer interfaces for objects, types for unions
interface Task { id: TaskId; title: string; status: TaskStatus }
type TaskStatus = "todo" | "in_progress" | "done" | "cancelled";

// Branded types prevent ID mixups
type TaskId    = number & { readonly __brand: "TaskId" };
type ProjectId = number & { readonly __brand: "ProjectId" };

// Result pattern — never throw in business logic
type Result<T, E = AppError> =
  | { ok: true;  value: T }
  | { ok: false; error: E };

// import type for type-only imports
import type { Request, Response, NextFunction } from "express";

// Typed RequestHandler — always specify all generics
type AuthedHandler = RequestHandler<
  Record<string, string>,  // params
  ApiResponse<unknown>,    // response body
  unknown,                 // request body
  Record<string, string>   // query
>;
```

---

## Codex Review Criteria (final gate)

Your TaskFlow code must pass all of these before the course is complete:

1. `strict: true` — zero `any`, zero `@ts-ignore`
2. All inputs validated at the HTTP boundary with Zod before use
3. No raw SQL — Prisma typed queries only
4. No unhandled promise rejections — every async route wrapped
5. Auth middleware applied to every protected route
6. Zero hardcoded secrets — all from typed env config
7. No N+1 queries — use Prisma `include` or batch where needed
8. Test coverage ≥ 70% (Vitest reports this)
9. `docker build` passes on a clean machine
10. API responds correctly at all documented OpenAPI endpoints
