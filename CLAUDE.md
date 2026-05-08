# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Purpose

This is a personal skills-mastery learning repository. The primary track is a **25-chapter TypeScript curriculum** with theory chapters, hands-on exercises, and a capstone portfolio project called **DevLog**. Claude's role here is **teacher and coach** — explain concepts clearly, review exercises, and guide the learner through building real-world TypeScript skills.

## Repository Layout

```
typescript/
  chapter_N_topic.md        ← Theory chapters (read these first)
  TYPESCRIPT_MASTERY_OVERVIEW.md  ← Full curriculum map + ecosystem overview
  DEVLOG_SERVER_SPEC.md     ← DevLog deployment & infrastructure guide
  exercises/
    chapter_NN.ts           ← One exercise file per chapter (fill in TODOs)
    README.md               ← Progress tracker & workflow instructions
CHARLIE_LOCAL/              ← Local notes and project context
```

## Running Exercises

```bash
# Preferred — no tsconfig needed
npm install -g tsx
tsx typescript/exercises/chapter_01.ts

# Alternative
npm install -g ts-node typescript
npx ts-node typescript/exercises/chapter_01.ts
```

## Exercise Review Workflow

When the learner says "review my chapter N exercise" (and pastes or opens the file), check:
1. **Correctness** — does the implementation satisfy the TODO requirements?
2. **Type safety** — are types explicit where needed, inferred where safe? No `any`?
3. **Style** — idiomatic TypeScript (prefer `interface` for objects, `type` for unions)?
4. **Improvements** — suggest tighter types, better patterns, or relevant concepts from the chapter

## Curriculum Phases

| Phase | Chapters | Focus |
|-------|----------|-------|
| 1 — Language Core | 1–8 | Primitives, generics, classes, mapped/conditional types |
| 2 — Advanced TypeScript | 9–17 | Async, decorators, error handling, real-world architecture |
| 3 — Ecosystem | 18–25 | React, Next.js, NestJS, Prisma, tRPC, testing, AI integration |

## Portfolio Project — DevLog

The capstone project is an **AI-Powered Developer Journal** that covers every phase. Architecture:

```
devlog/
├── apps/
│   ├── web/      ← Next.js 15 (App Router)
│   ├── mobile/   ← Expo React Native
│   └── api/      ← NestJS
├── packages/
│   ├── database/ ← Prisma schema + generated types
│   ├── trpc/     ← Shared end-to-end typed router
│   └── types/    ← Branded types, shared interfaces
└── tests/        ← Vitest
```

Key architectural patterns used throughout DevLog:
- `Result<T, E>` pattern instead of throwing in business logic (Ch. 14)
- `BaseRepository<T>` abstract class with dependency injection (Ch. 6, 15)
- Branded types (`UserId`, `OrderId`) to prevent ID mixups (Ch. 15, 17)
- tRPC + Zod for end-to-end type safety without REST boilerplate (Ch. 22)
- `async function*` generators for streaming Claude AI responses (Ch. 16, 25)

## TypeScript Conventions in This Repo

```typescript
// Prefer interfaces for objects, types for unions/primitives
interface User { name: string; age: number; }
type Status = "active" | "inactive" | "pending";

// Use `import type` for type-only imports
import type { User } from "./types";

// Use `as const` to derive union types from arrays
const ROLES = ["admin", "user", "guest"] as const;
type Role = typeof ROLES[number];

// Branded types to prevent ID mixups
type UserId  = number & { readonly __brand: "UserId" };

// Result pattern for business logic errors
type Result<T, E = Error> =
    | { success: true;  value: T }
    | { success: false; error: E };
```

Always use `strict: true` in `tsconfig.json`.

## Local Dev Prerequisites

- Node.js 20 LTS (use `nvm`)
- Docker Desktop (for local PostgreSQL when building DevLog)
- `tsx` or `ts-node` for running exercise files

Local PostgreSQL for DevLog development:
```bash
docker run -d --name devlog-db \
  -e POSTGRES_USER=devlog_user \
  -e POSTGRES_PASSWORD=localpassword \
  -e POSTGRES_DB=devlog \
  -p 5432:5432 postgres:16-alpine
```
