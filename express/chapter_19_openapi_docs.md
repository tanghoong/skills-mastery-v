# Chapter 19 — OpenAPI Docs with zod-to-openapi

## Learning Objectives

By the end of this chapter you will be able to:
- Generate an OpenAPI 3.1 spec from your existing Zod schemas
- Serve Swagger UI at `/api-docs`
- Document request bodies, params, query strings, and responses
- Add authentication documentation (Bearer JWT)
- Keep docs and code in sync automatically

---

## 19.1 Installing Dependencies

```bash
npm install @asteasolutions/zod-to-openapi swagger-ui-express
npm install -D @types/swagger-ui-express
```

---

## 19.2 Registry Setup

```typescript
// src/docs/registry.ts
import { OpenAPIRegistry, OpenApiGeneratorV31 } from "@asteasolutions/zod-to-openapi";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

// Extend Zod with .openapi() method
extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();
```

---

## 19.3 Annotating Schemas

```typescript
// src/api/v1/tasks/tasks.schemas.ts
import { z } from "zod";
import { registry } from "../../../docs/registry.js";

export const TaskStatusSchema = z.enum([
  "backlog","todo","in_progress","in_review","done","cancelled"
]).openapi({ description: "Current workflow status of the task" });

export const TaskPrioritySchema = z.enum([
  "urgent","high","medium","low","none"
]).openapi({ description: "Priority level" });

export const TaskSchema = z.object({
  id:          z.number().openapi({ example: 42 }),
  projectId:   z.number().openapi({ example: 7 }),
  title:       z.string().openapi({ example: "Fix login bug" }),
  description: z.string().nullable().optional(),
  status:      TaskStatusSchema,
  priority:    TaskPrioritySchema,
  assigneeId:  z.number().nullable().optional(),
  dueDate:     z.string().datetime().nullable().optional(),
  createdAt:   z.string().datetime(),
  updatedAt:   z.string().datetime(),
}).openapi("Task");

export const CreateTaskSchema = z.object({
  title:       z.string().min(1).max(255).openapi({ example: "Write unit tests" }),
  description: z.string().max(5000).optional(),
  priority:    TaskPrioritySchema.default("none"),
  assigneeId:  z.number().int().positive().optional(),
  dueDate:     z.coerce.date().optional(),
}).openapi("CreateTaskInput");

// Register schemas in the global registry
registry.register("Task",            TaskSchema);
registry.register("CreateTaskInput", CreateTaskSchema);
```

---

## 19.4 Registering Routes

```typescript
// src/docs/routes/tasks.docs.ts
import { registry }          from "../registry.js";
import { TaskSchema, CreateTaskSchema } from "../../api/v1/tasks/tasks.schemas.js";
import { z }                 from "zod";

// Define the BearerAuth security scheme once
registry.registerComponent("securitySchemes", "BearerAuth", {
  type:         "http",
  scheme:       "bearer",
  bearerFormat: "JWT",
});

registry.registerPath({
  method:      "get",
  path:        "/api/v1/projects/{projectId}/tasks",
  summary:     "List tasks",
  description: "Returns a paginated list of tasks for the given project.",
  tags:        ["Tasks"],
  security:    [{ BearerAuth: [] }],
  request: {
    params: z.object({ projectId: z.string() }),
    query:  z.object({
      status:   z.string().optional().openapi({ description: "Filter by status" }),
      priority: z.string().optional(),
      page:     z.string().optional().openapi({ example: "1" }),
      limit:    z.string().optional().openapi({ example: "20" }),
    }),
  },
  responses: {
    200: {
      description: "Paginated task list",
      content: {
        "application/json": {
          schema: z.object({
            ok:   z.literal(true),
            data: z.array(TaskSchema),
            meta: z.object({
              page:       z.number(),
              limit:      z.number(),
              total:      z.number(),
              totalPages: z.number(),
              hasNext:    z.boolean(),
              hasPrev:    z.boolean(),
            }),
          }),
        },
      },
    },
    401: { description: "Unauthorized" },
    403: { description: "Forbidden" },
  },
});

registry.registerPath({
  method:   "post",
  path:     "/api/v1/projects/{projectId}/tasks",
  summary:  "Create task",
  tags:     ["Tasks"],
  security: [{ BearerAuth: [] }],
  request: {
    params: z.object({ projectId: z.string() }),
    body: {
      content: {
        "application/json": { schema: CreateTaskSchema },
      },
      required: true,
    },
  },
  responses: {
    201: {
      description: "Task created",
      content: {
        "application/json": {
          schema: z.object({ ok: z.literal(true), data: TaskSchema }),
        },
      },
    },
    422: { description: "Validation error" },
  },
});
```

---

## 19.5 Generating the Spec

```typescript
// src/docs/openapi.ts
import { OpenApiGeneratorV31 } from "@asteasolutions/zod-to-openapi";
import { registry } from "./registry.js";

// Import all route docs to register them
import "./routes/tasks.docs.js";
import "./routes/auth.docs.js";
import "./routes/projects.docs.js";

export function generateOpenApiSpec() {
  const generator = new OpenApiGeneratorV31(registry.definitions);

  return generator.generateDocument({
    openapi: "3.1.0",
    info: {
      title:       "TaskFlow API",
      version:     "1.0.0",
      description: "Team task management API — TypeScript + Express + Prisma",
    },
    servers: [
      { url: "https://api.taskflow.io",  description: "Production" },
      { url: "http://localhost:3000",    description: "Development" },
    ],
  });
}
```

---

## 19.6 Serving Swagger UI

```typescript
// src/app.ts
import swaggerUi       from "swagger-ui-express";
import { generateOpenApiSpec } from "./docs/openapi.js";

export function createApp() {
  const app = express();
  // ... other middleware

  // Generate spec once at startup
  const spec = generateOpenApiSpec();

  // Serve raw JSON spec
  app.get("/api-spec.json", (_req, res) => {
    res.json(spec);
  });

  // Serve Swagger UI
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(spec, {
      customSiteTitle: "TaskFlow API Docs",
      swaggerOptions: {
        persistAuthorization: true, // remember Bearer token between page reloads
        filter:               true, // enable search
      },
    })
  );

  // ... routes, error handler
}
```

Now `GET http://localhost:3000/api-docs` opens the Swagger UI.

---

## 19.7 Keeping Docs and Code in Sync

The schema is the source of truth:

```
Zod schema ──► z.infer<> ──► TypeScript types (compile time)
           └─► registry  ──► OpenAPI spec (runtime)
                          └─► Swagger UI (developer portal)
```

When you change a Zod schema:
1. TypeScript immediately catches mismatches in route handlers
2. The OpenAPI spec updates at next server restart
3. Swagger UI reflects the change

No manual updating of YAML/JSON spec files — the code is the documentation.

---

## Summary

| Concept | Rule |
|---------|------|
| `extendZodWithOpenApi(z)` | Call once at the top of registry.ts — adds `.openapi()` to all schemas |
| `registry.register()` | Name your schemas — they appear as `$ref` in the spec |
| `security: [{ BearerAuth: [] }]` | Tag every protected route with the security scheme |
| Generate once at startup | Call `generateOpenApiSpec()` in `createApp()` — not on every request |
| `/api-spec.json` | Expose the raw spec so other tools (Postman, code generators) can consume it |

---

## Exercise

Open `exercises/chapter_19.ts` and complete all TODOs.
