/**
 * Chapter 25 — Database Scaling: Read Replicas & Connection Pools
 *
 * Run: tsx exercises/chapter_25.ts
 */

// =============================================================================
// EXERCISE 1 — Connection pool config
// =============================================================================
// TODO: Define `PoolConfig` interface:
//       { maxConnections: number; minConnections: number; idleTimeoutMs: number; connectionTimeoutMs: number }
//
// TODO: Implement `calculatePoolSize(postgresMaxConnections: number, numInstances: number, reserveConnections?: number): PoolConfig`
//       Formula: connection_limit = floor((max - reserve) / instances)
//       Default reserve = 5
//       min = max(1, floor(connection_limit / 4))
//       idleTimeoutMs = 30000, connectionTimeoutMs = 10000

export interface PoolConfig {
  // TODO
}

export function calculatePoolSize(
  postgresMaxConnections: number,
  numInstances:           number,
  reserveConnections      = 5
): PoolConfig {
  // TODO
  return {} as PoolConfig;
}

// =============================================================================
// EXERCISE 2 — Read/Write router
// =============================================================================
// TODO: Define `DbOperation` union: "read" | "write"
// TODO: Define `DatabaseClient` interface:
//       { url: string; role: "primary" | "replica"; execute<T>(query: string): Promise<T> }
//
// TODO: Implement `ReadWriteRouter` class:
//       - Constructor: (primary: DatabaseClient, replica?: DatabaseClient)
//       - route(operation: DbOperation): DatabaseClient
//         Returns replica for reads (if available), primary for writes
//         If no replica: always return primary
//       - stats: { primaryQueries: number; replicaQueries: number }

export type DbOperation = never; // replace

export interface DatabaseClient {
  // TODO
}

export class ReadWriteRouter {
  public stats = { primaryQueries: 0, replicaQueries: 0 };

  constructor(
    private primary:  DatabaseClient,
    private replica?: DatabaseClient
  ) {}

  route(operation: DbOperation): DatabaseClient {
    // TODO
    return this.primary;
  }
}

// =============================================================================
// EXERCISE 3 — Read-your-writes pattern
// =============================================================================
// TODO: Implement `ReadYourWritesClient` class:
//       - Constructor: (router: ReadWriteRouter)
//       - write<T>(query: string): Promise<T>
//         Routes to primary, marks that a write happened
//       - read<T>(query: string, freshRequired?: boolean): Promise<T>
//         If freshRequired is true: always read from primary
//         If a recent write happened (within 100ms of last write): read from primary
//         Otherwise: read from replica

export class ReadYourWritesClient {
  private lastWriteAt: number = 0;
  private CONSISTENCY_WINDOW_MS = 100;

  constructor(private router: ReadWriteRouter) {}

  async write<T>(query: string): Promise<T> {
    // TODO
    return {} as T;
  }

  async read<T>(query: string, freshRequired = false): Promise<T> {
    // TODO
    return {} as T;
  }
}

// =============================================================================
// EXERCISE 4 — Prisma extension simulator
// =============================================================================
// TODO: Define `PrismaExtension` interface:
//       { name: string; applyToQuery: (model: string, operation: string, args: unknown) => unknown }
//
// TODO: Implement `applyExtensions(extensions: PrismaExtension[], model: string, operation: string, args: unknown): unknown`
//       Applies extensions in order — each extension can modify args and pass to the next

export interface PrismaExtension {
  // TODO
}

export function applyExtensions(
  extensions: PrismaExtension[],
  model:      string,
  operation:  string,
  args:       unknown
): unknown {
  // TODO: reduce over extensions, each transforming args
  return args;
}

// =============================================================================
// EXERCISE 5 — Soft-delete extension
// =============================================================================
// TODO: Implement `softDeleteExtension: PrismaExtension`
//       For "findMany" and "findUnique" operations:
//         If args is an object with a "where" property:
//           add "deletedAt: null" to the where clause
//       For "delete" operation:
//         Transform to an "update" by adding data: { deletedAt: new Date() }
//         Return modified args

export const softDeleteExtension: PrismaExtension = {
  name: "soft-delete",
  applyToQuery: (model, operation, args) => {
    // TODO
    return args;
  },
};

