# Chapter 18 — React 19 New Hooks

## Learning Objectives

By the end of this chapter you will be able to:
- Use `useOptimistic<T>` to show immediate UI feedback before server confirmation
- Use `useActionState` to manage form state tied to Server Actions
- Use `useFormStatus` to disable form controls while a submission is pending
- Use the `use(promise)` hook to unwrap promises inside components

---

## 18.1 `useOptimistic<T>` — Instant UI Before Server Confirms

`useOptimistic` lets you show an optimistic (assumed-success) state while an async action is in flight, then automatically reverts to the real state when the action completes.

```tsx
import { useOptimistic, useTransition } from "react";

interface Project {
  id: string;
  title: string;
  featured: boolean;
}

function ProjectRow({ project, onToggleFeatured }: {
  project: Project;
  onToggleFeatured: (id: string, featured: boolean) => Promise<void>;
}) {
  // useOptimistic<StateType, UpdateType>
  const [optimisticProject, addOptimistic] = useOptimistic<Project, boolean>(
    project,
    (currentState, newFeatured) => ({ ...currentState, featured: newFeatured })
  );

  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    const newFeatured = !optimisticProject.featured;

    startTransition(async () => {
      // Show optimistic state immediately
      addOptimistic(newFeatured);
      // Then actually update the server
      await onToggleFeatured(project.id, newFeatured);
      // On success, React syncs to real state
      // On error, React reverts to original project value
    });
  };

  return (
    <div>
      <span>{optimisticProject.title}</span>
      <button onClick={handleToggle} disabled={isPending}>
        {optimisticProject.featured ? "⭐ Featured" : "☆ Not Featured"}
      </button>
    </div>
  );
}
```

---

## 18.2 `useActionState` — Form State + Server Actions

`useActionState` ties a form's state to an async action function, typically a Next.js Server Action:

```tsx
import { useActionState } from "react";

// The action's return type
interface ProfileActionState {
  errors: Partial<Record<keyof ProfileFormData, string>>;
  message: string | null;
  success: boolean;
}

// Server action (Next.js)
async function updateProfileAction(
  prevState: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const name = formData.get("name") as string;
  const bio  = formData.get("bio") as string;

  if (!name) {
    return { errors: { name: "Name is required" }, message: null, success: false };
  }

  await db.profile.update({ where: { id: session.userId }, data: { name, bio } });
  return { errors: {}, message: "Profile updated!", success: true };
}

// Client component
function ProfileForm() {
  const [state, formAction, isPending] = useActionState<ProfileActionState, FormData>(
    updateProfileAction,
    { errors: {}, message: null, success: false }
  );

  return (
    <form action={formAction}>
      <input name="name" />
      {state.errors.name && <p>{state.errors.name}</p>}

      <textarea name="bio" />
      {state.errors.bio && <p>{state.errors.bio}</p>}

      {state.message && <p className={state.success ? "text-green-600" : "text-red-600"}>{state.message}</p>}

      <SubmitButton />
    </form>
  );
}
```

`useActionState` signature: `useActionState<State, Payload>(action, initialState)` returns `[state, dispatch, isPending]`.

---

## 18.3 `useFormStatus` — Submission-Aware Controls

`useFormStatus` must be called inside a component that is a child of a `<form>` element:

```tsx
import { useFormStatus } from "react-dom";

function SubmitButton({ label = "Save" }: { label?: string }) {
  const { pending } = useFormStatus();
  // `pending` is true while the parent form's action is in flight

  return (
    <button type="submit" disabled={pending}>
      {pending ? "Saving…" : label}
    </button>
  );
}

// `pending` also disables other controls during submission
function FormInput({ name, label }: { name: string; label: string }) {
  const { pending } = useFormStatus();

  return (
    <div>
      <label>{label}</label>
      <input name={name} disabled={pending} />
    </div>
  );
}
```

`useFormStatus` only works when:
1. The form uses an `action` function (Server Action or `useActionState` dispatch)
2. The component calling it is a **child** of the `<form>`, not the form itself

---

## 18.4 `use(promise)` — Unwrap Promises in Components

The `use` hook reads a resource (Promise or Context) during render. Combined with `Suspense`, it provides a clean way to await data:

```tsx
import { use, Suspense } from "react";

// Create the promise outside the component (important — not inside)
const profilePromise = api.getProfile("charlie");

function ProfileContent() {
  // `use` suspends the component until the promise resolves
  const profile = use(profilePromise);
  // profile is `Profile` here — no null check needed

  return <h1>{profile.name}</h1>;
}

function ProfilePage() {
  return (
    <Suspense fallback={<Skeleton />}>
      <ProfileContent />
    </Suspense>
  );
}
```

`use` with Context (alternative to `useContext`):
```tsx
function ThemeToggle() {
  // Same as useContext but can be called conditionally (unlike useContext)
  const { theme, setTheme } = use(ThemeContext)!;
  return <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>Toggle</button>;
}
```

---

## 18.5 React 19 Type Changes

React 19 updated several types:

```typescript
// `ref` is now a regular prop — no more forwardRef needed (React 19+)
function Input({ ref, ...props }: { ref?: React.Ref<HTMLInputElement> } & ComponentPropsWithoutRef<"input">) {
  return <input ref={ref} {...props} />;
}

// `use client` / `use server` directives — TypeScript can't check these
// but they must be the first line of a file
"use client";

// Context no longer requires .Provider — React 19
const ThemeContext = createContext<Theme>("light");
<ThemeContext value="dark">
  <App />
</ThemeContext>
```

---

## Key Takeaways

| Hook | Purpose | Key Type |
|------|---------|---------|
| `useOptimistic<S, A>` | Show instant UI, revert on error | `(state, updateFn)` → `[optimisticState, addOptimistic]` |
| `useActionState<S, P>` | Form state tied to an async action | Returns `[state, dispatch, isPending]` |
| `useFormStatus` | Disable controls while form submits | `{ pending: boolean }` |
| `use(promise)` | Suspend a component until a promise resolves | Return type inferred from promise |
| `use(context)` | Read context (can be called conditionally) | Same as `useContext` |
