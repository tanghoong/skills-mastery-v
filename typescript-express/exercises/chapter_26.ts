/**
 * Chapter 26 — Capstone: Live Deploy + Codex Review
 *
 * Run: tsx exercises/chapter_26.ts
 *
 * These exercises simulate the Codex review checklist — identifying and fixing
 * common issues in Express + TypeScript codebases.
 */

// =============================================================================
// EXERCISE 1 — Codex review: fix the unsafe route handlers
// =============================================================================
// The following route handlers have issues flagged by Codex.
// TODO: Rewrite each to fix the problem. Describe the issue in a comment above.

// PROBLEM: ?
// FIX: Wrap in asyncHandler
export const brokenAsyncRoute = async (req: any, res: any) => {
  const data = await someAsyncOperation(); // if this throws, the server crashes
  res.json(data);
};

// TODO: Write the fixed version of brokenAsyncRoute
// It should wrap the async function to forward errors to next()
export function fixedAsyncRoute(someAsyncOperation: () => Promise<unknown>) {
  // TODO: return a middleware that calls someAsyncOperation and catches errors
  return async (req: any, res: any, next: any) => {
    // TODO
  };
}

async function someAsyncOperation() { return {}; }

// =============================================================================
// EXERCISE 2 — Fix mass assignment vulnerability
// =============================================================================
// TODO: Fix this route — currently spreads raw req.body into the DB call
//       Create an `allowedUpdateFields` array and only pick those fields

const ALLOWED_UPDATE_FIELDS = ["title", "status", "priority", "assigneeId", "dueDate"] as const;
type AllowedUpdateField = typeof ALLOWED_UPDATE_FIELDS[number];

// TODO: Implement `sanitiseUpdateBody(body: Record<string, unknown>): Partial<Record<AllowedUpdateField, unknown>>`
//       Only keeps fields in ALLOWED_UPDATE_FIELDS

export function sanitiseUpdateBody(body: Record<string, unknown>): Partial<Record<AllowedUpdateField, unknown>> {
  // TODO
  return {};
}

// =============================================================================
// EXERCISE 3 — Fix untyped process.env access
// =============================================================================
// TODO: These functions read process.env directly — refactor to use a typed config object
//
// First: define `AppSecrets` interface with: jwtSecret (string), dbUrl (string), redisUrl (string)
// Then: implement `loadSecrets(): AppSecrets` that reads and validates them

export interface AppSecrets {
  // TODO
}

export function loadSecrets(): AppSecrets {
  // TODO: read from process.env, throw descriptive errors for missing values
  return {} as AppSecrets;
}

// =============================================================================
// EXERCISE 4 — Codex checklist runner
// =============================================================================
// TODO: Define `CodexCheck` interface:
//       { id: string; description: string; severity: "critical" | "high" | "medium" | "low"; passed: boolean; finding?: string }
//
// TODO: Implement `runCodexChecklist(codebaseSnapshot: {
//         hasAnyTypes:        boolean;
//         hasUnhandledAsync:  boolean;
//         hasHardcodedSecrets: boolean;
//         hasUnvalidatedInput: boolean;
//         testCoverage:       number;
//         dockerBuildPasses:  boolean;
//         healthEndpointWorks: boolean;
//       }): CodexCheck[]`
//
//       Returns an array of checks, each with passed=true/false based on the snapshot.

export interface CodexCheck {
  // TODO
}

export function runCodexChecklist(snapshot: {
  hasAnyTypes:         boolean;
  hasUnhandledAsync:   boolean;
  hasHardcodedSecrets: boolean;
  hasUnvalidatedInput: boolean;
  testCoverage:        number;
  dockerBuildPasses:   boolean;
  healthEndpointWorks: boolean;
}): CodexCheck[] {
  // TODO: create checks for:
  //   1. No `any` types (critical)
  //   2. All async routes handled (critical)
  //   3. No hardcoded secrets (critical)
  //   4. All inputs validated (high)
  //   5. Coverage >= 70% (high) — note the actual threshold in the finding
  //   6. Docker build passes (high)
  //   7. Health endpoint works (medium)
  return [];
}

// =============================================================================
// EXERCISE 5 — Deployment readiness score
// =============================================================================
// TODO: Implement `deploymentReadinessScore(checks: CodexCheck[]): { score: number; grade: string; blockers: CodexCheck[] }`
//       Score: (passed critical + high checks) / total critical + high checks * 100
//       grade: "A" (>=90), "B" (>=80), "C" (>=70), "D" (>=60), "F" (<60)
//       blockers: checks with severity "critical" or "high" that failed

export function deploymentReadinessScore(checks: CodexCheck[]): {
  score:    number;
  grade:    string;
  blockers: CodexCheck[];
} {
  // TODO
  return { score: 0, grade: "F", blockers: [] };
}

