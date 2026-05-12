# Chapter 13 — Component Libraries: Radix UI & shadcn/ui

## Learning Objectives

By the end of this chapter you will be able to:
- Use Radix UI primitives with correct TypeScript prop types
- Extend shadcn/ui components without breaking their types
- Compose Radix primitives into typed compound components
- Forward refs correctly through component library wrappers

---

## 13.1 Why Radix UI

Radix UI provides unstyled, accessible primitives (Dialog, Dropdown, Tooltip, etc.) with excellent TypeScript support. shadcn/ui layers Tailwind styles on top of Radix and ships the source code into your project — you own the components.

```bash
# shadcn/ui CLI initialises your project and adds components on demand
npx shadcn-ui@latest init
npx shadcn-ui@latest add button dialog dropdown-menu
```

---

## 13.2 Reading Radix Prop Types

Every Radix component exports its prop types. Use them to extend or forward:

```tsx
import * as Dialog from "@radix-ui/react-dialog";

// Radix Dialog.Root props
type DialogRootProps = Dialog.DialogProps;
// Equivalent to: { open?: boolean; onOpenChange?: (open: boolean) => void; ... }

// Radix Dialog.Content props
type DialogContentProps = Dialog.DialogContentProps;
// Includes: asChild, onEscapeKeyDown, onPointerDownOutside, forceMount...
```

---

## 13.3 `ComponentPropsWithoutRef` for Library Components

When wrapping a Radix component, spread its props to avoid manually listing them:

```tsx
import * as DialogPrimitive from "@radix-ui/react-dialog";
import type { ComponentPropsWithoutRef, ElementRef } from "react";
import { forwardRef } from "react";
import { cn } from "@/lib/cn";

// Typed wrapper that adds className merging and default styles
const DialogContent = forwardRef<
  ElementRef<typeof DialogPrimitive.Content>,          // ref type from Radix
  ComponentPropsWithoutRef<typeof DialogPrimitive.Content>  // all Radix props
>(({ className, children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 bg-black/50" />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
        "w-full max-w-lg rounded-lg bg-white p-6 shadow-xl",
        className
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));

DialogContent.displayName = DialogPrimitive.Content.displayName;
```

`ElementRef<typeof DialogPrimitive.Content>` extracts the correct `HTMLElement` type that Radix forwards — no need to look it up manually.

---

## 13.4 shadcn/ui Components — Extending Props

shadcn components are source files you own. Extend them like any local component:

```tsx
// src/components/ui/button.tsx (shadcn-generated, then modified)
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ComponentPropsWithoutRef } from "react";

const buttonVariants = cva("...", {
  variants: { variant: { ... }, size: { ... } },
  defaultVariants: { variant: "default", size: "default" },
});

// Add your own props on top of the generated type
interface ButtonProps
  extends ComponentPropsWithoutRef<"button">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;   // our addition
  leftIcon?: ReactNode;  // our addition
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, isLoading, leftIcon, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {leftIcon && <span className="mr-2">{leftIcon}</span>}
        {isLoading ? <Spinner /> : props.children}
      </Comp>
    );
  }
);
```

---

## 13.5 Typed Dropdown Menu

```tsx
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

interface MenuItem {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
}

interface ActionMenuProps {
  trigger: ReactNode;
  items: MenuItem[];
}

function ActionMenu({ trigger, items }: ActionMenuProps) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        {trigger}
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="min-w-[180px] rounded-md bg-white p-1 shadow-lg"
          sideOffset={5}
        >
          {items.map((item, i) => (
            <DropdownMenu.Item
              key={i}
              onSelect={item.onClick}
              disabled={item.disabled}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded px-3 py-2 text-sm",
                item.destructive && "text-red-600"
              )}
            >
              {item.icon}
              {item.label}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
```

---

## 13.6 `asChild` Pattern

Radix's `asChild` prop merges the component's behaviour onto its single child element, replacing the default DOM element:

```tsx
// Without asChild — renders <button> wrapping <Link>
<DialogTrigger>
  <Link to="/details">View Details</Link>
</DialogTrigger>
// Result: <button><a href="/details">View Details</a></button> — wrong

// With asChild — renders <a> with Dialog trigger behaviour merged in
<DialogTrigger asChild>
  <Link to="/details">View Details</Link>
</DialogTrigger>
// Result: <a href="/details">View Details</a> with click handler — correct
```

When `asChild` is used, the child must be a single React element (no fragments). TypeScript can't enforce this at compile time — it's a runtime constraint.

---

## Key Takeaways

| Pattern | Rule |
|---------|------|
| Ref type | `ElementRef<typeof RadixComponent>` — extracts the correct DOM type |
| Props type | `ComponentPropsWithoutRef<typeof RadixComponent>` — all Radix props |
| shadcn extension | Add your props on top of the generated interface — don't replace it |
| `asChild` | Merges behaviour onto child element — use when the default element is wrong |
| `displayName` | Always copy from `RadixPrimitive.Component.displayName` |
| Spread `...props` | Always pass through unknown props so callers can use all Radix features |
