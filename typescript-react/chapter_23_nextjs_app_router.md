# Chapter 23 — Next.js App Router

## Learning Objectives

By the end of this chapter you will be able to:
- Distinguish Server Components from Client Components and their TypeScript implications
- Type `params` and `searchParams` in page and layout components
- Write typed Server Actions with `useActionState`
- Type `generateMetadata` for dynamic page metadata
- Use `cache` and `revalidatePath` with type safety

---

## 23.1 Server vs Client Components

In the Next.js App Router, every component is a **Server Component** by default unless it has `"use client"` at the top.

| Feature | Server Component | Client Component |
|---------|-----------------|-----------------|
| Async/await in component | ✓ | ✗ |
| `useState`, `useEffect` | ✗ | ✓ |
| `useRouter`, `useParams` | ✗ | ✓ |
| Direct DB / API access | ✓ | ✗ |
| File: top line | (none) | `"use client"` |

TypeScript cannot enforce this — it's a Next.js runtime distinction. The types look the same.

---

## 23.2 Typing Page Props — `params` and `searchParams`

```typescript
// app/[username]/page.tsx — Server Component
interface ProfilePageProps {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function ProfilePage({ params, searchParams }: ProfilePageProps) {
  const { username } = await params;
  const { tab = "projects" } = await searchParams;

  const profile = await db.profile.findUnique({ where: { username } });

  if (!profile) notFound(); // narrows — code below assumes profile exists

  return <ProfileView profile={profile} activeTab={tab} />;
}
```

In Next.js 15+, `params` and `searchParams` are Promises — always await them.

---

## 23.3 Nested Layouts with Typed Props

```typescript
// app/admin/layout.tsx
interface AdminLayoutProps {
  children: React.ReactNode;
  params: Promise<{}>;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex">
      <AdminSidebar user={session.user} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
```

---

## 23.4 Server Actions — Typed Functions

Server Actions are async functions marked with `"use server"`. They can be called from Client Components:

```typescript
// app/actions/profile.ts
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100),
  bio:  z.string().max(500),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export interface ActionResult {
  success: boolean;
  error?: string;
  fieldErrors?: Partial<Record<keyof UpdateProfileInput, string>>;
}

export async function updateProfile(
  userId: string,
  input: UpdateProfileInput
): Promise<ActionResult> {
  const parsed = updateProfileSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      fieldErrors: Object.fromEntries(
        Object.entries(parsed.error.flatten().fieldErrors).map(([k, v]) => [k, v?.[0]])
      ) as ActionResult["fieldErrors"],
    };
  }

  await db.profile.update({
    where: { id: userId },
    data: parsed.data,
  });

  revalidatePath(`/admin/profile`);
  revalidatePath(`/${parsed.data.name}`); // also revalidate public profile

  return { success: true };
}
```

---

## 23.5 Client Component Using Server Actions

```tsx
// app/admin/profile/ProfileForm.tsx
"use client";

import { useActionState } from "react";
import { updateProfile } from "@/app/actions/profile";
import type { ActionResult } from "@/app/actions/profile";

interface ProfileFormProps {
  userId: string;
  initialData: { name: string; bio: string };
}

export function ProfileForm({ userId, initialData }: ProfileFormProps) {
  const action = updateProfile.bind(null, userId); // partial application

  const [state, formAction, isPending] = useActionState<ActionResult, FormData>(
    async (_prev: ActionResult, formData: FormData) => {
      return action({
        name: formData.get("name") as string,
        bio:  formData.get("bio") as string,
      });
    },
    { success: false }
  );

  return (
    <form action={formAction}>
      <input name="name" defaultValue={initialData.name} />
      {state.fieldErrors?.name && <p>{state.fieldErrors.name}</p>}

      <textarea name="bio" defaultValue={initialData.bio} />
      {state.fieldErrors?.bio && <p>{state.fieldErrors.bio}</p>}

      {state.success && <p className="text-green-600">Saved!</p>}
      {state.error   && <p className="text-red-600">{state.error}</p>}

      <button type="submit" disabled={isPending}>
        {isPending ? "Saving…" : "Save Profile"}
      </button>
    </form>
  );
}
```

---

## 23.6 `generateMetadata` — Typed Dynamic Metadata

```typescript
// app/[username]/page.tsx
import type { Metadata } from "next";

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { username } = await params;
  const profile = await db.profile.findUnique({ where: { username } });

  if (!profile) {
    return { title: "Profile Not Found" };
  }

  return {
    title: `${profile.name} — DevLink`,
    description: profile.bio,
    openGraph: {
      title: profile.name,
      description: profile.bio,
      images: profile.avatarUrl ? [{ url: profile.avatarUrl }] : [],
    },
  };
}
```

`Metadata` is Next.js's fully typed metadata type — all fields are typed.

---

## 23.7 `cache` and `revalidatePath`

```typescript
// src/lib/data.ts
import { cache } from "react";

// `cache` memoises the function within a single server request
export const getProfile = cache(async (username: string): Promise<Profile | null> => {
  return db.profile.findUnique({ where: { username } });
});

// Call it from multiple Server Components in the same request — only one DB query
// app/[username]/page.tsx
const profile = await getProfile(username);
// app/[username]/layout.tsx
const profile = await getProfile(username); // same request → cached, no second query
```

---

## Key Takeaways

| Pattern | Rule |
|---------|------|
| `params` / `searchParams` | `Promise<T>` in Next.js 15 — always `await` them |
| Server Actions | Mark with `"use server"`, return a typed result object |
| `useActionState` | Bridge Server Actions to Client Component forms |
| `generateMetadata` | Same `params` shape as the page — fully typed with `Metadata` |
| `cache` | Deduplicate DB calls within a single server request |
| `revalidatePath` | Call after mutations to update the cache |
