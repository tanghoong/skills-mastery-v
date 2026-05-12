/**
 * Chapter 18 — Caching with Redis
 *
 * Run: tsx exercises/chapter_18.ts
 */

// =============================================================================
// EXERCISE 1 — Cache key builders
// =============================================================================
// TODO: Implement the following typed cache key functions:
//       taskList(projectId: number): string    → "taskflow:project:{n}:tasks"
//       task(taskId: number): string           → "taskflow:task:{n}"
//       orgMembers(orgId: number): string      → "taskflow:org:{n}:members"
//       refreshToken(tokenId: string): string  → "taskflow:refresh:{tokenId}"
//       userSession(userId: number): string    → "taskflow:session:{n}"

export const CacheKey = {
  taskList:     (projectId: number): string => { /* TODO */ return ""; },
  task:         (taskId: number):    string => { /* TODO */ return ""; },
  orgMembers:   (orgId: number):     string => { /* TODO */ return ""; },
  refreshToken: (tokenId: string):   string => { /* TODO */ return ""; },
  userSession:  (userId: number):    string => { /* TODO */ return ""; },
};

// =============================================================================
// EXERCISE 2 — In-memory cache (mock Redis)
// =============================================================================
// TODO: Implement `InMemoryCache` class:
//       - Stores { value: string; expiresAt: number | null }
//       - get(key: string): string | null       (returns null if expired or missing)
//       - set(key: string, value: string, ttlSec?: number): void
//       - del(...keys: string[]): number        (returns count deleted)
//       - keys(pattern: string): string[]       (pattern: "prefix:*" → match all starting with "prefix:")
//       - exists(key: string): boolean
//       - ttl(key: string): number              (-1 if no expiry, -2 if not found or expired, else seconds remaining)

export class InMemoryCache {
  private store = new Map<string, { value: string; expiresAt: number | null }>();

  get(key: string): string | null {
    // TODO: check expiry, return value or null
    return null;
  }

  set(key: string, value: string, ttlSec?: number): void {
    // TODO
  }

  del(...keys: string[]): number {
    // TODO
    return 0;
  }

  keys(pattern: string): string[] {
    // TODO: support "prefix:*" pattern matching
    return [];
  }

  exists(key: string): boolean {
    // TODO
    return false;
  }

  ttl(key: string): number {
    // TODO
    return -2;
  }
}

// =============================================================================
// EXERCISE 3 — getJson / setJson helpers
// =============================================================================
// TODO: Implement `getJson<T>(cache: InMemoryCache, key: string): T | null`
//       Parses JSON from cache, returns null on miss or parse error
//
// TODO: Implement `setJson<T>(cache: InMemoryCache, key: string, value: T, ttlSec?: number): void`
//       Serialises value to JSON and stores in cache

export function getJson<T>(cache: InMemoryCache, key: string): T | null {
  // TODO
  return null;
}

export function setJson<T>(cache: InMemoryCache, key: string, value: T, ttlSec?: number): void {
  // TODO
}

// =============================================================================
// EXERCISE 4 — cache-aside pattern
// =============================================================================
// TODO: Implement `cacheAside<T>(cache: InMemoryCache, key: string, ttlSec: number, fetcher: () => Promise<T>): Promise<T>`
//       1. Try to get from cache (as JSON)
//       2. If hit: return the parsed value
//       3. If miss: call fetcher(), store result as JSON, return result

export async function cacheAside<T>(
  cache:   InMemoryCache,
  key:     string,
  ttlSec:  number,
  fetcher: () => Promise<T>
): Promise<T> {
  // TODO
  return fetcher();
}

// =============================================================================
// EXERCISE 5 — Cache invalidation on write
// =============================================================================
// TODO: Implement `invalidateProjectCache(cache: InMemoryCache, projectId: number): number`
//       Deletes all keys matching "taskflow:project:{projectId}:*"
//       Returns the number of keys deleted

export function invalidateProjectCache(cache: InMemoryCache, projectId: number): number {
  // TODO
  return 0;
}

// =============================================================================
// EXERCISE 6 — TTL strategy
// =============================================================================
// TODO: Define `CacheTtl` as a Record<string, number> mapping these cache types to TTL in seconds:
//       taskList:    5 minutes
//       task:        10 minutes
//       orgMembers:  15 minutes
//       refreshToken: 7 days
//       session:     30 minutes

