# Chapter 6 — Component Patterns: forwardRef, Generic Components & Polymorphic `as`

## Learning Objectives

By the end of this chapter you will be able to:
- Use `forwardRef<Ref, Props>` to expose DOM references from components
- Implement `useImperativeHandle` to expose a typed imperative API
- Write generic components with constrained type parameters
- Build a polymorphic component using the `as` prop pattern

---

## 6.1 `forwardRef<Ref, Props>`

When a parent needs direct DOM access to a child's element (auto-focus, measuring, scrolling), use `forwardRef`:

```tsx
import { forwardRef } from "react";
import type { ComponentPropsWithoutRef } from "react";

interface InputProps extends ComponentPropsWithoutRef<"input"> {
  label: string;
  error?: string;
}

// forwardRef<RefType, PropsType>
const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, ...rest }, ref) => {
    return (
      <div>
        <label>{label}</label>
        <input ref={ref} {...rest} />
        {error && <p role="alert">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input"; // required for React DevTools
```

Usage:
```tsx
const emailRef = useRef<HTMLInputElement>(null);

<Input ref={emailRef} label="Email" type="email" />

// Parent can call:
emailRef.current?.focus();
```

Always set `.displayName` — React DevTools shows the string name, otherwise it shows "ForwardRef".

---

## 6.2 `useImperativeHandle` — Typed Imperative API

When you want to expose a custom API (not just the raw DOM element), use `useImperativeHandle`:

```tsx
import { forwardRef, useRef, useImperativeHandle } from "react";

// Define exactly what the parent can call
interface DialogHandle {
  open: () => void;
  close: () => void;
  isOpen: () => boolean;
}

interface DialogProps {
  title: string;
  children: ReactNode;
}

const Dialog = forwardRef<DialogHandle, DialogProps>(
  ({ title, children }, ref) => {
    const [isOpen, setIsOpen] = useState(false);

    useImperativeHandle(ref, () => ({
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      isOpen: () => isOpen,
    }));

    if (!isOpen) return null;

    return (
      <div role="dialog" aria-modal>
        <h2>{title}</h2>
        <div>{children}</div>
        <button onClick={() => setIsOpen(false)}>Close</button>
      </div>
    );
  }
);

Dialog.displayName = "Dialog";
```

Usage:
```tsx
const dialogRef = useRef<DialogHandle>(null);

<Dialog ref={dialogRef} title="Confirm Delete">...</Dialog>

// Parent controls the dialog imperatively
<button onClick={() => dialogRef.current?.open()}>Delete</button>
```

The parent can only call `open()`, `close()`, and `isOpen()` — it has no access to internal state or the underlying DOM element.

---

## 6.3 Generic Components

When a component works with different data types, make it generic:

```tsx
interface SelectProps<T> {
  options: T[];
  value: T | null;
  onChange: (value: T) => void;
  getLabel: (option: T) => string;
  getValue: (option: T) => string;
  placeholder?: string;
}

// Generic component — T is inferred from the `options` prop
function Select<T>({
  options,
  value,
  onChange,
  getLabel,
  getValue,
  placeholder = "Select…",
}: SelectProps<T>) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = options.find((o) => getValue(o) === e.target.value);
    if (selected) onChange(selected);
  };

  return (
    <select
      value={value !== null ? getValue(value) : ""}
      onChange={handleChange}
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {options.map((o) => (
        <option key={getValue(o)} value={getValue(o)}>
          {getLabel(o)}
        </option>
      ))}
    </select>
  );
}
```

Usage — TypeScript infers `T` from the options array:
```tsx
interface Platform {
  id: string;
  name: string;
  icon: string;
}

const platforms: Platform[] = [
  { id: "github", name: "GitHub", icon: "🐙" },
  { id: "twitter", name: "Twitter", icon: "🐦" },
];

<Select
  options={platforms}
  value={selected}          // TypeScript knows: Platform | null
  onChange={setSelected}    // TypeScript knows: (v: Platform) => void
  getLabel={(p) => p.name}
  getValue={(p) => p.id}
/>
```

---

## 6.4 The Polymorphic `as` Prop Pattern

A polymorphic component renders different HTML elements while keeping its typed props:

```tsx
import type { ElementType, ComponentPropsWithoutRef } from "react";

// The magic type: merges component props with whatever `as` element accepts
type PolymorphicProps<T extends ElementType, Props = {}> = Props &
  Omit<ComponentPropsWithoutRef<T>, keyof Props> & {
    as?: T;
  };

interface TextOwnProps {
  size?: "sm" | "md" | "lg" | "xl";
  weight?: "normal" | "medium" | "bold";
}

type TextProps<T extends ElementType = "p"> = PolymorphicProps<T, TextOwnProps>;

function Text<T extends ElementType = "p">({
  as,
  size = "md",
  weight = "normal",
  ...rest
}: TextProps<T>) {
  const Component = as ?? "p";
  return <Component data-size={size} data-weight={weight} {...rest} />;
}
```

Usage:
```tsx
// Renders <p> by default
<Text>Hello world</Text>

// Renders <h1> — TypeScript checks h1-specific props
<Text as="h1" size="xl" weight="bold">DevLink</Text>

// Renders <a> — TypeScript requires `href`
<Text as="a" href="/profile" size="sm">View profile</Text>

// Renders a custom component — its props are merged in
<Text as={Link} to="/admin" size="md">Dashboard</Text>
```

---

## 6.5 Constrained Generics in Components

Use `extends` to constrain what types a generic component accepts:

```tsx
// T must have at least `id` (for key) and `label` (for display)
interface ListProps<T extends { id: string; label: string }> {
  items: T[];
  onSelect: (item: T) => void;
  renderExtra?: (item: T) => ReactNode;
}

function List<T extends { id: string; label: string }>({
  items,
  onSelect,
  renderExtra,
}: ListProps<T>) {
  return (
    <ul>
      {items.map((item) => (
        <li key={item.id}>
          <button onClick={() => onSelect(item)}>{item.label}</button>
          {renderExtra?.(item)}
        </li>
      ))}
    </ul>
  );
}
```

---

## Key Takeaways

| Pattern | When to Use |
|---------|------------|
| `forwardRef` | Parent needs to call DOM methods (focus, scroll, measure) on a child |
| `useImperativeHandle` | Parent needs a controlled imperative API — not raw DOM access |
| Generic components | Same UI logic, different data types (`Select<T>`, `List<T>`, `Table<T>`) |
| Polymorphic `as` | Component renders different elements but keeps its own typed props |
| Constrained generics | Use `T extends { id: string }` to require specific shape on the type param |
