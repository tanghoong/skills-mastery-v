# Chapter 16 — API Versioning

## Learning Objectives

By the end of this chapter you will be able to:
- Choose the right versioning strategy for a REST API
- Implement URL-prefix versioning with typed router factories
- Add deprecation headers so clients know when to upgrade
- Design a v2 route alongside a v1 route without breaking existing clients

---

## 16.1 Why Version an API

APIs change. Adding fields is safe (additive). Removing or renaming fields breaks clients. Versioning lets you ship breaking changes while giving existing clients time to migrate.

Three common strategies:

| Strategy | Example | Pros | Cons |
|----------|---------|------|------|
| URL prefix | `/api/v1/tasks` | Obvious, easy to route | URLs change on major bump |
| Header | `Accept: application/vnd.api+json; version=1` | Clean URLs | Harder to test in browser |
| Query param | `/api/tasks?version=1` | No routing change | Pollutes query string |

**TaskFlow uses URL prefix** — it's the most common, most tooling supports it, and it's easy to reason about.

---

## 16.2 Typed Version Router Factory

```typescript
// src/api/index.ts
import { Router } from "express";
import { createV1Router } from "./v1/index.js";
import { createV2Router } from "./v2/index.js";

export function createApiRouter(): Router {
  const router = Router();

  router.use("/v1", createV1Router());
  router.use("/v2", createV2Router()); // added in future

  return router;
}

// src/app.ts
app.use("/api", createApiRouter());
```

---

## 16.3 Deprecation Headers

When v1 is deprecated, add response headers so clients know:

```typescript
// src/middleware/deprecation.ts
import type { RequestHandler } from "express";

interface DeprecationOptions {
  sunset:      string;  // ISO date: "2025-06-01T00:00:00Z"
  link?:       string;  // link to migration guide
  replacement?: string; // path of the replacement endpoint
}

export function deprecate(opts: DeprecationOptions): RequestHandler {
  return (_req, res, next) => {
    res.set("Deprecation", "true");
    res.set("Sunset", opts.sunset);
    if (opts.link) res.set("Link", `<${opts.link}>; rel="deprecation"`);
    if (opts.replacement) res.set("X-API-Replacement", opts.replacement);
    next();
  };
}

// Usage on a specific deprecated endpoint
router.get(
  "/tasks",
  deprecate({
    sunset:      "2025-06-01T00:00:00Z",
    link:        "https://docs.taskflow.io/migration/v1-to-v2",
    replacement: "/api/v2/tasks",
  }),
  asyncHandler(listTasksV1)
);
```

---

## 16.4 Version-Specific Response Shapes

v1 and v2 can return different shapes. Use typed interfaces to distinguish:

```typescript
// src/api/v1/tasks/types.ts
export interface TaskV1 {
  id:        number;
  title:     string;
  status:    string;
  priority:  string;
  createdAt: string; // ISO string
}

// src/api/v2/tasks/types.ts
export interface TaskV2 {
  id:         number;
  title:      string;
  status:     string;
  priority:   string;
  assignee:   { id: number; name: string } | null; // new: nested assignee
  labelCount: number;                               // new: label count
  createdAt:  string;
}

// src/api/v2/tasks/tasks.router.ts — same service, different shape
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { tasks, total } = await taskService.list({ ...req.query });

    // Transform to v2 shape
    const v2Tasks: TaskV2[] = tasks.map((t) => ({
      id:         t.id,
      title:      t.title,
      status:     t.status,
      priority:   t.priority,
      assignee:   t.assignee ? { id: t.assignee.id, name: t.assignee.name } : null,
      labelCount: t.labels.length,
      createdAt:  t.createdAt.toISOString(),
    }));

    sendList(res, v2Tasks, buildMeta(req.query.page, req.query.limit, total));
  })
);
```

The service layer is shared — only the response shape differs. No duplicate business logic.

---

## 16.5 Version Router Scaffold

```
src/api/
├── index.ts           ← mounts v1 and v2
├── v1/
│   ├── index.ts       ← v1 router with v1 feature set
│   ├── auth/
│   ├── tasks/
│   └── projects/
└── v2/
    ├── index.ts       ← v2 router — same structure
    └── tasks/         ← only files that changed between versions
```

Only add files to `v2/` when the endpoint actually changes. Everything else stays in `v1/` and both routers can import the same service functions.

---

## 16.6 Version Negotiation Middleware (Optional)

If you want to support `Accept-Version` header as an alternative:

```typescript
export function negotiateVersion(): RequestHandler {
  return (req, _res, next) => {
    const headerVersion = req.headers["accept-version"] as string | undefined;
    const urlVersion    = req.path.match(/^\/v(\d+)\//)?.[1];

    req.apiVersion = urlVersion
      ? Number(urlVersion)
      : headerVersion
        ? Number(headerVersion.replace("v", ""))
        : 1; // default to v1

    next();
  };
}
```

---

## 16.7 Semantic Versioning Rules for APIs

| Change Type | Version Bump | Example |
|-------------|-------------|---------|
| Add new field to response | None (additive) | Add `labelCount` to task response |
| Add optional request field | None (additive) | Add `color` to create label body |
| Remove field from response | Major (breaking) | Remove `assigneeName` |
| Rename field | Major (breaking) | `status` → `taskStatus` |
| Change field type | Major (breaking) | `assigneeId: string` → `number` |
| Change auth requirement | Major (breaking) | Endpoint was public, now requires auth |
| Add required request field | Major (breaking) | Make `priority` required |

Rule: if any existing client would break without a code change, it's a major (breaking) version bump.

---

## Summary

| Concept | Rule |
|---------|------|
| URL prefix versioning | `/api/v1/`, `/api/v2/` — explicit and easy to route |
| `Deprecation` header | Set when sunset date is known — gives clients advance warning |
| Shared service layer | v1 and v2 share the same service — only response shapes differ |
| Additive changes | Safe without version bump — never remove or rename existing fields |
| Breaking changes | Always a major version — give 6+ months deprecation notice |

---

## Exercise

Open `exercises/chapter_16.ts` and complete all TODOs.
