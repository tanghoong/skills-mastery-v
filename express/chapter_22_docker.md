# Chapter 22 — Docker: Dev to Production

## Learning Objectives

By the end of this chapter you will be able to:
- Write a production-ready multi-stage Dockerfile
- Build a `docker-compose.yml` for local dev (postgres + redis + api)
- Add a `docker-compose.prod.yml` for production-like local testing
- Configure health checks, graceful shutdown, and non-root users
- Pass the `docker build` Codex review criterion

---

## 22.1 Why Multi-Stage Builds

A single-stage Docker build copies your entire `node_modules` and TypeScript source into the final image — bloating it to 800 MB+. Multi-stage builds compile TypeScript in one stage and copy only the compiled output + production deps into the final image:

```
Stage 1 (builder):  node:20 full + tsx + compile TypeScript → dist/
Stage 2 (runner):   node:20-alpine + production deps + dist/ → 120 MB final image
```

---

## 22.2 Dockerfile

```dockerfile
# Stage 1 — build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first (Docker layer caching — only re-installs if these change)
COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci                        # deterministic install
RUN npx prisma generate           # generate Prisma client

COPY tsconfig.json ./
COPY src ./src/

RUN npm run build                 # tsc → dist/

# Prune dev dependencies
RUN npm prune --production

# Stage 2 — runtime
FROM node:20-alpine AS runner

# Security: run as non-root
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 express

WORKDIR /app

# Copy only what's needed
COPY --from=builder --chown=express:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=express:nodejs /app/dist         ./dist
COPY --from=builder --chown=express:nodejs /app/prisma       ./prisma
COPY --from=builder --chown=express:nodejs /app/package.json ./package.json

USER express

EXPOSE 3000

# Health check — Docker marks container unhealthy if this fails
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "dist/server.js"]
```

---

## 22.3 .dockerignore

```
node_modules
dist
.env
.env.*
*.log
coverage
.git
.gitignore
README.md
docker-compose*.yml
tests
```

Without `.dockerignore`, Docker copies `node_modules` into the build context — slow and unnecessary.

---

## 22.4 docker-compose.yml (Local Dev)

```yaml
version: "3.9"

services:
  postgres:
    image: postgres:16-alpine
    container_name: taskflow-postgres
    environment:
      POSTGRES_USER:     taskflow_user
      POSTGRES_PASSWORD: localpassword
      POSTGRES_DB:       taskflow
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test:     ["CMD-SHELL", "pg_isready -U taskflow_user -d taskflow"]
      interval: 5s
      timeout:  5s
      retries:  5

  redis:
    image: redis:7-alpine
    container_name: taskflow-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test:     ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout:  5s
      retries:  5

  # Optional: run the API in Docker during dev
  # Comment out to run API locally with `npm run dev`
  # api:
  #   build: .
  #   env_file: .env
  #   ports:
  #     - "3000:3000"
  #   depends_on:
  #     postgres: { condition: service_healthy }
  #     redis:    { condition: service_healthy }

volumes:
  postgres_data:
  redis_data:
```

In local dev, run only postgres and redis in Docker and the API with `npm run dev` — faster hot reload.

---

## 22.5 docker-compose.prod.yml (Production-Like Testing)

```yaml
version: "3.9"

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER:     "${POSTGRES_USER}"
      POSTGRES_PASSWORD: "${POSTGRES_PASSWORD}"
      POSTGRES_DB:       "${POSTGRES_DB}"
    volumes:
      - postgres_prod_data:/var/lib/postgresql/data
    # No ports exposed — API connects via Docker network only
    healthcheck:
      test:     ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 10s
      timeout:  5s
      retries:  5

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass "${REDIS_PASSWORD}"
    volumes:
      - redis_prod_data:/data
    healthcheck:
      test:     ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 10s
      timeout:  5s
      retries:  5

  api:
    build:
      context: .
      target:  runner       # only the runtime stage
    environment:
      NODE_ENV:   production
      PORT:       3000
      DATABASE_URL: "postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}"
      REDIS_URL:    "redis://:${REDIS_PASSWORD}@redis:6379"
      JWT_ACCESS_SECRET:  "${JWT_ACCESS_SECRET}"
      JWT_REFRESH_SECRET: "${JWT_REFRESH_SECRET}"
    ports:
      - "3000:3000"
    depends_on:
      postgres: { condition: service_healthy }
      redis:    { condition: service_healthy }
    restart: unless-stopped

volumes:
  postgres_prod_data:
  redis_prod_data:
```

```bash
# Test the production build locally
docker compose -f docker-compose.prod.yml up --build

# Run migrations before starting API
docker compose -f docker-compose.prod.yml exec api npx prisma migrate deploy
```

---

## 22.6 Graceful Shutdown

When Docker stops a container, it sends `SIGTERM`. Your server must finish in-flight requests before exiting:

```typescript
// src/server.ts
import { prisma } from "./lib/prisma.js";
import { redis }  from "./lib/redis.js";

const server = httpServer.listen(config.port, () => {
  console.log(`Server on :${config.port}`);
});

async function gracefulShutdown(signal: string): Promise<void> {
  console.log(`Received ${signal}. Graceful shutdown...`);

  // 1. Stop accepting new connections
  server.close(async () => {
    // 2. Close DB + Redis connections
    await prisma.$disconnect();
    await redis.quit();
    console.log("Shutdown complete");
    process.exit(0);
  });

  // 3. Force exit if graceful shutdown takes too long
  setTimeout(() => {
    console.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10_000);
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT",  () => gracefulShutdown("SIGINT"));
```

---

## 22.7 Build & Test Commands

```bash
# Build the image
docker build -t taskflow:local .

# Run and check health
docker run -p 3000:3000 --env-file .env taskflow:local
curl http://localhost:3000/health

# Inspect image size
docker image inspect taskflow:local --format='{{.Size}}' | numfmt --to=iec

# Multi-platform build (for Railway/Fly.io which may run ARM or AMD64)
docker buildx build --platform linux/amd64,linux/arm64 -t taskflow:latest .
```

---

## 22.8 Running Migrations in Production

Never run `migrate dev` in production — it may modify the schema interactively. Use `migrate deploy`:

```bash
# In Railway's build command or a separate job:
npx prisma migrate deploy

# Or in docker-compose.prod.yml, as a one-shot service:
services:
  migrate:
    build: .
    command: ["npx", "prisma", "migrate", "deploy"]
    depends_on:
      postgres: { condition: service_healthy }
    restart: "no"
```

---

## Summary

| Concept | Rule |
|---------|------|
| Multi-stage build | Compile in `builder`, run from `runner` — keeps image small |
| Non-root user | Always run as a non-root user in the `runner` stage |
| `.dockerignore` | Exclude `node_modules`, `.env`, `tests` from build context |
| Health check | `HEALTHCHECK` in Dockerfile — Docker and Railway use it for readiness |
| Graceful shutdown | Handle `SIGTERM` — close DB/Redis before `process.exit(0)` |
| `migrate deploy` | Production-only migration command — never `migrate dev` |

---

## Exercise

Open `exercises/chapter_22.ts` and complete all TODOs.
