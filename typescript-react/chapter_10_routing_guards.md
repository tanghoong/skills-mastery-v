# Chapter 10 — Routing & Guards

## Learning Objectives

By the end of this chapter you will be able to:
- Set up a typed route configuration with React Router v6
- Use `useParams<T>`, `useSearchParams`, and `useNavigate` with types
- Build a typed auth guard that protects routes
- Understand the difference between redirect-based and component-based guards

---

## 10.1 React Router v6 Setup

```bash
npm install react-router-dom
```

```tsx
// src/App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/:username" element={<PublicProfile />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<AdminGuard />}>
          <Route index element={<Dashboard />} />
          <Route path="profile" element={<ProfileEditor />} />
          <Route path="projects" element={<ProjectsAdmin />} />
          <Route path="projects/:id" element={<ProjectEditor />} />
          <Route path="links" element={<LinksAdmin />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## 10.2 `useParams<T>` — Typed Route Parameters

Without a type parameter, `useParams()` returns `Record<string, string | undefined>`. Add a type:

```tsx
import { useParams } from "react-router-dom";

// Public profile page — :username is guaranteed by the route
function PublicProfile() {
  const { username } = useParams<{ username: string }>();

  // username is `string | undefined` — even with the type, the router
  // doesn't guarantee the param exists (could be a mismatched route)
  if (!username) return null;

  return <ProfileView username={username} />;
}

// Admin project editor — :id from /admin/projects/:id
function ProjectEditor() {
  const { id } = useParams<{ id: string }>();
  if (!id) return <Navigate to="/admin/projects" replace />;

  return <ProjectForm projectId={id} />;
}
```

Always narrow `param | undefined` — the type parameter documents intent but doesn't remove the `undefined`.

---

## 10.3 `useSearchParams` — Typed Query String

```tsx
import { useSearchParams } from "react-router-dom";

function ProjectsAdmin() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Always returns string | null — parse manually
  const page = Number(searchParams.get("page") ?? "1");
  const query = searchParams.get("q") ?? "";

  const handleSearch = (q: string) => {
    setSearchParams((prev) => {
      prev.set("q", q);
      prev.set("page", "1");
      return prev;
    });
  };

  return <ProjectsTable page={page} query={query} onSearch={handleSearch} />;
}
```

---

## 10.4 `useNavigate` — Typed Navigation

```tsx
import { useNavigate } from "react-router-dom";

function LoginForm() {
  const navigate = useNavigate();

  const handleSuccess = () => {
    // Navigate to a path
    navigate("/admin");

    // Navigate with state
    navigate("/admin", { state: { fromLogin: true } });

    // Navigate back
    navigate(-1);

    // Replace history (no back button)
    navigate("/admin", { replace: true });
  };
}
```

For typed state, create a type for each route's state:
```tsx
interface LoginRedirectState {
  from: string;
}

// Navigate with typed state
navigate("/login", { state: { from: location.pathname } satisfies LoginRedirectState });

// Read typed state
const location = useLocation();
const state = location.state as LoginRedirectState | null;
```

---

## 10.5 Route Guard Pattern — Component-Based

The cleanest guard wraps a route's children in a component that checks auth:

```tsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../features/auth/AuthProvider";

function AdminGuard() {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <Spinner />;
  }

  if (!user) {
    // Preserve the intended destination in state
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Render nested routes
  return <Outlet />;
}
```

Used in the route config:
```tsx
<Route path="/admin" element={<AdminGuard />}>
  <Route index element={<Dashboard />} />
  <Route path="profile" element={<ProfileEditor />} />
  {/* All children are protected */}
</Route>
```

---

## 10.6 Role-Based Guard

When different roles see different things, extend the guard:

```tsx
type Role = "admin" | "editor" | "viewer";

interface RoleGuardProps {
  allowedRoles: Role[];
  fallback?: React.ReactNode;
}

function RoleGuard({ allowedRoles, fallback = <Navigate to="/403" replace /> }: RoleGuardProps) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  if (!allowedRoles.includes(user.role as Role)) {
    return <>{fallback}</>;
  }

  return <Outlet />;
}

// Usage
<Route element={<RoleGuard allowedRoles={["admin"]} />}>
  <Route path="settings" element={<AdminSettings />} />
</Route>
```

---

## 10.7 Redirect After Login

When the guard redirects to `/login`, it should send the user back to the original page after login:

```tsx
function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // Where they came from (default to admin if direct login)
  const from = (location.state as { from?: string } | null)?.from ?? "/admin";

  const handleLogin = async (data: LoginFormData) => {
    await login(data.email, data.password);
    navigate(from, { replace: true }); // replace so back button doesn't return to login
  };

  return <LoginForm onSubmit={handleLogin} />;
}
```

---

## Key Takeaways

| Pattern | Rule |
|---------|------|
| `useParams<T>` | Always narrow `param \| undefined` — the type doesn't guarantee presence |
| `useSearchParams` | Returns `string \| null` — always provide a fallback with `?? ""` |
| `useNavigate` | Use `replace: true` after auth actions so back button works correctly |
| Route guard | Wrap nested routes with a guard component using `<Outlet />` |
| Redirect state | Pass `{ from: location.pathname }` so login can send users back |
| Role guard | Separate `AdminGuard` (auth) from `RoleGuard` (permissions) |
