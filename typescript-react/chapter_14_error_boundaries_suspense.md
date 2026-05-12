# Chapter 14 — Error Boundaries & Suspense

## Learning Objectives

By the end of this chapter you will be able to:
- Write a typed class-based `ErrorBoundary` component
- Use `react-error-boundary` for the common cases
- Lazy-load components with `React.lazy<T>` and `Suspense`
- Combine error boundaries and suspense for resilient data-loading UIs

---

## 14.1 Why Error Boundaries

When a component throws during render, React unmounts the entire tree — the user sees a blank page. Error boundaries catch throws from any child and render a fallback UI instead.

Error boundaries must be class components — hooks can't catch render errors.

---

## 14.2 Typed Class `ErrorBoundary`

```tsx
import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

interface ErrorBoundaryProps {
  fallback: ReactNode | ((error: Error) => ReactNode);
  children: ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    this.props.onError?.(error, info);
  }

  render(): ReactNode {
    const { error } = this.state;
    const { fallback, children } = this.props;

    if (error) {
      return typeof fallback === "function" ? fallback(error) : fallback;
    }
    return children;
  }
}
```

Usage:
```tsx
<ErrorBoundary
  fallback={(error) => (
    <div role="alert">
      <p>Something went wrong: {error.message}</p>
      <button onClick={() => window.location.reload()}>Reload</button>
    </div>
  )}
  onError={(error, info) => logToSentry(error, info)}
>
  <ProjectsAdmin />
</ErrorBoundary>
```

---

## 14.3 `react-error-boundary` Library

`react-error-boundary` covers the common patterns without writing a class component:

```bash
npm install react-error-boundary
```

```tsx
import { ErrorBoundary, useErrorBoundary } from "react-error-boundary";

function ErrorFallback({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  return (
    <div role="alert">
      <h2>Something went wrong</h2>
      <p>{error.message}</p>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}

// Usage
<ErrorBoundary
  FallbackComponent={ErrorFallback}
  onReset={() => queryClient.clear()}  // reset query cache on retry
>
  <AdminDashboard />
</ErrorBoundary>
```

`useErrorBoundary()` lets child components imperatively trigger the boundary:
```tsx
function ProjectLoader({ id }: { id: string }) {
  const { showBoundary } = useErrorBoundary();

  useEffect(() => {
    api.getProject(id).catch(showBoundary); // throws to nearest boundary
  }, [id, showBoundary]);
}
```

---

## 14.4 `React.lazy<T>` — Code Splitting

`React.lazy` accepts a function that returns a promise of a module with a default export:

```tsx
import { lazy, Suspense } from "react";

// TypeScript infers the component type from the dynamic import
const AdminDashboard = lazy(() => import("./features/admin/AdminDashboard"));
const ProjectEditor  = lazy(() => import("./features/admin/ProjectEditor"));
const LinksAdmin     = lazy(() => import("./features/admin/LinksAdmin"));
```

The module must export the component as `default`.

---

## 14.5 `Suspense` with Typed Fallback

```tsx
// src/App.tsx
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/:username" element={<PublicProfile />} />
        <Route
          path="/admin/*"
          element={
            <AdminGuard>
              {/* Suspense wraps the entire admin section */}
              <Suspense fallback={<AdminSkeleton />}>
                <Routes>
                  <Route index element={<AdminDashboard />} />
                  <Route path="projects/:id" element={<ProjectEditor />} />
                  <Route path="links" element={<LinksAdmin />} />
                </Routes>
              </Suspense>
            </AdminGuard>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
```

`Suspense`'s `fallback` prop is typed as `ReactNode` — any renderable value is valid.

---

## 14.6 Combining Error Boundary + Suspense

The pattern for data-loading components: wrap in both, with the error boundary outside:

```tsx
function ProjectsSection({ userId }: { userId: string }) {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Suspense fallback={<TableSkeleton rows={5} />}>
        <ProjectsTable userId={userId} />
      </Suspense>
    </ErrorBoundary>
  );
}

// ProjectsTable can throw (via a query that throws) or suspend (via lazy)
// ErrorBoundary catches throws, Suspense catches pending promises
function ProjectsTable({ userId }: { userId: string }) {
  const { data } = useQuery({
    queryKey: ["projects", userId],
    queryFn: () => api.getProjects(userId),
    suspense: true, // TanStack Query v4 option — throws pending promise
  });

  return <table>...</table>;
}
```

---

## 14.7 `ErrorInfo` Type

`componentDidCatch(error, info)` receives `ErrorInfo` which contains the component stack:

```tsx
import type { ErrorInfo } from "react";

function logError(error: Error, info: ErrorInfo): void {
  console.error("Component stack:", info.componentStack);
  // info.digest — React 18+ server-side error digest
}
```

---

## Key Takeaways

| Pattern | Rule |
|---------|------|
| Class ErrorBoundary | Required for render errors — can't use hooks |
| `react-error-boundary` | Use the library for all common patterns — don't reinvent |
| `React.lazy` | Module must default-export the component |
| `Suspense` | Fallback is `ReactNode` — wrap lazy + suspending queries |
| Boundary outside Suspense | Error boundary goes outside — catches both render errors and thrown promises |
| `useErrorBoundary` | Imperatively throw to the nearest boundary from any child |
