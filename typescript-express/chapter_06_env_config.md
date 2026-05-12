# Chapter 6 — Typed Environment Config

## Learning Objectives

By the end of this chapter you will be able to:
- Parse and validate all environment variables with Zod at startup
- Ensure the application fails fast if required config is missing
- Access config as a typed object — never as raw `process.env` strings
- Manage different config profiles for dev, test, and production

---

## 6.1 Why Raw process.env Is Dangerous

```typescript
// This compiles and runs — until it doesn't
const port = process.env.PORT;       // string | undefined
app.listen(port);                    // should be number — bug

const jwtSecret = process.env.JWT_ACCESS_SECRET; // could be undefined
jwt.sign(payload, jwtSecret!);       // non-null assertion — runtime crash if unset
```

Three problems:
1. Types lie — every value is `string | undefined`, which you then cast away
2. Missing config is discovered at runtime, often in production, often hours after deploy
3. Config is scattered — `process.env.X` appears everywhere, making it hard to audit

---

## 6.2 The Solution: Zod-Parsed Config at Startup

```typescript
// src/config/env.ts  ← THE ONLY FILE ALLOWED TO READ process.env

import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT:     z.coerce.number().int().positive().default(3000),

  DATABASE_URL:  z.string().url(),
  REDIS_URL:     z.string().url(),

  JWT_ACCESS_SECRET:      z.string().min(32),
  JWT_REFRESH_SECRET:     z.string().min(32),
  JWT_ACCESS_EXPIRES_IN:  z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),

  AWS_S3_BUCKET:          z.string().optional(),
  AWS_ACCESS_KEY_ID:      z.string().optional(),
  AWS_SECRET_ACCESS_KEY:  z.string().optional(),
  AWS_REGION:             z.string().default("us-east-1"),

  LOG_LEVEL: z.enum(["fatal","error","warn","info","debug","trace"]).default("info"),
});

// Parse once at module load — throws immediately if any required var is missing
const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌  Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1); // fail fast — do not start a misconfigured server
}

export const env = parsed.data;

// Derive computed config from raw env
export const config = {
  env:      env.NODE_ENV,
  port:     env.PORT,
  isDev:    env.NODE_ENV === "development",
  isTest:   env.NODE_ENV === "test",
  isProd:   env.NODE_ENV === "production",

  db: {
    url: env.DATABASE_URL,
  },

  redis: {
    url: env.REDIS_URL,
  },

  jwt: {
    accessSecret:     env.JWT_ACCESS_SECRET,
    refreshSecret:    env.JWT_REFRESH_SECRET,
    accessExpiresIn:  env.JWT_ACCESS_EXPIRES_IN,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
  },

  s3: {
    bucket:    env.AWS_S3_BUCKET,
    accessKey: env.AWS_ACCESS_KEY_ID,
    secretKey: env.AWS_SECRET_ACCESS_KEY,
    region:    env.AWS_REGION,
  },

  log: {
    level: env.LOG_LEVEL,
  },
} as const;

export type Config = typeof config;
```

---

## 6.3 Using config Everywhere Else

```typescript
// src/server.ts
import { config } from "./config/env.js";

app.listen(config.port, () => {
  console.log(`Server on :${config.port} [${config.env}]`);
});

// src/lib/jwt.ts
import { config } from "../config/env.js";
import jwt from "jsonwebtoken";

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn,
  });
}
```

No `process.env` outside `env.ts`. This is enforced by the Codex review (criterion 6) and can be linted with the `no-process-env` ESLint rule.

---

## 6.4 Loading .env Files

In development, use `dotenv` to load `.env` into `process.env`:

```bash
npm install dotenv
```

```typescript
// src/config/env.ts — at the very top, before the schema
import "dotenv/config"; // loads .env automatically

// ...rest of env.ts
```

In production (Railway, Fly.io, etc.), env vars are injected directly into the process — no `.env` file exists. `dotenv` handles this gracefully: if no `.env` file is present, it does nothing.

---

## 6.5 Test Environment Config

Tests need a separate config to avoid hitting the real database:

```bash
# .env.test
NODE_ENV=test
DATABASE_URL=postgresql://taskflow_user:localpassword@localhost:5432/taskflow_test
REDIS_URL=redis://localhost:6379/1    # DB 1 instead of 0
JWT_ACCESS_SECRET=test-access-secret-32-characters-min
JWT_REFRESH_SECRET=test-refresh-secret-32-chars-min
```

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    env: {}, // let dotenv pick up .env.test
    setupFiles: ["tests/setup.ts"],
  },
});

// tests/setup.ts
import "dotenv/config"; // loads .env.test when NODE_ENV=test
```

Or use Vitest's built-in `envFile` option:
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    envFile: ".env.test",
  },
});
```

---

## 6.6 Secrets Validation Rules

```typescript
// Good — will reject obviously weak secrets in all environments
JWT_ACCESS_SECRET: z.string().min(32),

// Better — reject weak secrets only in production
JWT_ACCESS_SECRET: z.string().min(
  process.env.NODE_ENV === "production" ? 64 : 16
),

// Pattern validation for specific formats
AWS_ACCESS_KEY_ID: z.string().regex(/^AKIA[0-9A-Z]{16}$/).optional(),
```

The rule: secrets that are `optional()` mean the feature is disabled when the secret is absent. Features that require a secret should make it required.

---

## 6.7 Docker Compose env Integration

```yaml
# docker-compose.yml — pass env vars from .env to the app container
services:
  api:
    build: .
    env_file:
      - .env        # loaded from local .env file
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
```

For `docker-compose.prod.yml`, never use `env_file` — inject via Railway or other secrets manager.

---

## 6.8 Anti-Patterns to Avoid

```typescript
// WRONG — process.env scattered everywhere
const secret = process.env.JWT_SECRET ?? "fallback"; // fallback masks missing config
jwt.sign(payload, secret);

// WRONG — non-null assertion without validation
const url = process.env.DATABASE_URL!; // crashes if missing

// WRONG — type cast without parsing
const port = process.env.PORT as unknown as number; // still a string at runtime

// CORRECT — single typed config object
import { config } from "../config/env.js";
jwt.sign(payload, config.jwt.accessSecret); // typed, validated, never undefined
```

---

## Summary

| Concept | Rule |
|---------|------|
| Single parse point | Only `src/config/env.ts` reads `process.env` |
| Fail fast | `process.exit(1)` if validation fails — before `listen()` |
| `z.coerce.number()` | PORT comes in as a string — always coerce |
| `.env.test` | Separate test database and redis DB index |
| No fallback secrets | `?? "fallback"` masks missing config — always use `z.string().min(N)` |

---

## Exercise

Open `exercises/chapter_06.ts` and complete all TODOs.
