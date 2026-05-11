/**
 * Chapter 22 — Docker: Dev to Production
 *
 * Run: tsx exercises/chapter_22.ts
 *
 * These exercises focus on Docker config generation and analysis (no real Docker needed).
 */

// =============================================================================
// EXERCISE 1 — .dockerignore generator
// =============================================================================
// TODO: Implement `generateDockerignore(includeTests: boolean): string`
//       Returns the content of a .dockerignore file that excludes:
//       ALWAYS: node_modules, dist, .env, .env.*, *.log, .git, .gitignore
//       If includeTests is true: also exclude tests/, coverage/

export function generateDockerignore(includeTests: boolean): string {
  // TODO
  return "";
}

// =============================================================================
// EXERCISE 2 — Dockerfile stage analyzer
// =============================================================================
// TODO: Define `DockerStage` interface: { name: string; from: string; commands: string[] }
// TODO: Implement `parseDockerfileStages(dockerfile: string): DockerStage[]`
//       Parse a Dockerfile string and extract stages:
//       - Each "FROM ... AS name" starts a new stage
//       - Collect all lines (RUN, COPY, etc.) until the next FROM
//       - Return array of DockerStage

export interface DockerStage {
  // TODO
}

export function parseDockerfileStages(dockerfile: string): DockerStage[] {
  // TODO
  return [];
}

// =============================================================================
// EXERCISE 3 — Docker Compose service validator
// =============================================================================
// TODO: Define `ComposeService` interface:
//       { name: string; image?: string; build?: string; ports?: string[];
//         depends_on?: string[]; healthcheck?: boolean; environment?: Record<string, string> }
//
// TODO: Implement `validateComposeServices(services: ComposeService[]): string[]`
//       Returns validation errors:
//       - A service must have either image or build
//       - A service with depends_on must reference a service that exists in the list
//       - A service named "api" should have a healthcheck
//       - Port format should be "hostPort:containerPort" (both numbers)

export interface ComposeService {
  // TODO
}

export function validateComposeServices(services: ComposeService[]): string[] {
  // TODO
  return [];
}

// =============================================================================
// EXERCISE 4 — Health check config builder
// =============================================================================
// TODO: Define `HealthCheckConfig` interface:
//       { test: string; interval: string; timeout: string; retries: number; startPeriod: string }
//
// TODO: Implement these health check builders:
//       httpHealthCheck(port: number, path: string): HealthCheckConfig
//         test: "wget -qO- http://localhost:{port}{path} || exit 1"
//         interval: "30s", timeout: "5s", retries: 3, startPeriod: "15s"
//
//       postgresHealthCheck(user: string, db: string): HealthCheckConfig
//         test: "pg_isready -U {user} -d {db}"
//         interval: "5s", timeout: "5s", retries: 5, startPeriod: "10s"
//
//       redisHealthCheck(): HealthCheckConfig
//         test: "redis-cli ping"
//         interval: "5s", timeout: "5s", retries: 5, startPeriod: "5s"

export interface HealthCheckConfig {
  // TODO
}

export function httpHealthCheck(port: number, path: string): HealthCheckConfig {
  // TODO
  return {} as HealthCheckConfig;
}

export function postgresHealthCheck(user: string, db: string): HealthCheckConfig {
  // TODO
  return {} as HealthCheckConfig;
}

export function redisHealthCheck(): HealthCheckConfig {
  // TODO
  return {} as HealthCheckConfig;
}

// =============================================================================
// EXERCISE 5 — Graceful shutdown order
// =============================================================================
// TODO: Define `ShutdownStep` interface: { name: string; priority: number; action: string }
// TODO: Implement `buildShutdownSequence(steps: ShutdownStep[]): ShutdownStep[]`
//       Returns steps sorted by priority (lowest number = runs first)
//       Steps with the same priority keep their original order

export interface ShutdownStep {
  // TODO
}