export const CacheTtl: Record<string, number> = {
  // TODO
};

// =============================================================================
// VERIFICATION
// =============================================================================

async function verify(): Promise<void> {
  // Exercise 1 — key builders
  console.assert(CacheKey.taskList(7)         === "taskflow:project:7:tasks",    "Ex1: taskList key");
  console.assert(CacheKey.task(42)            === "taskflow:task:42",            "Ex1: task key");
  console.assert(CacheKey.refreshToken("abc") === "taskflow:refresh:abc",        "Ex1: refreshToken key");

  // Exercise 2 — InMemoryCache
  const cache = new InMemoryCache();
  cache.set("key1", "value1");
  console.assert(cache.get("key1") === "value1", "Ex2: get after set");
  console.assert(cache.exists("key1") === true,  "Ex2: exists after set");

  cache.set("expire-me", "data", 1); // 1 second TTL
  // Simulate expiry by manipulating time — we just test the interface
  console.assert(cache.get("expire-me") === "data", "Ex2: not expired yet");

  // TTL
  console.assert(cache.ttl("key1")     === -1, "Ex2: no-expiry key TTL is -1");
  console.assert(cache.ttl("missing")  === -2, "Ex2: missing key TTL is -2");
  console.assert(cache.ttl("expire-me") > 0,   "Ex2: future-expiry TTL > 0");

  // keys with pattern
  cache.set("project:1:tasks", "[]");
  cache.set("project:1:meta",  "{}");
  cache.set("project:2:tasks", "[]");
  const p1Keys = cache.keys("project:1:*");
  console.assert(p1Keys.length === 2,                "Ex2: pattern match returns 2 keys");
  console.assert(p1Keys.every((k) => k.startsWith("project:1:")), "Ex2: all match pattern");

  // del
  const deleted = cache.del("project:1:tasks", "project:1:meta");
  console.assert(deleted === 2,                      "Ex2: deleted 2 keys");
  console.assert(!cache.exists("project:1:tasks"),   "Ex2: key gone after del");

  // Exercise 3 — getJson / setJson
  const obj = { id: 1, name: "Alice" };
  setJson(cache, "user:1", obj, 60);
  const retrieved = getJson<{ id: number; name: string }>(cache, "user:1");
  console.assert(retrieved?.id   === 1,       "Ex3: id should be 1");
  console.assert(retrieved?.name === "Alice", "Ex3: name should be Alice");
  console.assert(getJson(cache, "missing") === null, "Ex3: miss returns null");

  // Exercise 4 — cache-aside
  let fetchCount = 0;
  const freshCache = new InMemoryCache();
  const fetchFn = async () => { fetchCount++; return { data: "from-db" }; };

  const r1 = await cacheAside(freshCache, "test:key", 60, fetchFn);
  console.assert(r1.data === "from-db", "Ex4: first call fetches from db");
  console.assert(fetchCount === 1,      "Ex4: fetched once");

  const r2 = await cacheAside(freshCache, "test:key", 60, fetchFn);
  console.assert(r2.data === "from-db", "Ex4: second call returns cached");
  console.assert(fetchCount === 1,      "Ex4: still only fetched once (cache hit)");

  // Exercise 5 — invalidation
  const projCache = new InMemoryCache();
  projCache.set("taskflow:project:5:tasks:page1", "[]");
  projCache.set("taskflow:project:5:tasks:page2", "[]");
  projCache.set("taskflow:project:6:tasks:page1", "[]");

  const count = invalidateProjectCache(projCache, 5);
  console.assert(count === 2, "Ex5: should delete 2 keys for project 5");
  console.assert(projCache.exists("taskflow:project:6:tasks:page1"), "Ex5: project 6 unaffected");

  // Exercise 6 — TTL strategy
  console.assert(CacheTtl.taskList    === 5 * 60,        "Ex6: taskList TTL = 5 min");
  console.assert(CacheTtl.refreshToken === 7 * 24 * 3600, "Ex6: refreshToken TTL = 7 days");

  console.log("Chapter 18 verification complete ✓");
}

verify();
