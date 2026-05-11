# Chapter 18 — Caching with Redis

## Learning Objectives

By the end of this chapter you will be able to:
- Set up a typed `ioredis` client
- Implement the cache-aside pattern for task lists
- Cache authentication tokens and session data
- Invalidate cache correctly on mutations
- Avoid common caching pitfalls: thundering herd, stale data, cache poisoning

---

## 18.1 Installing ioredis

```bash
npm install ioredis
```

---

## 18.2 Redis Client Setup

```typescript
// src/lib/redis.ts
import Redis from "ioredis";
import { config } from "../config/env.js";

export const redis = new Redis(config.redis.url, {
  maxRetriesPerRequest: 3,
  enableReadyCheck:     true,
  lazyConnect:          false,
});

redis.on("connect",  () => console.log("[Redis] Connected"));
redis.on("error",    (err) => console.error("[Redis] Error:", err));
redis.on("close",    () => console.warn("[Redis] Connection closed"));

// Typed helpers — always serialize to/from JSON
export async function getJson<T>(key: string): Promise<T | null> {
  const raw = await redis.get(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function setJson<T>(
  key:     string,
  value:   T,
  ttlSec?: number
): Promise<void> {
  const serialised = JSON.stringify(value);
  if (ttlSec) {
    await redis.set(key, serialised, "EX", ttlSec);
  } else {
    await redis.set(key, serialised);
  }
}

export async function deleteKeys(pattern: string): Promise<void> {
  const keys = await redis.keys(pattern);
  if (keys.length > 0) await redis.del(...keys);
}
```

---

## 18.3 Cache Keys Convention

Define all cache keys as constants to avoid typos:

```typescript
// src/lib/cacheKeys.ts
export const CacheKey = {
  taskList: (projectId: number) => `taskflow:project:${projectId}:tasks`,
  task:     (taskId: number)    => `taskflow:task:${taskId}`,
  orgMembers: (orgId: number)   => `taskflow:org:${orgId}:members`,
  userSession: (userId: number) => `taskflow:session:${userId}`,
  refreshToken: (tokenId: string) => `taskflow:refresh:${tokenId}`,
} as const;
```

---

## 18.4 Cache-Aside Pattern

```typescript
// src/services/task.service.ts
import { getJson, setJson, deleteKeys } from "../lib/redis.js";
import { CacheKey }                     from "../lib/cacheKeys.js";

const TASK_LIST_TTL = 60 * 5; // 5 minutes

export async function list(query: ListTasksQuery): Promise<{ tasks: Task[]; total: number }> {
  const cacheKey = `${CacheKey.taskList(query.projectId)}:${JSON.stringify(query)}`;

  // 1. Try cache first
  const cached = await getJson<{ tasks: Task[]; total: number }>(cacheKey);
  if (cached) return cached;

  // 2. Cache miss — fetch from database
  const result = await fetchFromDatabase(query);

  // 3. Store in cache for next request
  await setJson(cacheKey, result, TASK_LIST_TTL);

  return result;
}

// Invalidate on write
export async function create(projectId: number, dto: CreateTaskDto, user: AuthUser): Promise<Task> {
  const task = await taskRepository.create({ ... });

  // Invalidate all cached lists for this project
  await deleteKeys(`${CacheKey.taskList(projectId)}:*`);

  return task;
}

export async function update(taskId: number, dto: UpdateTaskDto, user: AuthUser): Promise<Task> {
  const task = await taskRepository.update(taskId, dto);

  // Invalidate individual task cache and all project list caches
  await Promise.all([
    redis.del(CacheKey.task(taskId)),
    deleteKeys(`${CacheKey.taskList(task.projectId)}:*`),
  ]);

  return task;
}
```

---

## 18.5 Refresh Token Storage

Use Redis as the refresh token allow-list (mentioned in Ch 8):

```typescript
// src/lib/auth.tokens.ts
import { redis } from "./redis.js";
import { CacheKey } from "./cacheKeys.js";

const REFRESH_TTL = 60 * 60 * 24 * 7; // 7 days in seconds

export async function storeRefreshToken(tokenId: string, userId: number): Promise<void> {
  await redis.set(CacheKey.refreshToken(tokenId), String(userId), "EX", REFRESH_TTL);
}

export async function validateRefreshToken(tokenId: string): Promise<number | null> {
  const userIdStr = await redis.get(CacheKey.refreshToken(tokenId));
  return userIdStr ? Number(userIdStr) : null;
}

export async function revokeRefreshToken(tokenId: string): Promise<void> {
  await redis.del(CacheKey.refreshToken(tokenId));
}

// Revoke all tokens for a user (on password change or forced logout)
export async function revokeAllUserTokens(userId: number): Promise<void> {
  await deleteKeys(`taskflow:refresh:*`);
  // More precise: store userId in each key and use a user:tokenIds set
  // This is a simplification — see Ch 24 for a production approach
}
```

---

## 18.6 Rate Limit Storage (Redis-backed)

```typescript
// Rate limiter store — already covered in Ch 14
// Mention here that rate-limit-redis uses the same ioredis connection
import RedisStore from "rate-limit-redis";
import { redis } from "./lib/redis.js";

const store = new RedisStore({
  sendCommand: (...args: string[]) => redis.call(...args as [string, ...string[]]),
});
```

Using the same Redis instance for multiple features (cache, rate-limit, sessions, queues) is fine in development. In high-traffic production, you may split them across Redis databases (0–15) or separate Redis clusters.

---

## 18.7 Avoiding Thundering Herd

When a cached key expires and many requests hit at once, all of them go to the database simultaneously:

```typescript
// Solution: probabilistic early expiry (cache dog-pile prevention)
export async function getOrSet<T>(
  key:     string,
  fetcher: () => Promise<T>,
  ttlSec:  number
): Promise<T> {
  const cached = await getJson<T>(key);
  if (cached) return cached;

  // Acquire a lock to prevent multiple simultaneous fetches
  const lockKey   = `${key}:lock`;
  const lockValue = crypto.randomUUID();
  const acquired  = await redis.set(lockKey, lockValue, "NX", "EX", 10);

  if (!acquired) {
    // Another request is fetching — wait and retry from cache
    await new Promise((r) => setTimeout(r, 100));
    const retried = await getJson<T>(key);
    if (retried) return retried;
  }

  try {
    const fresh = await fetcher();
    await setJson(key, fresh, ttlSec);
    return fresh;
  } finally {
    // Release lock only if we still own it
    const current = await redis.get(lockKey);
    if (current === lockValue) await redis.del(lockKey);
  }
}
```

---

## 18.8 TTL Strategy for TaskFlow

| Data | TTL | Reason |
|------|-----|--------|
| Task list | 5 min | Frequently queried, tolerates slight staleness |
| Individual task | 10 min | Changes on update — explicit invalidation |
| Org members | 15 min | Changes rarely |
| Refresh token | 7 days | Matches JWT refresh expiry |
| Rate limit window | 1 min | Matches rate limit window |
| Session data | 30 min | Sliding window |

---

## Summary

| Concept | Rule |
|---------|------|
| `getJson`/`setJson` | Always type-safe JSON helpers — never raw string redis calls |
| Cache key constants | `CacheKey.*` functions — prevents typos and enables pattern deletion |
| Cache-aside | Read from cache first, fetch from DB on miss, store result |
| Invalidate on write | `create`/`update`/`delete` must delete relevant cache keys |
| Thundering herd | Use lock-based `getOrSet` for high-traffic keys |

---

## Exercise

Open `exercises/chapter_18.ts` and complete all TODOs.
