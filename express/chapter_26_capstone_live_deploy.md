# Chapter 26 — Capstone: Live Deployment + Codex Code Review

## Learning Objectives

By the end of this chapter you will be able to:
- Deploy TaskFlow API to Railway with PostgreSQL and Redis
- Manage production secrets safely
- Run the full Codex review checklist and fix each finding
- Verify the API at every documented endpoint
- Graduate as a production-ready Express + TypeScript engineer

---

## 26.1 Pre-Deployment Checklist

Before deploying, verify locally:

```bash
# 1. TypeScript compiles clean
npm run typecheck

# 2. All tests pass with coverage ≥ 70%
npm run test:coverage

# 3. Docker build succeeds
docker build -t taskflow:release .

# 4. Docker run is healthy
docker run -p 3000:3000 --env-file .env taskflow:release
curl http://localhost:3000/health

# 5. Production-like compose works
docker compose -f docker-compose.prod.yml up --build -d
npx prisma migrate deploy
curl http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@test.com","password":"password123"}'
docker compose -f docker-compose.prod.yml down
```

All of these must pass before deploying.

---

## 26.2 Railway Setup

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Create a new project
railway init

# Add PostgreSQL plugin
railway plugin add postgresql

# Add Redis plugin
railway plugin add redis
```

Railway automatically injects `DATABASE_URL` and `REDIS_URL` when you add plugins.

---

## 26.3 Setting Production Secrets

```bash
# Never put these in code or .env files committed to git
railway variables set JWT_ACCESS_SECRET="$(openssl rand -base64 64)"
railway variables set JWT_REFRESH_SECRET="$(openssl rand -base64 64)"
railway variables set AWS_S3_BUCKET="your-s3-bucket"
railway variables set AWS_ACCESS_KEY_ID="AKIA..."
railway variables set AWS_SECRET_ACCESS_KEY="..."
railway variables set AWS_REGION="us-east-1"
railway variables set NODE_ENV="production"
railway variables set LOG_LEVEL="info"

# Verify
railway variables
```

---

## 26.4 Railway Configuration File

```toml
# railway.toml — commit this
[build]
builder = "DOCKERFILE"
dockerfilePath = "./Dockerfile"

[deploy]
startCommand = "node dist/server.js"
healthcheckPath = "/health"
healthcheckTimeout = 30
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3
```

---

## 26.5 Deploy

```bash
# Push to Railway
railway up

# Watch logs
railway logs

# Open the URL
railway open

# Run migrations on the production database
railway run npx prisma migrate deploy

# Optional: run seed (only for initial setup)
railway run npx prisma db seed
```

---

## 26.6 Verify the Live API

```bash
# Set BASE_URL to your Railway URL
BASE_URL="https://taskflow-api.up.railway.app"

# Health check
curl $BASE_URL/health
# Expected: {"status":"ok","timestamp":"..."}

# Register a user
curl -X POST $BASE_URL/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Charlie","email":"charlie@example.com","password":"securepassword123"}'

# Login and get access token
TOKEN=$(curl -s -X POST $BASE_URL/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"charlie@example.com","password":"securepassword123"}' \
  | jq -r '.data.accessToken')

# Create an org
curl -X POST $BASE_URL/api/v1/orgs \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"My Org","slug":"my-org"}'

# View API docs
open $BASE_URL/api-docs
```

---

## 26.7 Codex Code Review — Running the Review

Submit your codebase to Codex (GitHub Copilot code review or OpenAI Codex API) with this prompt:

```
Review this TypeScript Express API codebase for:
1. TypeScript strict mode compliance — flag any `any`, `@ts-ignore`, or type assertions without explanation
2. Unhandled async errors — route handlers that don't use asyncHandler or try/catch
3. Missing input validation — routes that access req.body/params/query without Zod validation
4. Hardcoded secrets or process.env access outside config/env.ts
5. Missing authentication on routes that should be protected
6. N+1 database query patterns
7. Mass assignment vulnerabilities — spreading req.body directly into DB calls
8. Missing error handling for external service failures (S3, Redis, BullMQ)

