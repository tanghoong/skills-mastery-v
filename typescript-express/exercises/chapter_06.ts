/**
 * Chapter 6 — Typed Environment Config
 *
 * Run: tsx exercises/chapter_06.ts
 *
 * Install: npm install zod dotenv
 */

import { z } from "zod";

// =============================================================================
// EXERCISE 1 — Define the EnvSchema
// =============================================================================
// TODO: Define `EnvSchema` using z.object() with ALL of the following fields:
//
//   NODE_ENV:               enum ["development","test","production"], default "development"
//   PORT:                   coerced number, default 3000
//   DATABASE_URL:           string URL (use z.string().url())
//   REDIS_URL:              string URL
//   JWT_ACCESS_SECRET:      string min 16 characters
//   JWT_REFRESH_SECRET:     string min 16 characters
//   JWT_ACCESS_EXPIRES_IN:  string, default "15m"
//   JWT_REFRESH_EXPIRES_IN: string, default "7d"
//   LOG_LEVEL:              enum ["fatal","error","warn","info","debug","trace"], default "info"
//   AWS_S3_BUCKET:          string optional
//   AWS_REGION:             string default "us-east-1"

export const EnvSchema = z.object({
  // TODO
});

export type Env = z.infer<typeof EnvSchema>;

// =============================================================================
// EXERCISE 2 — parseEnv function
// =============================================================================
// TODO: Implement `parseEnv(raw: Record<string, unknown>): Env`
//       - Use EnvSchema.safeParse(raw)
//       - If parsing fails, throw an Error whose message lists the field errors
//         (hint: error.flatten().fieldErrors returns a Record<string, string[]>)
//       - If successful, return the parsed data

export function parseEnv(raw: Record<string, unknown>): Env {
  // TODO
  return {} as Env;
}

// =============================================================================
// EXERCISE 3 — buildConfig from parsed env
// =============================================================================
// TODO: Define `AppConfig` interface with nested groups:
//       - env:    NodeEnv (same as NODE_ENV enum)
//       - port:   number
//       - isDev:  boolean
//       - isTest: boolean
//       - isProd: boolean
//       - db:     { url: string }
//       - redis:  { url: string }
//       - jwt:    { accessSecret, refreshSecret, accessExpiresIn, refreshExpiresIn }
//       - log:    { level: string }
//       - s3:     { bucket?: string; region: string }
//
// TODO: Implement `buildConfig(env: Env): AppConfig`

type NodeEnv = "development" | "test" | "production";

export interface AppConfig {
  // TODO
}

export function buildConfig(env: Env): AppConfig {
  // TODO
  return {} as AppConfig;
}

// =============================================================================
// EXERCISE 4 — Secret strength validation
// =============================================================================
// TODO: Implement `isSecretStrong(secret: string, minLength: number): boolean`
//       Returns true if:
//       - Length >= minLength
//       - Contains at least one number
//       - Contains at least one uppercase letter
//       - Contains at least one lowercase letter

export function isSecretStrong(secret: string, minLength: number): boolean {
  // TODO
  return false;
}

// =============================================================================
// EXERCISE 5 — Env diff (detect missing vars)
// =============================================================================
// TODO: Implement `findMissingEnvVars(required: string[], actual: Record<string, unknown>): string[]`
//       Returns the names of required env vars that are missing from actual
//       (undefined, null, or empty string count as missing)

export function findMissingEnvVars(
  required: string[],
  actual: Record<string, unknown>
): string[] {
  // TODO
  return [];
}

// =============================================================================
// EXERCISE 6 — Safe env accessor
// =============================================================================
// TODO: Implement `getEnvVar(name: string, fallback?: string): string`
//       - If process.env[name] exists and is non-empty, return it
//       - If fallback is provided, return fallback
//       - Otherwise throw Error: `Environment variable ${name} is not set`

export function getEnvVar(name: string, fallback?: string): string {
  // TODO
  return "";
}

