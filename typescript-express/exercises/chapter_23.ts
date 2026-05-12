/**
 * Chapter 23 — Performance
 *
 * Run: tsx exercises/chapter_23.ts
 */

// =============================================================================
// EXERCISE 1 — Detect N+1 queries (static analysis simulation)
// =============================================================================
// TODO: Define `QueryLog` interface: { sql: string; durationMs: number; params?: unknown[] }
// TODO: Implement `detectN1Queries(logs: QueryLog[]): { pattern: string; count: number }[]`
//       Detects repeated SELECT queries that differ only in the WHERE clause value
//       Strategy: strip numeric values from SQL and group by the resulting template
//       Return groups where count > 1 (sorted by count descending)

export interface QueryLog {
  // TODO
}

export function detectN1Queries(logs: QueryLog[]): { pattern: string; count: number }[] {
  // TODO: normalise SQL by replacing numbers with ?
  //       e.g. "SELECT * FROM Task WHERE id = 42" → "SELECT * FROM Task WHERE id = ?"
  //       group by normalised SQL, return groups with count > 1
  return [];
}

// =============================================================================
// EXERCISE 2 — Promise paralleliser
// =============================================================================
// TODO: Implement `parallelAll<T extends Record<string, () => Promise<unknown>>>(tasks: T): Promise<{ [K in keyof T]: Awaited<ReturnType<T[K]>> }>`
//       Runs all task functions in parallel using Promise.all
//       Returns an object with the same keys but resolved values

export async function parallelAll<T extends Record<string, () => Promise<unknown>>>(
  tasks: T
): Promise<{ [K in keyof T]: Awaited<ReturnType<T[K]>> }> {
  // TODO
  return {} as any;
}

// =============================================================================
// EXERCISE 3 — Pagination limits enforcer
// =============================================================================
// TODO: Implement `enforcePaginationLimits(page: number, limit: number, maxLimit = 100): { page: number; limit: number }`
//       - page must be >= 1 (clamp to 1 if lower)
//       - limit must be >= 1 and <= maxLimit (clamp to range)

export function enforcePaginationLimits(page: number, limit: number, maxLimit = 100): { page: number; limit: number } {
  // TODO
  return { page, limit };
}

// =============================================================================
// EXERCISE 4 — Select field picker (prevent over-fetching)
// =============================================================================
// TODO: Implement `selectFields<T>(items: T[], fields: (keyof T)[]): Pick<T, keyof T>[]`
//       Returns a new array of objects containing only the specified fields

export function selectFields<T>(items: T[], fields: (keyof T)[]): Partial<T>[] {
  // TODO
  return items;
}

// =============================================================================
// EXERCISE 5 — Batch loader (prevent N+1 from parent context)
// =============================================================================
// TODO: Implement `BatchLoader<K, V>` class:
//       - Constructor: (batchFn: (keys: K[]) => Promise<Map<K, V>>)
//       - load(key: K): Promise<V | undefined>
//         Queues the key, resolves in the next microtask tick using batchFn
//         Multiple load() calls in the same tick are batched into one batchFn call

export class BatchLoader<K, V> {
  private queue: { key: K; resolve: (v: V | undefined) => void; reject: (e: unknown) => void }[] = [];
  private scheduled = false;

  constructor(private batchFn: (keys: K[]) => Promise<Map<K, V>>) {}

  load(key: K): Promise<V | undefined> {
    // TODO: add to queue, schedule a microtask flush if not already scheduled
    //       The flush calls batchFn with all queued keys, resolves each promise
    return Promise.resolve(undefined);
  }

  private async flush(): Promise<void> {
    // TODO
  }
}

// =============================================================================
// EXERCISE 6 — Memory usage formatter
// =============================================================================
// TODO: Implement `formatMemoryUsage(bytes: number): string`
//       Formats bytes as human-readable:
//       < 1024 → "X B"
//       < 1024 * 1024 → "X.X KB"
//       < 1024^3 → "X.X MB"
//       else → "X.X GB"

