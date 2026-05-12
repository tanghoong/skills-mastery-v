# Chapter 24 — tRPC + React

## Learning Objectives

By the end of this chapter you will be able to:
- Set up a tRPC router with typed procedures
- Generate fully typed React hooks with `createTRPCReact`
- Use `inferRouterInputs` and `inferRouterOutputs` for reusable types
- Call tRPC queries and mutations from React components
- Handle typed errors from tRPC

---

## 24.1 Why tRPC

tRPC eliminates the API contract duplication problem: you define the API once in TypeScript, and the client gets the exact same types automatically. No code generation, no REST schemas, no GraphQL SDL.

```bash
npm install @trpc/server @trpc/client @trpc/react-query @tanstack/react-query zod
```

---

## 24.2 Router Definition (Server)

```typescript
// packages/api/src/router.ts
import { initTRPC, TRPCError } from "@trpc/server";
import { z } from "zod";

const t = initTRPC.context<{ userId: string | null }>().create();

const publicProcedure    = t.procedure;
const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.userId) throw new TRPCError({ code: "UNAUTHORIZED" });
  return next({ ctx: { userId: ctx.userId } }); // userId is string (not null)
});

export const appRouter = t.router({
  profile: t.router({
    get: publicProcedure
      .input(z.object({ username: z.string() }))
      .query(async ({ input }) => {
        const profile = await db.profile.findUnique({ where: { username: input.username } });
        if (!profile) throw new TRPCError({ code: "NOT_FOUND" });
        return profile; // return type inferred from Prisma
      }),

    update: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(100),
        bio:  z.string().max(500),
      }))
      .mutation(async ({ input, ctx }) => {
        return db.profile.update({
          where: { id: ctx.userId },
          data:  input,
        });
      }),
  }),

  projects: t.router({
    list: protectedProcedure
      .query(async ({ ctx }) => {
        return db.project.findMany({ where: { userId: ctx.userId } });
      }),

    create: protectedProcedure
      .input(z.object({
        title:       z.string().min(1),
        description: z.string(),
        tags:        z.array(z.string()).max(10),
      }))
      .mutation(async ({ input, ctx }) => {
        return db.project.create({ data: { ...input, userId: ctx.userId } });
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const project = await db.project.findUnique({ where: { id: input.id } });
        if (!project || project.userId !== ctx.userId) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        await db.project.delete({ where: { id: input.id } });
      }),
  }),
});

export type AppRouter = typeof appRouter;
```

---

## 24.3 `inferRouterInputs` and `inferRouterOutputs`

Derive input/output types from the router for use in the rest of the app:

```typescript
// packages/api/src/types.ts
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "./router";

export type RouterInputs  = inferRouterInputs<AppRouter>;
export type RouterOutputs = inferRouterOutputs<AppRouter>;

// Usage
type ProfileGetInput    = RouterInputs["profile"]["get"];
// { username: string }

type ProfileGetOutput   = RouterOutputs["profile"]["get"];
// Profile — the Prisma model type

type ProjectCreateInput = RouterInputs["projects"]["create"];
// { title: string; description: string; tags: string[] }
```

---

## 24.4 `createTRPCReact` — Client Setup

```typescript
// src/lib/trpc.ts
import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@repo/api";

export const trpc = createTRPCReact<AppRouter>();
```

```tsx
// src/main.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { trpc } from "./lib/trpc";

const queryClient = new QueryClient();
const trpcClient  = trpc.createClient({
  links: [
    httpBatchLink({
      url: `${import.meta.env.VITE_API_URL}/trpc`,
      headers: () => ({
        authorization: `Bearer ${localStorage.getItem("token") ?? ""}`,
      }),
    }),
  ],
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
```

---

## 24.5 Typed `useQuery` and `useMutation`

```tsx
import { trpc } from "@/lib/trpc";

// Query — fully typed, no type annotations needed
function PublicProfile({ username }: { username: string }) {
  const { data: profile, isLoading, error } = trpc.profile.get.useQuery({ username });
  // data is `Profile | undefined`
  // error is `TRPCClientError<AppRouter> | null`

  if (isLoading) return <Skeleton />;
  if (error?.data?.code === "NOT_FOUND") return <NotFound />;
  if (!profile) return null;

  return <ProfileCard profile={profile} />;
}

// Mutation — input is typed as `RouterInputs["projects"]["create"]`
function AddProjectForm() {
  const utils = trpc.useUtils();

  const createProject = trpc.projects.create.useMutation({
    onSuccess: () => {
      // Invalidate projects list cache
      utils.projects.list.invalidate();
    },
  });

  const handleSubmit = (data: RouterInputs["projects"]["create"]) => {
    createProject.mutate(data);
  };

  return (
    <form onSubmit={...}>
      {createProject.error && <Alert>{createProject.error.message}</Alert>}
      <button type="submit" disabled={createProject.isPending}>Add</button>
    </form>
  );
}
```

---

## 24.6 Optimistic Updates with tRPC

```tsx
const deleteProject = trpc.projects.delete.useMutation({
  onMutate: async ({ id }) => {
    await utils.projects.list.cancel();

    // Snapshot previous value
    const prev = utils.projects.list.getData();

    // Optimistically remove the project
    utils.projects.list.setData(undefined, (old) =>
      old?.filter((p) => p.id !== id) ?? []
    );

    return { prev }; // context for onError
  },

  onError: (_err, _vars, context) => {
    // Revert on error
    if (context?.prev) {
      utils.projects.list.setData(undefined, context.prev);
    }
  },

  onSettled: () => {
    utils.projects.list.invalidate();
  },
});
```

---

## Key Takeaways

| Pattern | Rule |
|---------|------|
| `AppRouter` type | Export from server — imported by client for full type safety |
| `inferRouterInputs/Outputs` | Derive input/output types once — import everywhere |
| `trpc.x.y.useQuery` | Types flow from the router — no `<T>` annotation needed |
| `trpc.x.y.useMutation` | `mutate(input)` input is typed from Zod schema |
| `trpc.useUtils()` | Cache manipulation — `invalidate`, `setData`, `cancel` |
| Error handling | `error.data?.code` is typed as tRPC error code |
