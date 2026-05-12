# Chapter 22 — Typed Environment Variables

## Learning Objectives

By the end of this chapter you will be able to:
- Augment `ImportMetaEnv` to type all `VITE_` variables
- Validate environment variables at startup with Zod
- Understand the difference between build-time and runtime env vars in Vite
- Type env vars safely for both dev and production

---

## 22.1 How Vite Exposes Env Vars

Vite inlines env vars at build time. Only variables prefixed with `VITE_` are exposed to client-side code:

```
VITE_API_URL=https://api.devlink.app    ← exposed to browser code
DATABASE_URL=postgres://...              ← server-only, never exposed
```

Without typing, `import.meta.env` is:
```typescript
interface ImportMeta {
  env: ImportMetaEnv; // all values are string | boolean | undefined
}
```

---

## 22.2 Augmenting `ImportMetaEnv`

Extend the interface in `vite-env.d.ts`:

```typescript
// src/vite-env.d.ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Required — build fails if missing
  readonly VITE_API_URL: string;
  readonly VITE_APP_NAME: string;

  // Optional
  readonly VITE_ANTHROPIC_KEY?: string;
  readonly VITE_SENTRY_DSN?: string;

  // Boolean env vars (Vite parses "true"/"false" strings)
  readonly VITE_ENABLE_AI_BIO: string; // parse to boolean in the config module
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

Now `import.meta.env.VITE_API_URL` is `string`, not `string | undefined`. TypeScript errors if you use an undeclared env var.

---

## 22.3 Zod-Validated Env Module

Type annotations don't validate at runtime — the variable could be missing. Add Zod validation at module load:

```typescript
// src/lib/env.ts
import { z } from "zod";

const envSchema = z.object({
  VITE_API_URL:     z.string().url("VITE_API_URL must be a valid URL"),
  VITE_APP_NAME:    z.string().min(1),
  VITE_ENABLE_AI_BIO: z
    .string()
    .transform((v) => v === "true")
    .default("false"),
  VITE_ANTHROPIC_KEY: z.string().optional(),
  VITE_SENTRY_DSN:    z.string().url().optional(),
});

// Parse once at module load — throws at startup if vars are missing/invalid
const _env = envSchema.safeParse(import.meta.env);

if (!_env.success) {
  console.error("Invalid environment variables:", _env.error.flatten().fieldErrors);
  throw new Error("Missing or invalid environment variables. Check your .env file.");
}

// Export typed and validated env — no raw import.meta.env elsewhere in the app
export const env = _env.data;

// Derived types
export type Env = z.infer<typeof envSchema>;
```

Usage throughout the app:
```typescript
import { env } from "@/lib/env";

// env.VITE_API_URL is string — validated, not `string | undefined`
const apiClient = axios.create({ baseURL: env.VITE_API_URL });
// env.VITE_ENABLE_AI_BIO is boolean — transformed from string
if (env.VITE_ENABLE_AI_BIO) {
  // render AI bio button
}
```

---

## 22.4 `.env` Files — The Vite Hierarchy

Vite loads `.env` files in this order (later files win):

```
.env                    ← all environments
.env.local              ← all environments, local overrides (git-ignored)
.env.development        ← development mode only
.env.development.local  ← development mode, local overrides (git-ignored)
.env.production         ← production mode only
.env.production.local   ← production mode, local overrides (git-ignored)
```

```bash
# .env.example — commit this; document all required vars
VITE_API_URL=http://localhost:3001
VITE_APP_NAME=DevLink
VITE_ENABLE_AI_BIO=false

# .env.local — git-ignored; real values for local dev
VITE_API_URL=http://localhost:3001
VITE_APP_NAME=DevLink (Local)
VITE_ENABLE_AI_BIO=true
VITE_ANTHROPIC_KEY=sk-ant-...
```

Never commit `.env.local` or any file with real secrets.

---

## 22.5 `import.meta.env.MODE` and `import.meta.env.DEV`

Vite provides built-in mode variables:

```typescript
// Built-in — always available, no augmentation needed
import.meta.env.MODE  // "development" | "production" | custom mode string
import.meta.env.DEV   // boolean — true in development
import.meta.env.PROD  // boolean — true in production
import.meta.env.SSR   // boolean — true in SSR context

// Use for environment-specific logic
if (import.meta.env.DEV) {
  console.log("Debug:", payload);
}
```

---

## 22.6 Type-Safe Feature Flags

Feature flags should be validated just like other env vars:

```typescript
// src/lib/featureFlags.ts
import { env } from "./env";

export const featureFlags = {
  aiBio:    env.VITE_ENABLE_AI_BIO,
  analytics: !!env.VITE_SENTRY_DSN,
} as const;

export type FeatureFlag = keyof typeof featureFlags;

// Usage
import { featureFlags } from "@/lib/featureFlags";

function ProfileEditor() {
  return (
    <div>
      <BasicProfileForm />
      {featureFlags.aiBio && <AIBioGenerator />}
    </div>
  );
}
```

---

## Key Takeaways

| Pattern | Rule |
|---------|------|
| `ImportMetaEnv` augmentation | Declare all `VITE_*` vars — TypeScript errors on undeclared ones |
| Zod validation | Validate at startup — catch missing vars before any component renders |
| `env` module | Single import across the app — never access `import.meta.env` directly |
| `.env.example` | Commit this — document all required vars for teammates |
| `.env.local` | Git-ignored — real secrets go here only |
| `import.meta.env.DEV` | Built-in — use for dev-only debug code |
