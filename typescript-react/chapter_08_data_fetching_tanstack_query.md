# Chapter 8 — Data Fetching with TanStack Query

## Learning Objectives

By the end of this chapter you will be able to:
- Set up a typed `QueryClient` and `QueryClientProvider`
- Write typed `useQuery<TData, TError>` calls
- Write typed `useMutation<TData, TError, TVariables>` calls
- Build a typed API layer that integrates cleanly with TanStack Query
- Handle loading, error, and success states with type narrowing

---

## 8.1 Why TanStack Query

Manual data fetching with `useEffect` + `useState` requires you to manually manage loading, error, caching, refetching, and stale data. TanStack Query handles all of this — and its types make every state transition explicit.

```bash
npm install @tanstack/react-query
```

---

## 8.2 Typed QueryClient Setup

```tsx
// src/lib/queryClient.ts
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

// src/main.tsx
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);
```

---

## 8.3 Typed API Layer

Always define typed API functions separately from query hooks. This keeps the HTTP logic isolated and testable:

```typescript
// src/lib/api.ts
const BASE_URL = import.meta.env.VITE_API_URL;

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message ?? "API error");
  }

  return res.json() as Promise<T>;
}

export const api = {
  getProfile: (username: string) =>
    apiFetch<Profile>(`/profiles/${username}`),

  getProjects: (userId: string) =>
    apiFetch<Project[]>(`/users/${userId}/projects`),

  createProject: (data: CreateProjectInput) =>
    apiFetch<Project>("/projects", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateProject: (id: string, data: Partial<CreateProjectInput>) =>
    apiFetch<Project>(`/projects/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteProject: (id: string) =>
    apiFetch<void>(`/projects/${id}`, { method: "DELETE" }),
};
```

---

## 8.4 `useQuery<TData, TError>`

```tsx
import { useQuery } from "@tanstack/react-query";

function useProfile(username: string) {
  return useQuery<Profile, Error>({
    queryKey: ["profile", username],
    queryFn: () => api.getProfile(username),
    enabled: !!username, // only run when username is truthy
  });
}

// Usage with type narrowing
function ProfilePage({ username }: { username: string }) {
  const { data, isLoading, isError, error } = useProfile(username);

  if (isLoading) return <Spinner />;
  if (isError) return <ErrorMessage message={error.message} />;
  // data is `Profile` here — narrowed by TanStack's discriminated types
  return <ProfileCard profile={data} />;
}
```

`queryKey` is an array — TanStack uses it for caching. Queries with the same key share cached data.

---

## 8.5 `useMutation<TData, TError, TVariables>`

```tsx
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface CreateProjectInput {
  title: string;
  description: string;
  url?: string;
  tags: string[];
}

function useCreateProject(userId: string) {
  const queryClient = useQueryClient();

  return useMutation<Project, Error, CreateProjectInput>({
    mutationFn: api.createProject,

    onSuccess: (newProject) => {
      // Invalidate the projects list so it refetches
      queryClient.invalidateQueries({ queryKey: ["projects", userId] });

      // Or optimistically update the cache
      queryClient.setQueryData<Project[]>(
        ["projects", userId],
        (old) => [...(old ?? []), newProject]
      );
    },

    onError: (error) => {
      console.error("Failed to create project:", error.message);
    },
  });
}

// Usage
function AddProjectForm({ userId }: { userId: string }) {
  const { mutate, isPending, isError, error } = useCreateProject(userId);

  const handleSubmit = (data: CreateProjectInput) => {
    mutate(data);
  };

  return (
    <form onSubmit={...}>
      {isError && <p>{error.message}</p>}
      <button type="submit" disabled={isPending}>
        {isPending ? "Saving…" : "Add Project"}
      </button>
    </form>
  );
}
```

---

## 8.6 Query Keys as Constants

Keep query keys in one place to prevent cache mismatches:

```typescript
// src/lib/queryKeys.ts
export const queryKeys = {
  profile: (username: string) => ["profile", username] as const,
  projects: (userId: string) => ["projects", userId] as const,
  project: (id: string) => ["project", id] as const,
  links: (userId: string) => ["links", userId] as const,
};

// Usage
useQuery({ queryKey: queryKeys.profile(username), queryFn: ... });
queryClient.invalidateQueries({ queryKey: queryKeys.projects(userId) });
```

---

## 8.7 Handling Loading States with Discrimination

TanStack Query v5 ships with status-based type narrowing:

```tsx
const result = useQuery<Profile, Error>({
  queryKey: queryKeys.profile(username),
  queryFn: () => api.getProfile(username),
});

// result.status is "pending" | "error" | "success"
switch (result.status) {
  case "pending":
    return <Skeleton />;
  case "error":
    return <Alert variant="error">{result.error.message}</Alert>;
  case "success":
    // result.data is Profile — fully narrowed
    return <ProfileView profile={result.data} />;
}
```

---

## Key Takeaways

| Pattern | Rule |
|---------|------|
| API layer | Typed fetch functions separate from query hooks |
| `useQuery` | `TData` = success type, `TError` = error type (usually `Error`) |
| `useMutation` | Three generics: `<TData, TError, TVariables>` |
| `queryKey` | Array — centralise in `queryKeys` object to avoid mismatches |
| Cache invalidation | `invalidateQueries` after mutations to keep UI in sync |
| Loading states | Use `status === "success"` narrowing — `data` becomes non-nullable |
