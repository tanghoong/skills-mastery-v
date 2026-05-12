/**
 * Chapter 1 — Setup & Tooling
 *
 * Run: tsx exercises/chapter_01.ts
 *
 * These exercises build TypeScript types and structures that model
 * the TaskFlow app configuration — no actual server starts here.
 */

// =============================================================================
// EXERCISE 1 — Define the NodeEnv type
// =============================================================================
// TODO: Define a union type `NodeEnv` for the three valid Node environments:
//       "development", "test", "production"

type NodeEnv = never; // replace with the union

// =============================================================================
// EXERCISE 2 — Model the server config
// =============================================================================
// TODO: Define a `ServerConfig` interface with:
//       - env:   NodeEnv
//       - port:  number
//       - isDev: boolean
//       - isProd: boolean
//       - isTest: boolean

interface ServerConfig {
  // TODO
}

// =============================================================================
// EXERCISE 3 — Model the database config
// =============================================================================
// TODO: Define a `DbConfig` interface with:
//       - url:            string
//       - maxConnections: number

interface DbConfig {
  // TODO
}

// =============================================================================
// EXERCISE 4 — Model the JWT config
// =============================================================================
// TODO: Define a `JwtConfig` interface with:
//       - accessSecret:     string
//       - refreshSecret:    string
//       - accessExpiresIn:  string   (e.g. "15m")
//       - refreshExpiresIn: string   (e.g. "7d")

interface JwtConfig {
  // TODO
}

// =============================================================================
// EXERCISE 5 — Compose the full AppConfig
// =============================================================================
// TODO: Define an `AppConfig` interface that contains:
//       - server: ServerConfig
//       - db:     DbConfig
//       - jwt:    JwtConfig

interface AppConfig {
  // TODO
}

// =============================================================================
// EXERCISE 6 — Build a sample config object
// =============================================================================
// TODO: Create a const `devConfig` of type `AppConfig` that represents
//       a typical local development configuration:
//       - env: "development", port: 3000, isDev: true, isProd: false, isTest: false
//       - db url: "postgresql://taskflow_user:localpassword@localhost:5432/taskflow", maxConnections: 10
//       - jwt: all secrets as "dev-secret-must-be-32-chars-min", expiresIn: "15m" and "7d"

const devConfig: AppConfig = {
  // TODO
} as AppConfig;

// =============================================================================
// EXERCISE 7 — Derive isDev from env
// =============================================================================
// TODO: Write a function `buildServerConfig` that takes a `NodeEnv` and a port
//       number, and returns a `ServerConfig` with all boolean flags computed.

function buildServerConfig(env: NodeEnv, port: number): ServerConfig {
  // TODO
  return {} as ServerConfig;
}

// =============================================================================
// EXERCISE 8 — Docker service names
// =============================================================================
// TODO: Define a union type `DockerService` for the three compose services:
//       "postgres", "redis", "api"
// TODO: Define a `DockerPort` interface with:
//       - service: DockerService
//       - host:    number
//       - container: number

type DockerService = never; // replace

interface DockerPort {
  // TODO
}

// TODO: Create an array `defaultPorts` of `DockerPort` with the correct
//       mappings: postgres:5432, redis:6379, api:3000

const defaultPorts: DockerPort[] = [
  // TODO
];

// =============================================================================
// VERIFICATION
// =============================================================================

function verify(): void {
  // Exercise 6
  console.assert(devConfig.server.env === "development", "Ex6: env should be 'development'");
  console.assert(devConfig.server.port === 3000,         "Ex6: port should be 3000");
  console.assert(devConfig.server.isDev === true,        "Ex6: isDev should be true");
  console.assert(devConfig.server.isProd === false,      "Ex6: isProd should be false");
  console.assert(devConfig.db.maxConnections === 10,     "Ex6: maxConnections should be 10");

  // Exercise 7
  const testCfg = buildServerConfig("test", 3001);
  console.assert(testCfg.isTest  === true,  "Ex7: isTest should be true");
  console.assert(testCfg.isDev   === false, "Ex7: isDev should be false");
  console.assert(testCfg.isProd  === false, "Ex7: isProd should be false");
  console.assert(testCfg.port    === 3001,  "Ex7: port should be 3001");

  const prodCfg = buildServerConfig("production", 8080);
  console.assert(prodCfg.isProd === true,  "Ex7: isProd should be true");
  console.assert(prodCfg.isDev  === false, "Ex7: isDev should be false");

  // Exercise 8
  console.assert(defaultPorts.length === 3, "Ex8: should have 3 port mappings");
  const pgPort = defaultPorts.find((p) => p.service === "postgres");
  console.assert(pgPort?.host === 5432, "Ex8: postgres host port should be 5432");

  console.log("Chapter 1 verification complete ✓");
}

verify();