// =============================================================================
// EXERCISE 6 — Connection URL builder
// =============================================================================
// TODO: Implement `buildConnectionUrl(params: {
//         host: string; port: number; user: string; password: string; database: string;
//         sslMode?: "disable" | "require" | "verify-full";
//         connectionLimit?: number; poolTimeout?: number; pgbouncer?: boolean;
//       }): string`
//       Returns a PostgreSQL connection URL with query params appended

export function buildConnectionUrl(params: {
  host:             string;
  port:             number;
  user:             string;
  password:         string;
  database:         string;
  sslMode?:         "disable" | "require" | "verify-full";
  connectionLimit?: number;
  poolTimeout?:     number;
  pgbouncer?:       boolean;
}): string {
  // TODO
  return "";
}

// =============================================================================
// VERIFICATION
// =============================================================================

async function verify(): Promise<void> {
  // Exercise 1 — pool size
  const pool = calculatePoolSize(100, 3);
  console.assert(pool.maxConnections > 0,    "Ex1: maxConnections should be positive");
  console.assert(pool.maxConnections * 3 <= 100 - 5, "Ex1: total connections should not exceed max - reserve");
  console.assert(pool.minConnections >= 1,   "Ex1: minConnections should be >= 1");

  const singleInstance = calculatePoolSize(100, 1, 10);
  console.assert(singleInstance.maxConnections === 90, "Ex1: single instance gets 90 connections");

  // Exercise 2 — ReadWriteRouter
  let primaryCalled = false, replicaCalled = false;
  const mockPrimary: DatabaseClient  = { url: "primary", role: "primary",  execute: async () => { primaryCalled = true; return null as any; } };
  const mockReplica: DatabaseClient  = { url: "replica", role: "replica",  execute: async () => { replicaCalled = true; return null as any; } };

  const router = new ReadWriteRouter(mockPrimary, mockReplica);
  const readClient  = router.route("read");
  const writeClient = router.route("write");

  console.assert(readClient.role  === "replica", "Ex2: reads go to replica");
  console.assert(writeClient.role === "primary", "Ex2: writes go to primary");
  console.assert(router.stats.primaryQueries === 1, "Ex2: 1 primary query");
  console.assert(router.stats.replicaQueries === 1, "Ex2: 1 replica query");

  // No replica — always primary
  const primaryOnly = new ReadWriteRouter(mockPrimary);
  console.assert(primaryOnly.route("read").role === "primary",  "Ex2: no replica → read from primary");
  console.assert(primaryOnly.route("write").role === "primary", "Ex2: no replica → write from primary");

  // Exercise 4 — applyExtensions
  const timestampExt: PrismaExtension = {
    name: "timestamp",
    applyToQuery: (model, op, args) => {
      if (op === "update" && typeof args === "object" && args !== null) {
        return { ...args as object, data: { ...(args as any).data, updatedAt: new Date() } };
      }
      return args;
    },
  };

  const result = applyExtensions(
    [timestampExt],
    "Task",
    "update",
    { where: { id: 1 }, data: { title: "New Title" } }
  );
  console.assert((result as any).data?.updatedAt instanceof Date, "Ex4: timestamp extension applied");

  // Exercise 5 — soft delete
  const findArgs = { where: { projectId: 1 } };
  const softArgs = softDeleteExtension.applyToQuery("Task", "findMany", findArgs);
  console.assert((softArgs as any).where?.deletedAt === null, "Ex5: findMany adds deletedAt: null");

  const deleteArgs = { where: { id: 42 } };
  const softDelete = softDeleteExtension.applyToQuery("Task", "delete", deleteArgs);
  console.assert((softDelete as any).data?.deletedAt instanceof Date, "Ex5: delete becomes soft delete");

  // Exercise 6 — connection URL
  const url = buildConnectionUrl({
    host: "localhost", port: 5432, user: "user", password: "pass", database: "mydb",
    connectionLimit: 20, pgbouncer: true,
  });
  console.assert(url.startsWith("postgresql://"),         "Ex6: starts with postgresql://");
  console.assert(url.includes("@localhost:5432/mydb"),    "Ex6: includes host and db");
  console.assert(url.includes("connection_limit=20"),     "Ex6: connection_limit param");
  console.assert(url.includes("pgbouncer=true"),          "Ex6: pgbouncer param");

  console.log("Chapter 25 verification complete ✓");
}

verify();
