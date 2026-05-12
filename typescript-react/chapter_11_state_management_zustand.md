# Chapter 11 — State Management with Zustand

## Learning Objectives

By the end of this chapter you will be able to:
- Create a fully typed Zustand store with `create<State>()`
- Write typed selectors and avoid unnecessary re-renders
- Compose a store from slices for larger apps
- Add devtools middleware without losing types

---

## 11.1 Why Zustand (Over Context for App State)

React Context re-renders every consumer when the value changes. For auth or theme that's fine. For frequently-changing state (cart, filters, UI flags), it causes cascade re-renders.

Zustand uses subscriptions — components only re-render when the slice of state they subscribe to changes.

```bash
npm install zustand
```

---

## 11.2 Basic Typed Store

```typescript
// src/stores/useAuthStore.ts
import { create } from "zustand";

interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "viewer";
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setUser: (user: User, token: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  setUser: (user, token) =>
    set({ user, token, isAuthenticated: true }),

  clearAuth: () =>
    set({ user: null, token: null, isAuthenticated: false }),
}));
```

Usage:
```tsx
function Header() {
  // Subscribe only to user — re-renders only when user changes
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  return (
    <header>
      {user ? (
        <>
          <span>{user.name}</span>
          <button onClick={clearAuth}>Logout</button>
        </>
      ) : (
        <Link to="/login">Login</Link>
      )}
    </header>
  );
}
```

---

## 11.3 Selector Pattern — Avoid Re-renders

Each `useStore(selector)` call creates an independent subscription. Components only re-render when the selected value changes.

```tsx
// Good — re-renders only when `user.name` changes
const name = useAuthStore((state) => state.user?.name);

// Good — re-renders only when `isAuthenticated` changes
const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

// Bad — always returns a new object reference → re-renders every time
const { user, token } = useAuthStore((state) => ({ user: state.user, token: state.token }));

// If you need multiple values, use shallow comparison
import { useShallow } from "zustand/react/shallow";
const { user, token } = useAuthStore(
  useShallow((state) => ({ user: state.user, token: state.token }))
);
```

---

## 11.4 Slice Pattern for Larger Stores

For complex state, split into slices and combine:

```typescript
// src/stores/slices/projectsSlice.ts
import type { StateCreator } from "zustand";

interface Project {
  id: string;
  title: string;
  featured: boolean;
}

interface ProjectsSlice {
  projects: Project[];
  selectedProjectId: string | null;
  setProjects: (projects: Project[]) => void;
  selectProject: (id: string | null) => void;
  toggleFeatured: (id: string) => void;
}

export const createProjectsSlice: StateCreator<ProjectsSlice> = (set) => ({
  projects: [],
  selectedProjectId: null,

  setProjects: (projects) => set({ projects }),

  selectProject: (id) => set({ selectedProjectId: id }),

  toggleFeatured: (id) =>
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id ? { ...p, featured: !p.featured } : p
      ),
    })),
});
```

```typescript
// src/stores/slices/uiSlice.ts
import type { StateCreator } from "zustand";

interface UISlice {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
}

export const createUISlice: StateCreator<UISlice> = (set) => ({
  sidebarOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  closeSidebar: () => set({ sidebarOpen: false }),
});
```

```typescript
// src/stores/useAppStore.ts
import { create } from "zustand";
import { createProjectsSlice, type ProjectsSlice } from "./slices/projectsSlice";
import { createUISlice, type UISlice } from "./slices/uiSlice";

type AppStore = ProjectsSlice & UISlice;

export const useAppStore = create<AppStore>()((...args) => ({
  ...createProjectsSlice(...args),
  ...createUISlice(...args),
}));
```

---

## 11.5 Persist Middleware

```typescript
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface ThemeStore {
  theme: "light" | "dark" | "system";
  setTheme: (theme: "light" | "dark" | "system") => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      theme: "system",
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: "devlink-theme",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ theme: state.theme }), // only persist `theme`
    }
  )
);
```

---

## 11.6 Devtools Middleware

```typescript
import { create } from "zustand";
import { devtools } from "zustand/middleware";

export const useAuthStore = create<AuthState>()(
  devtools(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setUser: (user, token) =>
        set({ user, token, isAuthenticated: true }, false, "auth/setUser"),
      clearAuth: () =>
        set({ user: null, token: null, isAuthenticated: false }, false, "auth/clearAuth"),
    }),
    { name: "AuthStore" }
  )
);
```

The third argument to `set` (`"auth/setUser"`) is the action name — it appears in Redux DevTools.

---

## Key Takeaways

| Pattern | Rule |
|---------|------|
| `create<State>()` | Type the full state + actions shape in one interface |
| Selectors | `useStore((s) => s.field)` — subscribe to minimal state |
| Multiple values | Use `useShallow` when selecting multiple fields at once |
| Slices | `StateCreator<SliceType>` — compose in a root store |
| `persist` | Combine with `partialize` to avoid persisting sensitive data |
| Devtools | Pass action names as third arg to `set` for readable history |
