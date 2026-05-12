# Chapter 16 — Type Guards & Narrowing in React

## Learning Objectives

By the end of this chapter you will be able to:
- Use discriminated union props to eliminate impossible render states
- Write `is` type predicates to narrow types before rendering
- Narrow API responses inline in components
- Use `never` for exhaustive checks in JSX switch statements

---

## 16.1 Discriminated Union Props

Instead of passing multiple optional props that may conflict, use a discriminated union:

```tsx
// Bad — caller can pass conflicting combinations
interface AvatarProps {
  src?: string;
  initials?: string;
  isLoading?: boolean;
}

// Good — exactly one state at a time
type AvatarProps =
  | { state: "loading" }
  | { state: "image"; src: string; alt: string }
  | { state: "initials"; initials: string; color: string };

function Avatar(props: AvatarProps) {
  switch (props.state) {
    case "loading":
      return <div className="animate-pulse rounded-full bg-gray-200 h-10 w-10" />;
    case "image":
      // TypeScript knows: props.src and props.alt are available
      return <img src={props.src} alt={props.alt} className="rounded-full h-10 w-10" />;
    case "initials":
      // TypeScript knows: props.initials and props.color are available
      return (
        <div style={{ backgroundColor: props.color }} className="rounded-full h-10 w-10 flex items-center justify-center text-white font-medium">
          {props.initials}
        </div>
      );
  }
}
```

---

## 16.2 `is` Type Predicates

When you need to narrow a union inside a component, define a type predicate:

```tsx
interface SuccessResponse<T> {
  status: "success";
  data: T;
}

interface ErrorResponse {
  status: "error";
  message: string;
}

type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

// Type predicate — narrows `ApiResponse<T>` to `SuccessResponse<T>`
function isSuccess<T>(res: ApiResponse<T>): res is SuccessResponse<T> {
  return res.status === "success";
}

function ProfileBio({ response }: { response: ApiResponse<Profile> }) {
  if (!isSuccess(response)) {
    // TypeScript knows: response is ErrorResponse here
    return <p className="text-red-500">{response.message}</p>;
  }
  // TypeScript knows: response.data is Profile here
  return <p>{response.data.bio}</p>;
}
```

---

## 16.3 Narrowing API Responses Before Rendering

Never trust raw API data in JSX — narrow it at the boundary:

```tsx
interface RawApiProject {
  id: unknown;
  title: unknown;
  tags: unknown;
}

function isValidProject(raw: RawApiProject): raw is Project {
  return (
    typeof raw.id === "string" &&
    typeof raw.title === "string" &&
    Array.isArray(raw.tags)
  );
}

function ProjectList({ rawProjects }: { rawProjects: RawApiProject[] }) {
  const projects = rawProjects.filter(isValidProject);
  // projects is Project[] here — safe to render

  return (
    <ul>
      {projects.map((p) => (
        <li key={p.id}>{p.title}</li>
      ))}
    </ul>
  );
}
```

In practice, use Zod `.safeParse()` for this pattern:
```tsx
function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const raw = await api.getRawProjects();
      // Zod validates and narrows in one step
      return z.array(projectSchema).parse(raw);
    },
  });
}
```

---

## 16.4 Exhaustive `never` in JSX

Add an exhaustive check to catch missing cases when a union grows:

```tsx
type ProjectStatus = "draft" | "published" | "archived";

function StatusBadge({ status }: { status: ProjectStatus }) {
  switch (status) {
    case "draft":
      return <Badge variant="warning">Draft</Badge>;
    case "published":
      return <Badge variant="success">Published</Badge>;
    case "archived":
      return <Badge variant="default">Archived</Badge>;
    default: {
      // If you add a new status without updating this switch,
      // TypeScript errors here: Argument of type '"new-status"' is not assignable to parameter of type 'never'
      const exhaustiveCheck: never = status;
      throw new Error(`Unhandled status: ${exhaustiveCheck}`);
    }
  }
}
```

---

## 16.5 Narrowing in Conditional Rendering

```tsx
// Pattern: early return guards narrow the type for all code below
function ProjectCard({ project }: { project: Project | null }) {
  if (!project) return null;
  // project is `Project` from here down

  return (
    <Card>
      <Card.Title>{project.title}</Card.Title>
      {project.url && (
        // project.url is `string` here — narrowed from `string | null`
        <a href={project.url}>Visit</a>
      )}
    </Card>
  );
}
```

```tsx
// Pattern: computed display state to avoid nested ternaries
type DisplayState<T> =
  | { kind: "loading" }
  | { kind: "empty" }
  | { kind: "data"; items: T[] }
  | { kind: "error"; message: string };

function getDisplayState<T>(
  isLoading: boolean,
  isError: boolean,
  error: Error | null,
  data: T[] | undefined
): DisplayState<T> {
  if (isLoading) return { kind: "loading" };
  if (isError)   return { kind: "error", message: error?.message ?? "Unknown error" };
  if (!data || data.length === 0) return { kind: "empty" };
  return { kind: "data", items: data };
}

function ProjectList({ userId }: { userId: string }) {
  const { data, isLoading, isError, error } = useProjects(userId);
  const state = getDisplayState(isLoading, isError, error, data);

  switch (state.kind) {
    case "loading": return <Skeleton />;
    case "error":   return <Alert>{state.message}</Alert>;
    case "empty":   return <EmptyState />;
    case "data":    return <ul>{state.items.map((p) => <li key={p.id}>{p.title}</li>)}</ul>;
  }
}
```

---

## 16.6 Narrowing Component Props with `Extract`

```tsx
type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

// Only the "danger" variants — extracted from the union
type DangerVariant = Extract<ButtonVariant, "danger">;

// Only non-danger variants for a "safe action" button
type SafeVariant = Exclude<ButtonVariant, "danger">;

interface SafeButtonProps extends ComponentPropsWithoutRef<"button"> {
  variant: SafeVariant; // "primary" | "secondary" | "ghost" — no "danger"
}
```

---

## Key Takeaways

| Pattern | Rule |
|---------|------|
| Discriminated union props | Use `state: "loading" \| "image" \| "initials"` over multiple optionals |
| `is` predicates | Define in shared utils — reuse across components |
| Exhaustive `never` | Add default branch that assigns to `never` — catches missing cases |
| Early returns | Narrow type for everything below — no nested conditionals needed |
| Display state | Compute a union state from loading/error/data — one switch handles all |
| `Extract` / `Exclude` | Derive sub-unions for components that only accept a subset |
