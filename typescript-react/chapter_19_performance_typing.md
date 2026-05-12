# Chapter 19 — Performance Typing

## Learning Objectives

By the end of this chapter you will be able to:
- Apply `React.memo<T>` correctly with typed props comparison
- Type `useMemo` and `useCallback` to avoid reference instability
- Use `React.Profiler` with its typed callback
- Identify when TypeScript type signatures indicate a performance problem

---

## 19.1 `React.memo<T>` — Memoized Components

`React.memo` wraps a component so it only re-renders when its props change (by shallow equality):

```tsx
interface ProjectCardProps {
  project: Project;
  onEdit:   (id: string) => void;
  onDelete: (id: string) => void;
}

// Memoized — skips re-render if project, onEdit, onDelete refs are stable
const ProjectCard = React.memo<ProjectCardProps>(function ProjectCard({
  project,
  onEdit,
  onDelete,
}) {
  return (
    <Card>
      <Card.Title>{project.title}</Card.Title>
      <Card.Footer>
        <Button onClick={() => onEdit(project.id)}>Edit</Button>
        <Button variant="danger" onClick={() => onDelete(project.id)}>Delete</Button>
      </Card.Footer>
    </Card>
  );
});
```

`React.memo` only helps if the props are actually stable. If the parent re-creates `onEdit` on every render, `memo` does nothing:

```tsx
// Bad — new function reference every render → memo always re-renders
function ProjectList({ projects }: { projects: Project[] }) {
  return projects.map((p) => (
    <ProjectCard
      key={p.id}
      project={p}
      onEdit={(id) => navigate(`/admin/projects/${id}`)}  // new reference each render
      onDelete={(id) => deleteProject(id)}
    />
  ));
}

// Good — stable references with useCallback
function ProjectList({ projects }: { projects: Project[] }) {
  const handleEdit   = useCallback((id: string) => navigate(`/admin/projects/${id}`), [navigate]);
  const handleDelete = useCallback((id: string) => deleteProject(id), [deleteProject]);

  return projects.map((p) => (
    <ProjectCard
      key={p.id}
      project={p}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  ));
}
```

---

## 19.2 Custom Comparison Function

For complex props where shallow equality isn't enough:

```tsx
const ProjectCard = React.memo<ProjectCardProps>(
  function ProjectCard({ project, onEdit, onDelete }) { ... },
  (prevProps, nextProps) => {
    // Return true to SKIP re-render (props are "equal")
    // Return false to re-render
    return (
      prevProps.project.id === nextProps.project.id &&
      prevProps.project.title === nextProps.project.title &&
      prevProps.project.featured === nextProps.project.featured &&
      prevProps.onEdit === nextProps.onEdit &&
      prevProps.onDelete === nextProps.onDelete
    );
  }
);
```

The comparison function is typed: `(prevProps: T, nextProps: T) => boolean`.

---

## 19.3 `useMemo` — Expensive Computations Only

```tsx
// Good use case — expensive filter + sort that runs on every render
const visibleProjects = useMemo(() => {
  return projects
    .filter((p) => p.title.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => (a.featured === b.featured ? 0 : a.featured ? -1 : 1));
}, [projects, query]);

// Bad use case — trivial, not worth memoizing
const projectCount = useMemo(() => projects.length, [projects]); // just use projects.length
```

The return type of `useMemo` is inferred. Annotate when the inference is wrong:
```tsx
const groupedProjects = useMemo<Map<string, Project[]>>(() => {
  const map = new Map<string, Project[]>();
  projects.forEach((p) => {
    p.tags.forEach((tag) => {
      map.set(tag, [...(map.get(tag) ?? []), p]);
    });
  });
  return map;
}, [projects]);
```

---

## 19.4 `useCallback` — Stable References

```tsx
// Typed explicitly when inference struggles
const handleSearch = useCallback<React.ChangeEventHandler<HTMLInputElement>>(
  (e) => setQuery(e.target.value),
  []
);

// Typed via inference — prefer this when it works
const handleDelete = useCallback(
  (id: string): Promise<void> => api.deleteProject(id),
  [] // api is stable
);
```

---

## 19.5 `React.Profiler` — Typed Callback

`React.Profiler` wraps a subtree and calls `onRender` with timing data:

```tsx
import { Profiler } from "react";
import type { ProfilerOnRenderCallback } from "react";

const onRender: ProfilerOnRenderCallback = (
  id,             // string — the Profiler's `id` prop
  phase,          // "mount" | "update" | "nested-update"
  actualDuration, // number — time spent rendering
  baseDuration,   // number — estimated time without memoization
  startTime,      // number — when React began rendering
  commitTime      // number — when React committed the update
) => {
  if (actualDuration > 16) {
    console.warn(`Slow render in "${id}": ${actualDuration.toFixed(1)}ms (${phase})`);
  }
};

function AdminDashboard() {
  return (
    <Profiler id="AdminDashboard" onRender={onRender}>
      <ProjectsTable />
      <LinksTable />
    </Profiler>
  );
}
```

`Profiler` is only active in development mode — it's a no-op in production builds.

---

## 19.6 Type Signatures as Performance Signals

Some TypeScript signatures hint at a performance problem before you profile:

```tsx
// Red flag: prop is `object` or `{}` — always a new reference
interface BadProps {
  config: object;           // any object — memo won't work
  options: Record<string, unknown>; // new ref each render if created inline
}

// Better: specific shape — memoization comparison is meaningful
interface GoodProps {
  config: {
    pageSize: number;
    sortable: boolean;
  };
}

// Red flag: function prop without useCallback in the caller
interface TableProps {
  onRowClick: (row: Project) => void; // will always be a new reference if not memoized
}
```

When you see `() => void` props in a memoized component, verify the caller wraps them in `useCallback`.

---

## Key Takeaways

| Tool | When to Use |
|------|------------|
| `React.memo` | Component re-renders with same props — props must be stable |
| Custom comparator | When shallow equality misses relevant fields |
| `useCallback` | Function passed as prop to `memo` component, or in `useEffect` deps |
| `useMemo` | Expensive computation (filter, sort, map over large arrays) |
| `Profiler` | Identify slow renders — not for permanent production instrumentation |
| Type as signal | `object`, `{}`, inline object literals in props → memoization won't help |
