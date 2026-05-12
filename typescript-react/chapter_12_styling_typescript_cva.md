# Chapter 12 — Styling with TypeScript: CVA & Tailwind

## Learning Objectives

By the end of this chapter you will be able to:
- Use `cva` to create typed variant-based component styles
- Extract `VariantProps<T>` to keep component props in sync with styles
- Build a typed `cn()` utility for conditional class merging
- Apply the pattern to a complete DevLink button system

---

## 12.1 The Problem with String Class Names

Without types, variants are free-form strings — typos fail silently at runtime:

```tsx
// No type safety — "primry" won't error until you see the wrong style
<button className={`btn btn-${variant}`}>Click</button>
```

CVA (class-variance-authority) solves this by generating typed variant maps.

```bash
npm install class-variance-authority clsx tailwind-merge
```

---

## 12.2 `cn()` Utility

Combine `clsx` (conditional classes) with `tailwind-merge` (dedup conflicting Tailwind classes):

```typescript
// src/lib/cn.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

Usage:
```tsx
// Merges classes, removes Tailwind conflicts
<div className={cn("p-4 text-sm", isError && "text-red-500", className)} />
```

`twMerge` handles conflicts — `cn("p-4", "p-8")` → `"p-8"`, not `"p-4 p-8"`.

---

## 12.3 `cva` — Typed Variant Styles

```typescript
// src/components/Button/Button.variants.ts
import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  // Base classes applied to every variant
  "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:   "bg-indigo-600 text-white hover:bg-indigo-700",
        secondary: "bg-white text-gray-900 border border-gray-300 hover:bg-gray-50",
        ghost:     "text-gray-700 hover:bg-gray-100",
        danger:    "bg-red-600 text-white hover:bg-red-700",
      },
      size: {
        sm:  "h-8 px-3 text-xs",
        md:  "h-10 px-4 text-sm",
        lg:  "h-12 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);
```

---

## 12.4 `VariantProps<T>` — Sync Props with Variants

`VariantProps` extracts the variant types directly from the `cva` definition:

```tsx
// src/components/Button/Button.tsx
import { forwardRef } from "react";
import type { VariantProps } from "class-variance-authority";
import type { ComponentPropsWithoutRef } from "react";
import { buttonVariants } from "./Button.variants";
import { cn } from "@/lib/cn";

// VariantProps<typeof buttonVariants> gives:
// { variant?: "primary" | "secondary" | "ghost" | "danger" | null | undefined
//   size?: "sm" | "md" | "lg" | "icon" | null | undefined }
interface ButtonProps
  extends ComponentPropsWithoutRef<"button">,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant, size, isLoading = false, className, children, disabled, ...rest }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || isLoading}
        {...rest}
      >
        {isLoading ? <Spinner size="sm" /> : children}
      </button>
    );
  }
);

Button.displayName = "Button";
export { Button, buttonVariants };
```

Now TypeScript errors if you pass an invalid variant:
```tsx
<Button variant="primry">    // Error: Type '"primry"' is not assignable...
<Button variant="primary">   // ✓
<Button size="xl">           // Error: Type '"xl"' is not assignable...
<Button size="lg">           // ✓
```

---

## 12.5 Compound Variant Styles

`cva` supports `compoundVariants` — styles that apply only when multiple variants combine:

```typescript
export const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        default:     "bg-gray-100 text-gray-700",
        success:     "bg-green-100 text-green-700",
        warning:     "bg-yellow-100 text-yellow-700",
        destructive: "bg-red-100 text-red-700",
      },
      outline: {
        true:  "border bg-transparent",
        false: "",
      },
    },
    compoundVariants: [
      {
        variant: "success",
        outline: true,
        class: "border-green-500 text-green-700",
      },
      {
        variant: "destructive",
        outline: true,
        class: "border-red-500 text-red-700",
      },
    ],
    defaultVariants: {
      variant: "default",
      outline: false,
    },
  }
);
```

---

## 12.6 Typed Tailwind with `tailwind-variants` (Alternative)

`tailwind-variants` is a newer alternative with slightly better TypeScript inference:

```typescript
import { tv } from "tailwind-variants";

export const input = tv({
  base: "w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2",
  variants: {
    state: {
      default: "border-gray-300 focus:ring-indigo-500",
      error:   "border-red-500 focus:ring-red-500",
      success: "border-green-500 focus:ring-green-500",
    },
    size: {
      sm: "h-8 text-xs",
      md: "h-10 text-sm",
    },
  },
  defaultVariants: {
    state: "default",
    size: "md",
  },
});
```

Both `cva` and `tailwind-variants` are valid — `cva` is more widely used in shadcn/ui.

---

## Key Takeaways

| Pattern | Rule |
|---------|------|
| `cn()` | `twMerge(clsx(...))` — always use this for conditional Tailwind classes |
| `cva` | Define variants as an object, never template strings |
| `VariantProps<T>` | Derive props from the variant definition — single source of truth |
| `compoundVariants` | Apply styles only when two variants combine |
| `className` prop | Accept it in the component and merge with `cn(variantClasses, className)` |
| `defaultVariants` | Set sensible defaults — caller doesn't need to pass every variant |