For each finding, specify: file path, line number, severity (critical/high/medium/low), and recommended fix.
```

---

## 26.8 Codex Review — Common Findings and Fixes

### Finding 1: Raw async route without asyncHandler

```
src/api/v1/tasks/tasks.router.ts:34 [CRITICAL]
router.get("/", async (req, res) => { ... })
Missing asyncHandler wrapper — unhandled promise rejection will crash process
```

Fix:
```typescript
router.get("/", asyncHandler(async (req, res) => { ... }));
```

### Finding 2: process.env access outside env.ts

```
src/lib/jwt.ts:12 [HIGH]
const secret = process.env.JWT_SECRET ?? "default";
process.env accessed outside config/env.ts; fallback "default" masks missing config
```

Fix:
```typescript
import { config } from "../config/env.js";
const secret = config.jwt.accessSecret; // always defined, validated at startup
```

### Finding 3: Missing validation on PATCH body

```
src/api/v1/tasks/tasks.router.ts:67 [HIGH]
router.patch("/:taskId", asyncHandler(async (req, res) => {
  await taskService.update(req.params.taskId, req.body, ...); // req.body unvalidated
```

Fix:
```typescript
router.patch(
  "/:taskId",
  validate({ params: TaskParamsSchema, body: UpdateTaskSchema }),
  asyncHandler(async (req, res) => { ... })
);
```

### Finding 4: N+1 query in loop

```
src/services/task.service.ts:89 [HIGH]
for (const task of tasks) {
  const user = await prisma.user.findUnique(...); // N queries
```

Fix:
```typescript
const tasks = await prisma.task.findMany({
  where,
  include: { assignee: { select: { id: true, name: true } } }, // 1 query
});
```

### Finding 5: type assertion hiding a bug

```
src/middleware/authenticate.ts:22 [MEDIUM]
const payload = jwt.verify(token, secret) as JwtAccessPayload;
Unchecked type assertion — verify() can return string in some configurations
```

Fix:
```typescript
const raw = jwt.verify(token, secret);
if (typeof raw === "string") throw new UnauthorizedError("Invalid token format");
const payload = raw as JwtAccessPayload;
// Then validate individual fields
```

---

## 26.9 Final Codex Compliance Checklist

Go through each item manually before considering the course complete:

- [ ] `tsc --noEmit` → 0 errors
- [ ] `eslint --max-warnings 0` → 0 warnings (with `@typescript-eslint/no-explicit-any`)
- [ ] Grep for `process.env` outside `src/config/env.ts` → 0 results
- [ ] Grep for `any` in `src/` → 0 results (excluding type assertion comments)
- [ ] Grep for `asyncHandler` on every async route → 100% coverage
- [ ] Every route in `v1Router` that is not auth has `authenticate` before it
- [ ] Every route with a body or params has `validate()` before the handler
- [ ] `vitest run --coverage` → all thresholds green
- [ ] `docker build -t taskflow:final .` → exits 0
- [ ] `GET /health` on Railway → `{"status":"ok"}`
- [ ] `GET /api-docs` on Railway → Swagger UI loads
- [ ] All auth flow: register → login → refresh → logout → confirm token invalid

---

## 26.10 What You Have Built

At this point you have shipped:

| Layer | Technology | What it does |
|-------|-----------|-------------|
| HTTP API | Express + TypeScript | 30+ typed endpoints, versioned |
| Auth | JWT + bcrypt + Redis | Access/refresh tokens, rotation |
| Database | Prisma + PostgreSQL | Typed queries, migrations, replicas |
| Cache | Redis + ioredis | Cache-aside, session storage |
| Real-time | Socket.io | Live task updates, typed events |
| Background | BullMQ + Redis | Email, notifications, reminders |
| Files | multer + S3 | Typed upload middleware, secure URLs |
| Docs | OpenAPI + Swagger UI | Auto-generated from Zod schemas |
| Observability | Pino + correlation IDs | Structured JSON logs |
| Security | Helmet + CORS + rate-limit | OWASP Top 10 coverage |
| Testing | Vitest + Supertest | Integration + unit, ≥70% coverage |
| Deployment | Docker + Railway | Multi-stage image, prod secrets |

This is a production-grade API. You built it from a blank TypeScript file, one chapter at a time.

---

## Congratulations

You have completed the **Express + TypeScript Mastery** course.

Your TaskFlow API is:
- ✅ Live on Railway
- ✅ Fully typed — zero `any`
- ✅ Secure — OWASP Top 10 addressed
- ✅ Observable — structured logs, correlation IDs
- ✅ Tested — ≥70% coverage
- ✅ Reviewed — Codex approved

The patterns you applied here — layered architecture, typed boundaries, validation at the edge, event-driven decoupling, background jobs — are the patterns that separate production Express from tutorial Express. They apply to every Node.js API you build from here on.
