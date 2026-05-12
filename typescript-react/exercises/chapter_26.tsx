/**
 * Chapter 26 — Deployment: Vercel + CI
 *
 * Type-check: npx tsc --noEmit --strict exercises/chapter_26.tsx
 * Run:        tsx exercises/chapter_26.tsx
 *
 * These exercises model the deployment configuration and pre-deploy
 * checklist types used in the DevLink release process.
 */

import { z } from "zod";

// =============================================================================
// EXERCISE 1 — Vercel config type
// =============================================================================
// TODO: Define interface `VercelConfig` with:
//   - buildCommand?:    string
//   - outputDirectory?: string
//   - framework?:       "vite" | "nextjs" | "create-react-app" | null
//   - rewrites?:        Array<{ source: string; destination: string }>
//   - headers?:         Array<{ source: string; headers: Array<{ key: string; value: string }> }>
//   - env?:             Record<string, string>

interface VercelConfig {
  // TODO
}

// TODO: Create `devlinkVercelConfig: VercelConfig` for a Vite SPA:
//   - buildCommand: "npm run build"
//   - outputDirectory: "dist"
//   - framework: "vite"
//   - rewrites: [{ source: "/(.*)", destination: "/index.html" }]

const devlinkVercelConfig: VercelConfig = {
  // TODO
};

// =============================================================================
// EXERCISE 2 — CI check definitions
// =============================================================================
// TODO: Define type `CICheck` as a discriminated union:
//   - { type: "typecheck"; command: string }
//   - { type: "test";      command: string; coverageThreshold?: number }
//   - { type: "lint";      command: string }
//   - { type: "build";     command: string; envVars?: Record<string, string> }
//   - { type: "no-any";    path: string }
//
// TODO: Create `devlinkCIChecks: CICheck[]` with all 5 check types for DevLink

type CICheck = never; // replace with discriminated union

const devlinkCIChecks: CICheck[] = [
  // TODO
];

// =============================================================================
// EXERCISE 3 — Deploy checklist
// =============================================================================
// TODO: Define type `ChecklistItem` with:
//   - id:          string
//   - description: string
//   - category:    "types" | "forms" | "auth" | "testing" | "a11y" | "deploy"
//   - required:    boolean
//   - check:       () => boolean | Promise<boolean>  (returns true = pass, false = fail)
//
// TODO: Define `ChecklistResult` as:
//   - { itemId: string; passed: boolean; error?: string }
//
// TODO: Implement `runChecklist(items: ChecklistItem[]): Promise<ChecklistResult[]>`
//   Runs each item's check function and returns results.

interface ChecklistItem {
  // TODO
}

interface ChecklistResult {
  // TODO
}

async function runChecklist(items: ChecklistItem[]): Promise<ChecklistResult[]> {
  // TODO
  return [];
}

// =============================================================================
// EXERCISE 4 — Environment variable diff
// =============================================================================
// When deploying, ensure all required env vars are set.
// TODO: Define `EnvVarSpec` with:
//   - name:     string
//   - required: boolean
//   - environments: Array<"production" | "preview" | "development">
//
// TODO: Implement `checkEnvVarCoverage(specs: EnvVarSpec[], provided: Record<string, string>): { missing: string[]; extra: string[] }`
//   missing: required vars not in provided
//   extra:   vars in provided not in specs

interface EnvVarSpec {
  // TODO
}

function checkEnvVarCoverage(
  specs: EnvVarSpec[],
  provided: Record<string, string>
): { missing: string[]; extra: string[] } {
  // TODO
  return { missing: [], extra: [] };
}

// =============================================================================
// EXERCISE 5 — Package.json scripts validator
// =============================================================================
// TODO: Define `RequiredScript` as:
//   "dev" | "build" | "preview" | "typecheck" | "test" | "lint"
//
// TODO: Implement `validatePackageScripts(scripts: Record<string, string>): { missing: RequiredScript[]; valid: RequiredScript[] }`