export function formatMemoryUsage(bytes: number): string {
  // TODO
  return `${bytes} B`;
}

// =============================================================================
// VERIFICATION
// =============================================================================

async function verify(): Promise<void> {
  // Exercise 1 — N+1 detection
  const logs: QueryLog[] = [
    { sql: "SELECT * FROM Task WHERE id = 1",  durationMs: 5 },
    { sql: "SELECT * FROM Task WHERE id = 2",  durationMs: 4 },
    { sql: "SELECT * FROM Task WHERE id = 3",  durationMs: 6 },
    { sql: "SELECT * FROM Project WHERE id = 10", durationMs: 3 },
    { sql: "SELECT * FROM Project WHERE id = 10", durationMs: 3 }, // duplicate
  ];

  const n1 = detectN1Queries(logs);
  console.assert(n1.length >= 1,           "Ex1: should detect N+1 patterns");
  const taskPattern = n1.find((p) => p.pattern.includes("Task"));
  console.assert(taskPattern !== undefined, "Ex1: Task N+1 detected");
  console.assert(taskPattern!.count === 3,  "Ex1: 3 Task queries");

  // Exercise 2 — parallelAll
  const results = await parallelAll({
    users:    async () => ["Alice", "Bob"],
    count:    async () => 42,
    settings: async () => ({ theme: "dark" }),
  });
  console.assert(Array.isArray(results.users),           "Ex2: users should be array");
  console.assert(results.count === 42,                   "Ex2: count should be 42");
  console.assert(results.settings.theme === "dark",      "Ex2: settings should match");

  // Exercise 3 — pagination limits
  console.assert(enforcePaginationLimits(1, 20).page  === 1,   "Ex3: valid page");
  console.assert(enforcePaginationLimits(0, 20).page  === 1,   "Ex3: page 0 → 1");
  console.assert(enforcePaginationLimits(-5, 20).page === 1,   "Ex3: negative page → 1");
  console.assert(enforcePaginationLimits(1, 200).limit === 100,"Ex3: limit 200 → 100");
  console.assert(enforcePaginationLimits(1, 0).limit  === 1,   "Ex3: limit 0 → 1");
  console.assert(enforcePaginationLimits(1, 50, 200).limit === 50, "Ex3: within custom max");

  // Exercise 4 — selectFields
  const items = [
    { id: 1, title: "Task A", passwordHash: "secret", status: "TODO" },
    { id: 2, title: "Task B", passwordHash: "secret2", status: "DONE" },
  ];
  const selected = selectFields(items, ["id", "title", "status"]);
  console.assert(!("passwordHash" in selected[0]), "Ex4: passwordHash should be excluded");
  console.assert((selected[0] as any).id === 1,    "Ex4: id should be present");
  console.assert((selected[0] as any).title === "Task A", "Ex4: title should be present");

  // Exercise 5 — BatchLoader
  let batchCallCount = 0;
  const loader = new BatchLoader<number, string>(async (keys) => {
    batchCallCount++;
    const map = new Map<number, string>();
    keys.forEach((k) => map.set(k, `User-${k}`));
    return map;
  });

  // Load multiple keys in the same tick
  const [u1, u2, u3] = await Promise.all([
    loader.load(1),
    loader.load(2),
    loader.load(3),
  ]);
  console.assert(u1 === "User-1",       "Ex5: should resolve user 1");
  console.assert(u2 === "User-2",       "Ex5: should resolve user 2");
  console.assert(batchCallCount === 1,  "Ex5: all 3 should be batched into 1 call");

  // Exercise 6 — formatMemoryUsage
  console.assert(formatMemoryUsage(512)                   === "512 B",     "Ex6: bytes");
  console.assert(formatMemoryUsage(1536)                  === "1.5 KB",    "Ex6: KB");
  console.assert(formatMemoryUsage(1024 * 1024 * 45.5)   === "45.5 MB",   "Ex6: MB");

  console.log("Chapter 23 verification complete ✓");
}

verify();