// =============================================================================
// EXERCISE 6 — Railway environment validator
// =============================================================================
// TODO: Implement `validateRailwayEnv(env: Record<string, string | undefined>): { valid: boolean; errors: string[] }`
//       Required Railway env vars:
//       - DATABASE_URL (injected by Railway postgres plugin)
//       - REDIS_URL (injected by Railway redis plugin)
//       - NODE_ENV must be "production"
//       - JWT_ACCESS_SECRET must be present and length >= 32
//       - JWT_REFRESH_SECRET must be present and length >= 32

export function validateRailwayEnv(env: Record<string, string | undefined>): { valid: boolean; errors: string[] } {
  // TODO
  return { valid: true, errors: [] };
}

// =============================================================================
// VERIFICATION
// =============================================================================

async function verify(): Promise<void> {
  // Exercise 1 — fixed async route
  const errors: unknown[] = [];
  const handler = fixedAsyncRoute(async () => { throw new Error("DB failed"); });
  await handler({}, {}, (err: unknown) => errors.push(err));
  console.assert(errors.length === 1,                "Ex1: error should be forwarded to next");
  console.assert(errors[0] instanceof Error,         "Ex1: forwarded as Error");

  const successHandler = fixedAsyncRoute(async () => ({ ok: true }));
  let responded = false;
  await successHandler({}, { json: () => { responded = true; } }, () => {});
  console.assert(responded, "Ex1: should call res.json on success");

  // Exercise 2 — sanitiseUpdateBody
  const body = { title: "new", status: "DONE", role: "owner", passwordHash: "leaked", assigneeId: 42 };
  const clean = sanitiseUpdateBody(body);
  console.assert("title"       in clean, "Ex2: title should be kept");
  console.assert("status"      in clean, "Ex2: status should be kept");
  console.assert("assigneeId"  in clean, "Ex2: assigneeId should be kept");
  console.assert(!("role"         in clean), "Ex2: role should be removed");
  console.assert(!("passwordHash" in clean), "Ex2: passwordHash should be removed");

  // Exercise 4 — Codex checklist
  const goodSnapshot = {
    hasAnyTypes:         false,
    hasUnhandledAsync:   false,
    hasHardcodedSecrets: false,
    hasUnvalidatedInput: false,
    testCoverage:        85,
    dockerBuildPasses:   true,
    healthEndpointWorks: true,
  };
  const goodChecks = runCodexChecklist(goodSnapshot);
  console.assert(goodChecks.length >= 5,                     "Ex4: should have at least 5 checks");
  console.assert(goodChecks.every((c) => c.passed),          "Ex4: all checks should pass");

  const badSnapshot = { ...goodSnapshot, hasAnyTypes: true, testCoverage: 50, dockerBuildPasses: false };
  const badChecks = runCodexChecklist(badSnapshot);
  const failedChecks = badChecks.filter((c) => !c.passed);
  console.assert(failedChecks.length >= 3,                   "Ex4: should find at least 3 failures");
  console.assert(failedChecks.some((c) => c.severity === "critical"), "Ex4: critical check should fail");

  // Exercise 5 — readiness score
  const result = deploymentReadinessScore(goodChecks);
  console.assert(result.score >= 90,     "Ex5: perfect snapshot should score >= 90");
  console.assert(result.grade === "A",   "Ex5: perfect snapshot should get grade A");
  console.assert(result.blockers.length === 0, "Ex5: no blockers");

  const badResult = deploymentReadinessScore(badChecks);
  console.assert(badResult.score < 100,       "Ex5: bad snapshot should score < 100");
  console.assert(badResult.blockers.length > 0, "Ex5: should have blockers");

  // Exercise 6 — Railway env validation
  const goodEnv = {
    DATABASE_URL:       "postgresql://...",
    REDIS_URL:          "redis://...",
    NODE_ENV:           "production",
    JWT_ACCESS_SECRET:  "a".repeat(32),
    JWT_REFRESH_SECRET: "b".repeat(32),
  };
  const validResult = validateRailwayEnv(goodEnv);
  console.assert(validResult.valid === true,              "Ex6: valid env should pass");
  console.assert(validResult.errors.length === 0,         "Ex6: no errors on valid env");

  const badEnv = { NODE_ENV: "development", JWT_ACCESS_SECRET: "short" };
  const invalidResult = validateRailwayEnv(badEnv);
  console.assert(invalidResult.valid === false,           "Ex6: invalid env should fail");
  console.assert(invalidResult.errors.length >= 3,        "Ex6: multiple errors");
  console.assert(invalidResult.errors.some((e) => e.includes("DATABASE_URL")), "Ex6: DATABASE_URL error");
  console.assert(invalidResult.errors.some((e) => e.includes("NODE_ENV") || e.includes("production")), "Ex6: NODE_ENV error");

  console.log("Chapter 26 verification complete ✓");
  console.log("\n🎉 ALL EXERCISES COMPLETE — Ready for live deployment and Codex review!");
}

verify();