export function buildShutdownSequence(steps: ShutdownStep[]): ShutdownStep[] {
  // TODO (stable sort by priority)
  return steps;
}

// =============================================================================
// VERIFICATION
// =============================================================================

function verify(): void {
  // Exercise 1 — .dockerignore
  const ignoreContent = generateDockerignore(false);
  console.assert(ignoreContent.includes("node_modules"), "Ex1: should exclude node_modules");
  console.assert(ignoreContent.includes(".env"),         "Ex1: should exclude .env");
  console.assert(!ignoreContent.includes("tests/"),      "Ex1: should not exclude tests when false");

  const withTests = generateDockerignore(true);
  console.assert(withTests.includes("tests/"),           "Ex1: should exclude tests when true");
  console.assert(withTests.includes("coverage/"),        "Ex1: should exclude coverage when true");

  // Exercise 2 — Dockerfile stages
  const dockerfile = `
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
CMD ["node", "dist/server.js"]
`.trim();

  const stages = parseDockerfileStages(dockerfile);
  console.assert(stages.length === 2,          "Ex2: should find 2 stages");
  console.assert(stages[0].name === "builder", "Ex2: first stage is builder");
  console.assert(stages[1].name === "runner",  "Ex2: second stage is runner");
  console.assert(stages[0].commands.some((c) => c.includes("npm ci")), "Ex2: builder has npm ci");

  // Exercise 3 — ComposeService validation
  const services: ComposeService[] = [
    { name: "postgres", image: "postgres:16", healthcheck: true },
    { name: "redis",    image: "redis:7",    healthcheck: true },
    { name: "api",      build: ".", depends_on: ["postgres", "redis"], healthcheck: true },
  ];
  const errors = validateComposeServices(services);
  console.assert(errors.length === 0, "Ex3: valid services should have no errors");

  const badServices: ComposeService[] = [
    { name: "broken" }, // no image or build
    { name: "api", build: ".", depends_on: ["missing-service"], healthcheck: false },
  ];
  const badErrors = validateComposeServices(badServices);
  console.assert(badErrors.length >= 2, "Ex3: should find at least 2 errors");
  console.assert(badErrors.some((e) => e.includes("broken")), "Ex3: broken service error");
  console.assert(badErrors.some((e) => e.includes("missing-service") || e.includes("depend")), "Ex3: missing dependency error");

  // Exercise 4 — health checks
  const http = httpHealthCheck(3000, "/health");
  console.assert(http.test.includes("3000"),      "Ex4: http check uses port");
  console.assert(http.test.includes("/health"),   "Ex4: http check uses path");
  console.assert(http.interval === "30s",         "Ex4: http interval");
  console.assert(http.retries  === 3,             "Ex4: http retries");

  const pg = postgresHealthCheck("user", "mydb");
  console.assert(pg.test.includes("user"),        "Ex4: pg check includes user");
  console.assert(pg.test.includes("mydb"),        "Ex4: pg check includes db");

  const redis = redisHealthCheck();
  console.assert(redis.test.includes("ping"),     "Ex4: redis check pings");

  // Exercise 5 — shutdown sequence
  const steps: ShutdownStep[] = [
    { name: "close HTTP",      priority: 1, action: "server.close()" },
    { name: "disconnect Redis", priority: 2, action: "redis.quit()" },
    { name: "disconnect DB",    priority: 2, action: "prisma.$disconnect()" },
    { name: "exit",             priority: 3, action: "process.exit(0)" },
  ];
  const ordered = buildShutdownSequence(steps);
  console.assert(ordered[0].name === "close HTTP", "Ex5: HTTP close should be first");
  console.assert(ordered[3].name === "exit",        "Ex5: exit should be last");
  // Redis and DB both priority 2 — original order preserved
  console.assert(ordered[1].name === "disconnect Redis", "Ex5: Redis before DB (original order)");

  console.log("Chapter 22 verification complete ✓");
}

verify();
