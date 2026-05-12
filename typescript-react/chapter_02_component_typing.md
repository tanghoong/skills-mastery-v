# Chapter 2 — Component Typing

## Learning Objectives

By the end of this chapter you will be able to:
- Write typed props interfaces for any component
- Distinguish `ReactNode`, `ReactElement`, and `JSX.Element`
- Type `children` correctly for different use cases
- Understand when to use `interface` vs `type` for props
- Avoid the common `FC<>` pitfalls

---

## 2.1 Props Interfaces

Every component's props belong in a named interface. Never inline them or use `any`.

```tsx
// Bad
function Button({ label, onClick }: { label: string; onClick: () => void }) {}

// Good
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary" | "ghost";
  disabled?: boolean;
}

function Button({ label, onClick, variant = "primary", disabled = false }: ButtonProps) {
  return (
    <button onClick={onClick} disabled={disabled} data-variant={variant}>
      {label}
    </button>
  );
}
```

Named interfaces are preferred over inline types because:
- They appear in hover tooltips and error messages
- They can be extended by child components
- They encourage you to name the concept

---

## 2.2 `interface` vs `type` for Props

| Use `interface` when | Use `type` when |
|---------------------|-----------------|
| Describing an object shape (props, models) | Union types: `"admin" \| "user"` |
| You may need to extend it | Mapped types, conditional types |
| It represents a named concept | Computed/derived types |

```tsx
// Interface — object shape, extendable
interface CardProps {
  title: string;
  children: ReactNode;
}

// Type — union, not extendable
type AvatarSize = "sm" | "md" | "lg";

// Type — derived from another type
type AdminCardProps = CardProps & { onDelete: () => void };
```

---

## 2.3 `FC<>` vs Function Declaration

```tsx
import type { FC, ReactNode } from "react";

// FC<> approach — avoid this
const Card: FC<CardProps> = ({ title, children }) => { ... };

// Function declaration — prefer this
function Card({ title, children }: CardProps): JSX.Element {
  return <div><h2>{title}</h2>{children}</div>;
}
```

Why avoid `FC<>`:
- `FC` adds an implicit `children?: ReactNode` even if you don't want it (pre-React 18 types)
- Return type is `ReactElement | null`, masking some type errors
- The function form is explicit about what it accepts and returns

---

## 2.4 `ReactNode` vs `ReactElement` vs `JSX.Element`

| Type | What it accepts | When to use |
|------|----------------|-------------|
| `ReactNode` | Elements, strings, numbers, arrays, null, boolean | `children` prop — widest, most permissive |
| `ReactElement` | Only React elements (JSX) | When you need to call `React.cloneElement` on it |
| `JSX.Element` | Same as `ReactElement` (alias) | Component return types |

```tsx
import type { ReactNode, ReactElement } from "react";

// children that can be anything renderable
interface LayoutProps {
  children: ReactNode;
}

// children that must be a real JSX element (so you can clone it)
interface CloneWrapperProps {
  children: ReactElement;
}

// A component's return type
function Header(): JSX.Element {
  return <header>DevLink</header>;
}
```

---

## 2.5 Typing `children`

```tsx
import type { ReactNode, PropsWithChildren } from "react";

// Option 1 — explicit (preferred, most flexible)
interface PanelProps {
  title: string;
  children: ReactNode;
}

// Option 2 — PropsWithChildren helper
type PanelProps2 = PropsWithChildren<{ title: string }>;

// Option 3 — no children (component that doesn't accept them)
interface AvatarProps {
  src: string;
  alt: string;
  // no children property — TypeScript will error if caller passes children
}
```

When a component should NOT accept children, simply omit the property. TypeScript will produce an error if a caller passes them.

---

## 2.6 Optional vs Required Props

```tsx
interface ProfileCardProps {
  // Required
  name: string;
  username: string;

  // Optional with default handled in destructuring
  bio?: string;
  avatarUrl?: string;

  // Optional callback
  onFollow?: () => void;
}

function ProfileCard({
  name,
  username,
  bio = "No bio yet.",
  avatarUrl,
  onFollow,
}: ProfileCardProps) {
  return (
    <div>
      {avatarUrl && <img src={avatarUrl} alt={name} />}
      <h2>{name}</h2>
      <p>@{username}</p>
      <p>{bio}</p>
      {onFollow && <button onClick={onFollow}>Follow</button>}
    </div>
  );
}
```

Never use `!` (non-null assertion) on optional props inside the component body — check with `&&` or provide a default.

---

## 2.7 Spreading HTML Props

When building a wrapper around a native element, extend its props so callers can pass any HTML attribute:

```tsx
import type { ComponentPropsWithoutRef } from "react";

interface ButtonProps extends ComponentPropsWithoutRef<"button"> {
  variant?: "primary" | "secondary";
  isLoading?: boolean;
}

function Button({ variant = "primary", isLoading = false, children, ...rest }: ButtonProps) {
  return (
    <button {...rest} data-variant={variant} disabled={isLoading || rest.disabled}>
      {isLoading ? "Loading…" : children}
    </button>
  );
}
```

`ComponentPropsWithoutRef<"button">` includes all standard `<button>` attributes (`onClick`, `type`, `aria-*`, etc.) without the `ref`. Use `ComponentPropsWithRef<"button">` if you also forward a ref.

---

## Key Takeaways

| Concept | Rule |
|---------|------|
| Props shape | Always a named `interface`, never inline |
| `FC<>` | Avoid — use function declarations instead |
| `children` | Type as `ReactNode` unless you need to clone the element |
| Optional props | Use `?` + default in destructuring, never `!` assertions |
| Wrapping HTML elements | Extend `ComponentPropsWithoutRef<"tag">` and spread `...rest` |
