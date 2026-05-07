# Chapter 19: Next.js + TypeScript (Hour 19)

Next.js is the most popular React framework. It adds server-side rendering, routing, API routes, and more — all with first-class TypeScript support. This chapter covers the modern **App Router** (Next.js 13+).

## 1. Project Setup

Create a Next.js project with TypeScript:

```bash
npx create-next-app@latest my-app --typescript
```

The generated `tsconfig.json` is pre-configured for Next.js. Key additions:
- `"jsx": "preserve"` — Next.js handles JSX transformation
- `"paths": { "@/*": ["./src/*"] }` — the `@/` alias points to `src/`

## 2. App Router File Structure

```
src/app/
├── layout.tsx          ← Root layout (wraps all pages)
├── page.tsx            ← Home page (route: /)
├── loading.tsx         ← Suspense loading UI
├── error.tsx           ← Error boundary
├── users/
│   ├── page.tsx        ← Users list (route: /users)
│   └── [id]/
│       └── page.tsx    ← User detail (route: /users/123)
└── api/
    └── users/
        └── route.ts    ← API endpoint (GET/POST /api/users)
```

## 3. Page Props — Params & SearchParams

Next.js passes `params` and `searchParams` as props to page components. These are typed via generics.

```typescript
// src/app/users/[id]/page.tsx

interface PageProps {
    params: Promise<{ id: string }>;           // dynamic route segments
    searchParams: Promise<{ tab?: string }>;   // ?tab=posts query params
}

export default async function UserPage({ params, searchParams }: PageProps) {
    const { id } = await params;
    const { tab = "overview" } = await searchParams;

    const user = await fetch(`/api/users/${id}`).then(r => r.json());

    return (
        <div>
            <h1>{user.name}</h1>
            <p>Tab: {tab}</p>
        </div>
    );
}
```

## 4. Server Components vs Client Components

By default, all components in the App Router are **Server Components** — they run on the server, have no access to browser APIs, and cannot use hooks.

```typescript
// Server Component (default) — runs on server, can be async
// src/app/users/page.tsx
export default async function UsersPage() {
    // Direct database/API calls are fine here — this never runs in the browser
    const users = await fetch("https://api.example.com/users").then(r => r.json());

    return (
        <ul>
            {users.map((user: { id: number; name: string }) => (
                <li key={user.id}>{user.name}</li>
            ))}
        </ul>
    );
}
```

```typescript
// Client Component — must add "use client" directive
// src/components/Counter.tsx
"use client";

import { useState } from "react";

export function Counter() {
    const [count, setCount] = useState(0); // hooks work here
    return <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>;
}
```

## 5. API Route Handlers

API routes live in `route.ts` files. Each exported function name maps to an HTTP method.

```typescript
// src/app/api/users/route.ts
import { NextRequest, NextResponse } from "next/server";

interface CreateUserBody {
    name: string;
    email: string;
}

// GET /api/users
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const page = Number(searchParams.get("page") ?? "1");

    const users = await fetchUsersFromDB(page);
    return NextResponse.json(users);
}

// POST /api/users
export async function POST(request: NextRequest) {
    const body: CreateUserBody = await request.json();

    if (!body.name || !body.email) {
        return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const user = await createUserInDB(body);
    return NextResponse.json(user, { status: 201 });
}
```

```typescript
// src/app/api/users/[id]/route.ts — dynamic API route
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const user = await getUserById(Number(id));
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(user);
}
```

## 6. Server Actions

Server Actions let you call server-side code directly from a client form or event handler — no API route needed.

```typescript
// src/app/actions.ts
"use server";

import { revalidatePath } from "next/cache";

interface FormState {
    error?: string;
    success?: boolean;
}

export async function createUser(
    prevState: FormState,
    formData: FormData
): Promise<FormState> {
    const name  = formData.get("name") as string;
    const email = formData.get("email") as string;

    if (!name || !email) {
        return { error: "All fields are required" };
    }

    await saveUserToDB({ name, email });
    revalidatePath("/users"); // revalidate the users page cache

    return { success: true };
}
```

```typescript
// src/app/users/new/page.tsx — using the Server Action
"use client";

import { useActionState } from "react";
import { createUser } from "@/app/actions";

export default function NewUserPage() {
    const [state, action, isPending] = useActionState(createUser, {});

    return (
        <form action={action}>
            <input name="name" placeholder="Name" />
            <input name="email" placeholder="Email" />
            {state.error && <p style={{ color: "red" }}>{state.error}</p>}
            <button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : "Create User"}
            </button>
        </form>
    );
}
```

## 7. Metadata API

Next.js has a typed `Metadata` object for setting page titles, descriptions, and Open Graph tags.

```typescript
// src/app/users/[id]/page.tsx
import { Metadata } from "next";

interface PageProps {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { id } = await params;
    const user = await getUserById(Number(id));

    return {
        title: user ? `${user.name} — Profile` : "User Not Found",
        description: `View the profile of ${user?.name}`,
        openGraph: {
            title: user?.name,
            images: [`/api/og?userId=${id}`],
        },
    };
}
```

## Action Item for Hour 19:

- Create a Next.js App Router project with:
  - A `/products` page (Server Component) that fetches and lists products
  - A `/products/[id]` page with typed `params`
  - A `POST /api/products` route handler that validates the request body
  - A Server Action for creating a product from a form
