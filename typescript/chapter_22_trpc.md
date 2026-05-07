# Chapter 22: tRPC — End-to-End Type Safety (Hour 22)

tRPC lets you call backend functions from the frontend with full TypeScript type safety — no REST endpoints, no GraphQL schemas, no code generation. The types flow automatically from server to client.

## 1. The Problem tRPC Solves

With a traditional REST API, you have a type gap:

```
Backend defines:  POST /api/users  { name: string, email: string } → User
Frontend calls:   fetch("/api/users", { body: JSON.stringify(data) })
                  ↑ TypeScript has no idea if this is correct
```

With tRPC:
```
Backend defines:  createUser({ name: string, email: string }) → User
Frontend calls:   trpc.createUser.mutate({ name, email })
                  ↑ TypeScript knows the input and output exactly
```

## 2. Setup

```bash
npm install @trpc/server @trpc/client @trpc/react-query @tanstack/react-query zod
```

tRPC uses **Zod** for runtime input validation (Zod schemas also generate TypeScript types).

## 3. Server — Defining the Router

```typescript
// server/trpc.ts — initialise tRPC
import { initTRPC } from "@trpc/server";

const t = initTRPC.create();

export const router    = t.router;
export const procedure = t.procedure; // base procedure (unauthenticated)
```

```typescript
// server/routers/users.ts
import { z } from "zod";
import { router, procedure } from "../trpc";
import { prisma } from "@/lib/prisma";

const createUserSchema = z.object({
    name:  z.string().min(2).max(100),
    email: z.string().email(),
    age:   z.number().int().min(18),
});

export const usersRouter = router({
    // QUERY — for reading data (like GET)
    getAll: procedure.query(async () => {
        return prisma.user.findMany();
        // return type is inferred automatically: Promise<User[]>
    }),

    getById: procedure
        .input(z.object({ id: z.number() }))
        .query(async ({ input }) => {
            // input: { id: number }
            const user = await prisma.user.findUnique({ where: { id: input.id } });
            if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
            return user;
        }),

    // MUTATION — for creating/updating/deleting (like POST/PUT/DELETE)
    create: procedure
        .input(createUserSchema)
        .mutation(async ({ input }) => {
            // input is typed as { name: string; email: string; age: number }
            return prisma.user.create({ data: input });
        }),

    delete: procedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
            await prisma.user.delete({ where: { id: input.id } });
            return { success: true };
        }),
});
```

```typescript
// server/routers/_app.ts — the root router
import { router } from "../trpc";
import { usersRouter } from "./users";
import { postsRouter } from "./posts";

export const appRouter = router({
    users: usersRouter,
    posts: postsRouter,
});

// Export the type — this is what the client uses
export type AppRouter = typeof appRouter;
```

## 4. Server — Exposing tRPC as an API (Next.js)

```typescript
// src/app/api/trpc/[trpc]/route.ts
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/server/routers/_app";

const handler = (req: Request) =>
    fetchRequestHandler({
        endpoint: "/api/trpc",
        req,
        router: appRouter,
        createContext: () => ({}),
    });

export { handler as GET, handler as POST };
```

## 5. Client — Calling the Backend

```typescript
// src/lib/trpc.ts
import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@/server/routers/_app";

// AppRouter type travels from server to client — that's the magic
export const trpc = createTRPCReact<AppRouter>();
```

```typescript
// src/app/providers.tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { trpc } from "@/lib/trpc";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient());
    const [trpcClient] = useState(() =>
        trpc.createClient({
            links: [httpBatchLink({ url: "/api/trpc" })],
        })
    );

    return (
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        </trpc.Provider>
    );
}
```

## 6. Using tRPC in React Components

```typescript
"use client";

import { trpc } from "@/lib/trpc";

export function UsersList() {
    // Fully typed — data is User[] | undefined
    const { data: users, isLoading } = trpc.users.getAll.useQuery();

    const createUser = trpc.users.create.useMutation({
        onSuccess: () => {
            // invalidate and refetch the users list
            trpc.useUtils().users.getAll.invalidate();
        },
    });

    if (isLoading) return <p>Loading...</p>;

    return (
        <div>
            <ul>
                {users?.map(user => (
                    <li key={user.id}>{user.name} — {user.email}</li>
                ))}
            </ul>
            <button
                onClick={() =>
                    createUser.mutate({ name: "Dave", email: "dave@example.com", age: 25 })
                }
            >
                Add User
            </button>
            {/* TypeScript will error if you pass wrong fields to mutate() */}
        </div>
    );
}
```

## 7. Protected Procedures — Middleware

Add authentication middleware to protect specific procedures.

```typescript
// server/trpc.ts
import { initTRPC, TRPCError } from "@trpc/server";

interface Context {
    userId?: string;
}

const t = initTRPC.context<Context>().create();

export const router    = t.router;
export const procedure = t.procedure;

// Protected procedure — throws if user is not logged in
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
    if (!ctx.userId) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
    }
    return next({ ctx: { userId: ctx.userId } }); // userId is now non-nullable
});
```

```typescript
// Use in your router
export const postsRouter = router({
    create: protectedProcedure
        .input(z.object({ title: z.string(), content: z.string() }))
        .mutation(async ({ input, ctx }) => {
            // ctx.userId is guaranteed to be a string here
            return prisma.post.create({
                data: { ...input, authorId: ctx.userId },
            });
        }),
});
```

## Action Item for Hour 22:

- Build a tRPC router for a simple task manager: `tasks.getAll`, `tasks.create` (with `title: string, priority: "low" | "medium" | "high"`), `tasks.complete` (marks a task done), and `tasks.delete`.
- Protect `create`, `complete`, and `delete` with a `protectedProcedure`.
- Call `tasks.getAll` and `tasks.create` from a React component.
