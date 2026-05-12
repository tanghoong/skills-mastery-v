/**
 * Chapter 22 — Typed Environment Variables
 *
 * Type-check: npx tsc --noEmit --strict exercises/chapter_22.tsx
 * Run:        tsx exercises/chapter_22.tsx
 */

import { z } from "zod";

// =============================================================================
// EXERCISE 1 — Vite env declaration
// =============================================================================
// TODO: Complete the ImportMetaEnv augmentation for DevLink's env vars.
//       (In a real Vite project this goes in vite-env.d.ts — here we define it inline)

interface DevLinkEnv {
  readonly VITE_API_URL:        string;     // required
  readonly VITE_APP_NAME:       string;     // required
  readonly VITE_ENABLE_AI_BIO:  string;     // required, "true" | "false"
  readonly VITE_ANTHROPIC_KEY?: string;     // optional
  readonly VITE_SENTRY_DSN?:    string;     // optional
  readonly MODE: "development" | "production" | "test";
  readonly DEV:  boolean;
  readonly PROD: boolean;
}

// =============================================================================
// EXERCISE 2 — Zod env schema
// =============================================================================
// TODO: Define `envSchema` with Zod matching `DevLinkEnv`:
//   - VITE_API_URL:        string().url()
//   - VITE_APP_NAME:       string().min(1)
//   - VITE_ENABLE_AI_BIO:  string().transform(v => v === "true").default("false")
//   - VITE_ANTHROPIC_KEY:  string().optional()
//   - VITE_SENTRY_DSN:     string().url().optional()
//   - MODE:                enum(["development", "production", "test"]).default("development")
//   - DEV:                 boolean().default(true)
//   - PROD:                boolean().default(false)

export const envSchema = z.object({
  // TODO
});

export type ValidatedEnv = z.infer<typeof envSchema>;

// =============================================================================
// EXERCISE 3 — Env validation with error reporting
// =============================================================================
// TODO: Implement `validateEnv(raw: Record<string, unknown>): ValidatedEnv`
//   - Uses envSchema.safeParse
//   - On failure: throws an Error with message listing all field errors
//     Format: "Invalid env vars:\n  FIELD: error message"
//   - On success: returns the validated data

function validateEnv(raw: Record<string, unknown>): ValidatedEnv {
  // TODO
  return envSchema.parse(raw);
}

// =============================================================================
// EXERCISE 4 — Feature flags from env
// =============================================================================
// TODO: Define interface `FeatureFlags` with:
//   - aiBio:     boolean
//   - analytics: boolean  (true if VITE_SENTRY_DSN is set)
//   - devMode:   boolean  (true in development)
//
// TODO: Implement `buildFeatureFlags(env: ValidatedEnv): FeatureFlags`

interface FeatureFlags {
  // TODO
}

function buildFeatureFlags(env: ValidatedEnv): FeatureFlags {
  // TODO
  return {} as FeatureFlags;
}

// =============================================================================
// EXERCISE 5 — Env var documentation generator
// =============================================================================
// TODO: Implement `generateEnvDocs(schema: z.ZodObject<z.ZodRawShape>): string`
//   Returns a .env.example-style string listing all keys with their types.
//   Format:
//   ```
//   # VITE_API_URL (required): string
//   VITE_API_URL=
//   # VITE_APP_NAME (required): string
//   VITE_APP_NAME=
//   # VITE_ENABLE_AI_BIO (optional, default: false): boolean
//   VITE_ENABLE_AI_BIO=false
//   ```

function generateEnvDocs(schema: z.ZodObject<z.ZodRawShape>): string {
  const lines: string[] = [];
  for (const [key, value] of Object.entries(schema.shape)) {
    const isOptional = value instanceof z.ZodOptional || value instanceof z.ZodDefault;
    const typeName = value instanceof z.ZodDefault
      ? value._def.innerType.constructor.name.replace("Zod", "").toLowerCase()
      : value instanceof z.ZodOptional
        ? value._def.innerType.constructor.name.replace("Zod", "").toLowerCase()
        : value.constructor.name.replace("Zod", "").toLowerCase();

    const required = isOptional ? "optional" : "required";
    lines.push(`# ${key} (${required}): ${typeName}`);
    lines.push(`${key}=`);
  }
  return lines.join("\n");
}

// =============================================================================
// VERIFICATION
// =============================================================================

function verify(): void {
  // Exercise 2 — schema
  const validRaw = {
    VITE_API_URL:   "https://api.devlink.app",
    VITE_APP_NAME:  "DevLink",
    VITE_ENABLE_AI_BIO: "true",
    MODE: "production",
    DEV:  false,
    PROD: true,
  };

  const parsed = envSchema.safeParse(validRaw);
  console.assert(parsed.success === true,          "Ex2: valid env should parse");
  if (parsed.success) {
    console.assert(parsed.data.VITE_ENABLE_AI_BIO === true, "Ex2: 'true' string → boolean true");
    console.assert(parsed.data.VITE_APP_NAME === "DevLink",  "Ex2: app name preserved");
  }

  // invalid URL
  const badUrl = envSchema.safeParse({ ...validRaw, VITE_API_URL: "not-a-url" });
  console.assert(badUrl.success === false, "Ex2: bad URL should fail");

  // defaults
  const minimal = envSchema.safeParse({
    VITE_API_URL:  "https://api.devlink.app",
    VITE_APP_NAME: "DevLink",
    MODE: "development",
    DEV:  true,
    PROD: false,
  });
  console.assert(minimal.success === true, "Ex2: minimal env with defaults should pass");
  if (minimal.success) {
    console.assert(minimal.data.VITE_ENABLE_AI_BIO === false, "Ex2: default ai bio is false");
  }

  // Exercise 3 — validateEnv
  const valid = validateEnv(validRaw);
  console.assert(valid.VITE_APP_NAME === "DevLink", "Ex3: validateEnv returns data");

  let threw = false;
  try {
    validateEnv({ VITE_API_URL: "bad", VITE_APP_NAME: "" });
  } catch (e) {
    threw = true;
    console.assert(e instanceof Error, "Ex3: should throw Error");
  }
  console.assert(threw, "Ex3: should throw on invalid env");

  // Exercise 4 — feature flags
  const envWithAi = validateEnv({
    ...validRaw,
    VITE_ENABLE_AI_BIO: "true",
    VITE_SENTRY_DSN: "https://sentry.io/dsn",
  });

  const flagsWithAi = buildFeatureFlags(envWithAi);
  console.assert(flagsWithAi.aiBio     === true,  "Ex4: aiBio flag enabled");
  console.assert(flagsWithAi.analytics === true,  "Ex4: analytics enabled when DSN set");
  console.assert(flagsWithAi.devMode   === false, "Ex4: devMode false in production");

  const devEnv = validateEnv({ ...validRaw, MODE: "development", DEV: true, PROD: false });
  const devFlags = buildFeatureFlags(devEnv);
  console.assert(devFlags.devMode === true, "Ex4: devMode true in development");

  console.log("Chapter 22 verification complete ✓");
}

verify();