// =============================================================================
// VERIFICATION
// =============================================================================

function verify(): void {
  // Exercise 1 — valid env
  const validEnv = EnvSchema.safeParse({
    DATABASE_URL:       "postgresql://user:pass@localhost:5432/db",
    REDIS_URL:          "redis://localhost:6379",
    JWT_ACCESS_SECRET:  "super-secret-key-16ch",
    JWT_REFRESH_SECRET: "another-secret-16ch!",
  });
  console.assert(validEnv.success,                     "Ex1: valid env should parse");
  console.assert(validEnv.success && validEnv.data.PORT === 3000, "Ex1: PORT should default to 3000");
  console.assert(validEnv.success && validEnv.data.NODE_ENV === "development", "Ex1: NODE_ENV should default");

  // Exercise 1 — missing required fields
  const invalidEnv = EnvSchema.safeParse({});
  console.assert(!invalidEnv.success, "Ex1: missing DATABASE_URL should fail");

  // Exercise 2 — parseEnv throws on failure
  let threw = false;
  try { parseEnv({}); } catch { threw = true; }
  console.assert(threw, "Ex2: parseEnv should throw on invalid env");

  // Exercise 2 — parseEnv returns data on success
  const parsed = parseEnv({
    DATABASE_URL:       "postgresql://u:p@localhost:5432/db",
    REDIS_URL:          "redis://localhost:6379",
    JWT_ACCESS_SECRET:  "sixteen-char-key!",
    JWT_REFRESH_SECRET: "sixteen-char-key!",
  });
  console.assert(parsed.PORT === 3000, "Ex2: PORT should default");
  console.assert(parsed.NODE_ENV === "development", "Ex2: NODE_ENV should default");

  // Exercise 3 — buildConfig
  const config = buildConfig(parsed);
  console.assert(config.isDev  === true,  "Ex3: isDev should be true for development");
  console.assert(config.isProd === false, "Ex3: isProd should be false");
  console.assert(config.port   === 3000,  "Ex3: port should be 3000");
  console.assert(typeof config.db.url === "string",  "Ex3: db.url should be string");
  console.assert(typeof config.jwt.accessSecret === "string", "Ex3: jwt.accessSecret should be string");

  // Exercise 4 — secret strength
  console.assert(isSecretStrong("MySecret1",       8) === true,  "Ex4: strong secret");
  console.assert(isSecretStrong("weak",             8) === false, "Ex4: too short");
  console.assert(isSecretStrong("alllowercase1",   12) === false, "Ex4: no uppercase");
  console.assert(isSecretStrong("ALLUPPERCASE1",   12) === false, "Ex4: no lowercase");
  console.assert(isSecretStrong("NoNumbersHere",   12) === false, "Ex4: no number");

  // Exercise 5 — missing env vars
  const missing = findMissingEnvVars(
    ["DATABASE_URL", "REDIS_URL", "JWT_SECRET"],
    { DATABASE_URL: "postgresql://...", REDIS_URL: "" }
  );
  console.assert(missing.includes("REDIS_URL"),   "Ex5: empty string counts as missing");
  console.assert(missing.includes("JWT_SECRET"),  "Ex5: undefined counts as missing");
  console.assert(!missing.includes("DATABASE_URL"), "Ex5: present var should not be missing");

  // Exercise 6
  process.env["TEST_VAR_CH6"] = "hello";
  console.assert(getEnvVar("TEST_VAR_CH6") === "hello", "Ex6: should return set var");
  console.assert(getEnvVar("MISSING_VAR_CH6", "default") === "default", "Ex6: should use fallback");
  let threw2 = false;
  try { getEnvVar("MISSING_VAR_CH6_NO_FALLBACK"); } catch { threw2 = true; }
  console.assert(threw2, "Ex6: should throw if no var and no fallback");

  console.log("Chapter 6 verification complete ✓");
}

verify();
