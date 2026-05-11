# Chapter 1 — Setup & Tooling

## Learning Objectives

By the end of this chapter you will be able to:
- Bootstrap a TypeScript + Express project with `strict: true` from scratch
- Configure `tsx` and `nodemon` for a fast dev loop
- Run PostgreSQL and Redis locally inside Docker without installing them natively
- Understand the project folder structure used throughout this course
- Write the first typed Express server

---

## 1.1 Why TypeScript Strict Mode Matters

Express ships with JavaScript types added via `@types/express`. Without strict mode, TypeScript lets you ignore `undefined`, use implicit `any`, and skip null checks — all common sources of runtime errors in production APIs.

`strict: true` enables:
- `strictNullChecks` — `req.user` could be `undefined`, you must check
- `noImplicitAny` — every variable must have an inferable or explicit type
- `strictFunctionTypes` — middleware parameter types are checked
- `useUnknownInCatchVariables` — `catch (e)` gives you `unknown`, not `any`

Throughout this course every `tsconfig.json` starts with `strict: true`. There are no exceptions.

---

## 1.2 Project Initialisation

```bash
mkdir taskflow && cd taskflow
npm init -y

# Core dependencies
npm install express
npm install -D typescript tsx nodemon @types/node @types/express

# Initialise tsconfig
npx tsc --init
```

---

## 1.3 tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

Key decisions:
- `NodeNext` module resolution — required for proper ESM/CJS interop in Node 20
- `outDir: dist` — compiled JS goes here, never commit it
- `declaration: true` — generates `.d.ts` files, useful if you ever publish shared packages

---

## 1.4 package.json Scripts

```json
{
  "scripts": {
    "dev": "nodemon --exec tsx src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "typecheck": "tsc --noEmit"
  }
}
```

`tsx` transpiles TypeScript on the fly — no build step in development. `nodemon` watches for file changes and restarts. In production, you compile once with `tsc` and run the compiled JS.

---

## 1.5 First Typed Express Server

```typescript
// src/server.ts
import express, { type Request, type Response } from "express";

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(express.json());

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
```

Run it:
```bash
npm run dev
curl http://localhost:3000/health
```

---

## 1.6 Docker Compose for Local Dev

Every external dependency — PostgreSQL and Redis — runs in Docker. You never install them natively. This means any team member can `docker compose up -d` and have a matching environment in seconds.

```yaml
# docker-compose.yml
version: "3.9"

services:
  postgres:
    image: postgres:16-alpine
    container_name: taskflow-postgres
    environment:
      POSTGRES_USER: taskflow_user
      POSTGRES_PASSWORD: localpassword
      POSTGRES_DB: taskflow
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U taskflow_user -d taskflow"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: taskflow-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  redis_data:
```

```bash
docker compose up -d          # start in background
docker compose ps             # verify both are healthy
docker compose logs postgres  # debug postgres startup issues
docker compose stop           # stop without deleting data
docker compose down -v        # full reset including volumes
```

Why named volumes over bind mounts here? Named volumes are managed by Docker and survive `docker compose stop`. Use `down -v` only when you want to wipe the database and start fresh.

---

## 1.7 Environment Variables — .env.example

```bash
# .env.example — commit this, never commit .env
NODE_ENV=development
PORT=3000

# Database (matches docker-compose.yml)
DATABASE_URL=postgresql://taskflow_user:localpassword@localhost:5432/taskflow

# Redis (matches docker-compose.yml)
REDIS_URL=redis://localhost:6379

# JWT — change these in production
JWT_ACCESS_SECRET=dev-access-secret-change-me
JWT_REFRESH_SECRET=dev-refresh-secret-change-me
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

Add `.env` to `.gitignore` immediately. The actual env parsing with Zod is covered in Chapter 6.

---

## 1.8 Folder Structure

```
taskflow/
├── src/
│   ├── app.ts          ← Express app factory
│   ├── server.ts       ← listen() lives here, nowhere else
│   ├── config/
│   │   └── env.ts      ← only file allowed to read process.env
│   ├── api/
│   │   └── v1/
│   ├── middleware/
│   ├── services/
│   ├── repositories/
│   ├── events/
│   ├── jobs/
│   ├── ws/
│   └── types/
│       └── index.ts
├── prisma/
├── tests/
├── docker-compose.yml
├── Dockerfile          ← added in Ch 22
├── .env.example
├── .env                ← in .gitignore
├── tsconfig.json
└── package.json
```

Why split `app.ts` from `server.ts`? Tests import `app` without starting the HTTP server — this prevents port conflicts and makes tests fast.

---

## 1.9 app.ts vs server.ts Pattern

```typescript
// src/app.ts
import express from "express";

export function createApp() {
  const app = express();
  app.use(express.json());
  // routes, middleware registered here
  return app;
}

// src/server.ts
import { createApp } from "./app.js";

const app = createApp();
const PORT = process.env.PORT ?? 3000;

app.listen(PORT, () => {
  console.log(`Server on :${PORT}`);
});
```

```typescript
// tests/health.test.ts — imports app, never calls listen()
import { createApp } from "../src/app.js";
import request from "supertest";

const app = createApp();
test("GET /health returns 200", async () => {
  const res = await request(app).get("/health");
  expect(res.status).toBe(200);
});
```

---

## Summary

| Concept | Decision |
|---------|----------|
| TypeScript config | `strict: true`, `NodeNext` modules |
| Dev runner | `tsx` (no build step) + `nodemon` (auto-restart) |
| Local services | Docker Compose — postgres + redis as named containers |
| Env vars | `.env` locally, never committed; typed in Ch 6 |
| App factory | `createApp()` in `app.ts` — testable without `listen()` |

---

## Exercise

Open `exercises/chapter_01.ts` and complete all TODOs.