type RequiredScript = "dev" | "build" | "preview" | "typecheck" | "test" | "lint";

function validatePackageScripts(scripts: Record<string, string>): {
  missing: RequiredScript[];
  valid:   RequiredScript[];
} {
  // TODO
  return { missing: [], valid: [] };
}

// =============================================================================
// VERIFICATION
// =============================================================================

async function verify(): Promise<void> {
  // Exercise 1 — vercel config
  console.assert(devlinkVercelConfig.framework === "vite",            "Ex1: framework is vite");
  console.assert(devlinkVercelConfig.outputDirectory === "dist",       "Ex1: outputDirectory is dist");
  console.assert(devlinkVercelConfig.rewrites?.length === 1,           "Ex1: one rewrite rule");
  console.assert(devlinkVercelConfig.rewrites?.[0].destination === "/index.html", "Ex1: SPA fallback");

  // Exercise 2 — CI checks
  console.assert(devlinkCIChecks.length === 5, "Ex2: should have 5 CI checks");
  const types = devlinkCIChecks.map((c) => (c as {type: string}).type);
  console.assert(types.includes("typecheck"), "Ex2: has typecheck");
  console.assert(types.includes("test"),      "Ex2: has test");
  console.assert(types.includes("lint"),      "Ex2: has lint");
  console.assert(types.includes("build"),     "Ex2: has build");
  console.assert(types.includes("no-any"),    "Ex2: has no-any");

  // Exercise 3 — runChecklist
  const items: ChecklistItem[] = [
    { id: "types",  description: "Types pass", category: "types",  required: true,  check: () => true },
    { id: "tests",  description: "Tests pass", category: "testing", required: true,  check: () => true },
    { id: "a11y",   description: "A11y pass",  category: "a11y",   required: false, check: () => false },
  ];

  const results = await runChecklist(items);
  console.assert(results.length === 3,          "Ex3: all items run");
  console.assert(results[0].passed === true,    "Ex3: types passed");
  console.assert(results[1].passed === true,    "Ex3: tests passed");
  console.assert(results[2].passed === false,   "Ex3: a11y failed");

  // Exercise 4 — env var coverage
  const specs: EnvVarSpec[] = [
    { name: "VITE_API_URL",       required: true,  environments: ["production"] },
    { name: "VITE_APP_NAME",      required: true,  environments: ["production", "preview"] },
    { name: "VITE_ANTHROPIC_KEY", required: false, environments: ["production"] },
  ];

  const { missing, extra } = checkEnvVarCoverage(specs, {
    VITE_API_URL:  "https://api.devlink.app",
    VITE_EXTRA:    "unexpected",
    // VITE_APP_NAME is missing
  });

  console.assert(missing.includes("VITE_APP_NAME"), "Ex4: VITE_APP_NAME is missing");
  console.assert(extra.includes("VITE_EXTRA"),       "Ex4: VITE_EXTRA is extra");
  console.assert(!missing.includes("VITE_ANTHROPIC_KEY"), "Ex4: optional key not in missing");

  // Exercise 5 — package scripts
  const goodScripts = {
    dev:       "vite",
    build:     "tsc --noEmit && vite build",
    preview:   "vite preview",
    typecheck: "tsc --noEmit",
    test:      "vitest run",
    lint:      "eslint src",
  };

  const { missing: scriptMissing, valid } = validatePackageScripts(goodScripts);
  console.assert(scriptMissing.length === 0, "Ex5: no missing scripts");
  console.assert(valid.length === 6,         "Ex5: all 6 scripts valid");

  const badScripts = { dev: "vite", build: "vite build" };
  const { missing: missing2 } = validatePackageScripts(badScripts);
  console.assert(missing2.includes("typecheck"), "Ex5: typecheck is missing");
  console.assert(missing2.includes("test"),      "Ex5: test is missing");
  console.assert(missing2.includes("lint"),      "Ex5: lint is missing");

  console.log("Chapter 26 verification complete ✓");
}

verify().catch(console.error);
