# Chapter 7 — Custom Hooks

## Learning Objectives

By the end of this chapter you will be able to:
- Write custom hooks with typed return values
- Choose between tuple and object return shapes
- Build generic hooks that work with any data type
- Type `useCallback` and `useMemo` correctly

---

## 7.1 Typing Return Values — Object vs Tuple

Custom hooks can return either an object or a tuple. The choice affects how callers use the hook.

**Object return** — named fields, easier to read, can't rename on destructure:
```tsx
interface UseToggleReturn {
  isOn: boolean;
  toggle: () => void;
  setOn: () => void;
  setOff: () => void;
}

function useToggle(initial = false): UseToggleReturn {
  const [isOn, setIsOn] = useState(initial);

  return {
    isOn,
    toggle: () => setIsOn((v) => !v),
    setOn: () => setIsOn(true),
    setOff: () => setIsOn(false),
  };
}

// Usage
const { isOn, toggle } = useToggle();
```

**Tuple return** — positional, caller can rename, used when order is the semantics (`useState` style):
```tsx
// `as const` makes TypeScript infer a tuple type, not an array
function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    const stored = localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : initial;
  });

  const set = (next: T) => {
    setValue(next);
    localStorage.setItem(key, JSON.stringify(next));
  };

  return [value, set] as const; // inferred as [T, (next: T) => void]
}

// Usage — caller renames freely
const [theme, setTheme] = useLocalStorage<"light" | "dark">("theme", "light");
```

---

## 7.2 Generic Hooks

When the hook logic is the same but the data type varies, add a type parameter:

```tsx
interface UseAsyncState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  execute: () => Promise<void>;
}

function useAsync<T>(asyncFn: () => Promise<T>): UseAsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await asyncFn();
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setIsLoading(false);
    }
  };

  return { data, isLoading, error, execute };
}

// T inferred as Profile
const { data: profile, isLoading, execute: loadProfile } = useAsync<Profile>(
  () => api.getProfile(userId)
);
```

---

## 7.3 `useCallback<T>` — Stable Function References

`useCallback` memoizes a function so its reference stays stable across renders (important for `useEffect` deps and `React.memo`):

```tsx
// Without annotation — TypeScript infers from the function body
const handleDelete = useCallback(
  (id: string) => {
    deleteProject(id);
  },
  [deleteProject]
);

// With explicit type when inference is ambiguous
const handleSearch = useCallback<React.ChangeEventHandler<HTMLInputElement>>(
  (e) => {
    setQuery(e.target.value);
  },
  []
);
```

Only use `useCallback` when:
1. The function is in a `useEffect` dependency array
2. The function is passed as a prop to a `React.memo`-wrapped component

Wrapping every function in `useCallback` adds overhead with no benefit.

---

## 7.4 `useMemo<T>` — Memoized Computed Values

```tsx
interface Project {
  id: string;
  title: string;
  tags: string[];
  featured: boolean;
}

function useFilteredProjects(projects: Project[], query: string): Project[] {
  return useMemo(() => {
    const q = query.toLowerCase();
    return projects.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [projects, query]); // re-runs only when projects or query changes
}
```

The return type of `useMemo` is inferred from the callback's return type. Annotate explicitly when needed: `useMemo<Project[]>(() => ..., deps)`.

---

## 7.5 Composing Hooks

Custom hooks can call other custom hooks:

```tsx
function useProfileEditor(userId: string) {
  // Compose existing hooks
  const { data: profile, isLoading, execute: reload } = useAsync(
    () => api.getProfile(userId)
  );

  const [form, setForm] = useState<ProfileForm | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    if (profile) {
      setForm({ name: profile.name, bio: profile.bio, avatarUrl: profile.avatarUrl });
    }
  }, [profile]);

  const save = async () => {
    if (!form) return;
    try {
      await api.updateProfile(userId, form);
      addToast("Profile saved", "success");
      await reload();
    } catch {
      addToast("Failed to save", "error");
    }
  };

  return { form, setForm, isLoading, save };
}
```

---

## 7.6 Rules of Hooks in TypeScript

TypeScript can't enforce the Rules of Hooks at the type level, but ESLint's `eslint-plugin-react-hooks` does. Ensure your config includes:

```json
{
  "plugins": ["react-hooks"],
  "rules": {
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

Key rules that trip up TypeScript developers:
- Don't call hooks inside conditions, loops, or nested functions
- Don't call hooks from regular (non-hook) functions

---

## Key Takeaways

| Pattern | Rule |
|---------|------|
| Object return | Named fields — use for hooks with 3+ related values |
| Tuple return | `as const` — use for `[value, setter]` pairs like `useState` |
| Generic hooks | Add `<T>` when the data type varies but the logic is the same |
| `useCallback` | Only for functions in `useEffect` deps or props to memoized components |
| `useMemo` | Only for expensive computations — not every derived value |
| Composing | Custom hooks can call other hooks — compose freely |
