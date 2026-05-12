# Chapter 5 — Context & Providers

## Learning Objectives

By the end of this chapter you will be able to:
- Create fully typed React context without `undefined` pitfalls
- Build a typed provider pattern with a custom hook
- Type an auth context and a theme context for DevLink
- Understand when context is the right tool (and when it isn't)

---

## 5.1 The `undefined` Problem

The naive approach creates a context with no default, which types the value as `T | undefined`:

```tsx
// Problematic — every consumer must handle `undefined`
const UserContext = createContext<User | undefined>(undefined);

function Profile() {
  const user = useContext(UserContext);
  // TypeScript forces you to check: user?.name — annoying everywhere
}
```

The standard fix: provide a typed default of `undefined` but throw in the custom hook if the context is missing:

```tsx
function useUser(): User {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used inside <UserProvider>");
  return ctx; // now typed as `User`, not `User | undefined`
}
```

---

## 5.2 Typed Context Pattern (Preferred)

```tsx
import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

// Internal — `undefined` default is intentional
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await authApi.login(email, password);
      setUser(result.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Public — throws if used outside provider
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
```

Export the provider and the hook, never the context itself. Consumers only call `useAuth()` — they never interact with `AuthContext` directly.

---

## 5.3 Typed Theme Context

```tsx
type Theme = "light" | "dark" | "system";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("system");

  const resolvedTheme: "light" | "dark" =
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme;

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
```

---

## 5.4 Context with a Reducer

For complex context values that involve multi-step updates, pair context with `useReducer`:

```tsx
type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

type ToastAction =
  | { type: "add"; payload: Omit<Toast, "id"> }
  | { type: "remove"; id: string };

function toastReducer(state: Toast[], action: ToastAction): Toast[] {
  switch (action.type) {
    case "add":
      return [...state, { ...action.payload, id: crypto.randomUUID() }];
    case "remove":
      return state.filter((t) => t.id !== action.id);
  }
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (message: string, type: ToastType) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, dispatch] = useReducer(toastReducer, []);

  const addToast = (message: string, type: ToastType) =>
    dispatch({ type: "add", payload: { message, type } });

  const removeToast = (id: string) => dispatch({ type: "remove", id });

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
```

---

## 5.5 Nesting Providers in App Root

```tsx
// src/main.tsx
import { AuthProvider } from "./features/auth/AuthProvider";
import { ThemeProvider } from "./features/theme/ThemeProvider";
import { ToastProvider } from "./features/toast/ToastProvider";

function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          {children}
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </React.StrictMode>
);
```

---

## 5.6 When NOT to Use Context

Context is not a state management solution — it's a dependency injection mechanism. Use it for:
- Auth state (user object, login/logout)
- Theme / preferences
- Toast/notification queue
- Feature flags

Do NOT use it for:
- Frequently-changing state (every render of every consumer re-renders)
- Server data (use TanStack Query — Ch 8)
- Complex app state with many updaters (use Zustand — Ch 11)

---

## Key Takeaways

| Pattern | Rule |
|---------|------|
| Default value | Always `undefined` — never provide a fake default object |
| Consumer access | Always through a custom hook that throws on missing provider |
| Export | Export the provider + hook; keep `Context` object internal |
| Nesting | Compose providers in a single `<AppProviders>` component |
| Scope | Auth, theme, notifications — not server data or complex app state |
