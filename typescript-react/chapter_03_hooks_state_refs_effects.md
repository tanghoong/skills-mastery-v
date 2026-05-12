# Chapter 3 — Hooks: State, Refs & Effects

## Learning Objectives

By the end of this chapter you will be able to:
- Type `useState` for simple values, objects, and union state
- Type `useRef` for both DOM access and mutable storage
- Type `useReducer` with a discriminated union action type
- Write correctly typed `useEffect` callbacks with typed cleanup
- Understand the key difference between `useState` and `useEffect` and when to use each

---

## 3.1 `useState<T>` — When TypeScript Infers vs When You Must Annotate

TypeScript can infer the type when the initial value is concrete:

```tsx
// Inferred: string
const [name, setName] = useState("Charlie");

// Inferred: number
const [count, setCount] = useState(0);

// Inferred: boolean
const [isOpen, setIsOpen] = useState(false);
```

You must annotate when the initial value is `null`, `undefined`, or an empty structure:

```tsx
// Without annotation: useState<null> — setUser(user) would error
const [user, setUser] = useState<User | null>(null);

// Without annotation: useState<never[]> — push would error
const [items, setItems] = useState<string[]>([]);

// Union state — must be explicit
type Status = "idle" | "loading" | "success" | "error";
const [status, setStatus] = useState<Status>("idle");
```

---

## 3.2 Complex Object State

```tsx
interface ProfileForm {
  name: string;
  bio: string;
  avatarUrl: string;
}

const [form, setForm] = useState<ProfileForm>({
  name: "",
  bio: "",
  avatarUrl: "",
});

// Partial update — spread existing state
const handleChange = (field: keyof ProfileForm, value: string) => {
  setForm((prev) => ({ ...prev, [field]: value }));
};
```

`keyof ProfileForm` ensures `field` can only be `"name" | "bio" | "avatarUrl"` — no typos.

---

## 3.3 `useReducer<State, Action>` — Typed Dispatch

`useReducer` shines when multiple pieces of state update together or when updates share complex logic.

```tsx
interface CounterState {
  count: number;
  step: number;
}

// Discriminated union — each action has a unique `type`
type CounterAction =
  | { type: "increment" }
  | { type: "decrement" }
  | { type: "set_step"; payload: number }
  | { type: "reset" };

function counterReducer(state: CounterState, action: CounterAction): CounterState {
  switch (action.type) {
    case "increment":
      return { ...state, count: state.count + state.step };
    case "decrement":
      return { ...state, count: state.count - state.step };
    case "set_step":
      return { ...state, step: action.payload };
    case "reset":
      return { count: 0, step: 1 };
  }
}

function Counter() {
  const [state, dispatch] = useReducer(counterReducer, { count: 0, step: 1 });

  return (
    <div>
      <p>{state.count}</p>
      <button onClick={() => dispatch({ type: "increment" })}>+</button>
      <button onClick={() => dispatch({ type: "decrement" })}>-</button>
    </div>
  );
}
```

TypeScript narrows `action` inside each `case` — `action.payload` is only accessible in the `set_step` branch.

---

## 3.4 `useState` vs `useEffect` — The Core Difference

| Hook | What it is | When to use |
|------|-----------|-------------|
| `useState` | Stores a value — re-renders the component when it changes | Tracking UI state: form inputs, toggles, counters, fetched data |
| `useEffect` | Runs side effects after the DOM updates | Syncing to external systems: timers, subscriptions, DOM manipulation, fetching data |

The mental model:
- **`useState`** answers: *"What does my component remember?"*
- **`useEffect`** answers: *"What should my component do when something changes?"*

```tsx
function LiveClock() {
  // useState: remembers the current time
  const [time, setTime] = useState(new Date());

  // useEffect: sets up a timer side effect — runs after render
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);

    // cleanup — runs before the next effect or on unmount
    return () => clearInterval(id);
  }, []); // empty deps = run once on mount

  return <p>{time.toLocaleTimeString()}</p>;
}
```

---

## 3.5 `useEffect` — Typing Cleanup

The return type of a `useEffect` callback is `void | (() => void)`. TypeScript enforces this:

```tsx
useEffect(() => {
  // Setup
  const subscription = api.subscribe(handler);

  // Cleanup — must return void or a cleanup function
  return () => subscription.unsubscribe();
}, [handler]);
```

Common mistake — async effects don't work as `useEffect` callbacks directly:

```tsx
// Wrong — async returns Promise, not cleanup function
useEffect(async () => {
  const data = await fetch("/api/profile");
  // ...
}, []);

// Correct — define async function inside, call it immediately
useEffect(() => {
  async function load() {
    const data = await fetch("/api/profile");
    // ...
  }
  void load();
}, []);
```

---

## 3.6 Dependency Array Types

The dependency array accepts any value. TypeScript checks that variables you reference inside the effect are listed:

```tsx
function UserProfile({ userId }: { userId: string }) {
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    // userId is used — must be in deps
    fetchProfile(userId).then(setProfile);
  }, [userId]); // TypeScript + eslint-plugin-react-hooks enforce this

  return profile ? <div>{profile.name}</div> : null;
}
```

Install `eslint-plugin-react-hooks` to get automatic warnings when deps are missing.

---

## 3.7 `useRef<T>` — Two Use Cases

`useRef` has two distinct use cases with different types:

**DOM access:**
```tsx
// T = the DOM element type, initial value = null
function AutoFocusInput() {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // ref.current can be null (before mount) — must check
    inputRef.current?.focus();
  }, []);

  return <input ref={inputRef} />;
}
```

**Mutable storage (does not trigger re-render):**
```tsx
// T = value type, initial value provided
function Timer() {
  const intervalId = useRef<ReturnType<typeof setInterval> | null>(null);
  const [seconds, setSeconds] = useState(0);

  const start = () => {
    intervalId.current = setInterval(() => setSeconds((s) => s + 1), 1000);
  };

  const stop = () => {
    if (intervalId.current !== null) {
      clearInterval(intervalId.current);
    }
  };

  return (
    <div>
      <p>{seconds}s</p>
      <button onClick={start}>Start</button>
      <button onClick={stop}>Stop</button>
    </div>
  );
}
```

The key difference: `useRef` for DOM refs always starts as `null`. `useRef` for mutable values starts with the actual initial value.

---

## Key Takeaways

| Hook | Type Rule |
|------|-----------|
| `useState` | Annotate when initial value is `null`, `[]`, `{}`, or a union |
| `useReducer` | Actions as discriminated unions — one `type` per action shape |
| `useEffect` | Return `void` or a cleanup `() => void` — never `async` directly |
| `useRef` DOM | `useRef<HTMLElement>(null)` — always check `.current !== null` |
| `useRef` storage | `useRef<T>(initialValue)` — does not trigger re-render |
| `useState` vs `useEffect` | State = memory; Effect = sync to the outside world |
