# Chapter 21 — Accessibility & Storybook

## Learning Objectives

By the end of this chapter you will be able to:
- Apply ARIA typed attributes correctly in React components
- Handle keyboard navigation with typed event handlers
- Write typed Storybook stories with `Meta<T>` and `StoryObj<T>`
- Use the `@storybook/addon-a11y` to surface accessibility violations

---

## 21.1 ARIA Typed Props in React

React types all ARIA attributes on HTML elements. They're available on any intrinsic JSX element:

```tsx
// Common ARIA props — all typed in @types/react
<div
  role="dialog"                    // AriaRole — "dialog" | "button" | "navigation" | ...
  aria-modal={true}                // boolean
  aria-labelledby="dialog-title"   // string — id of the label element
  aria-describedby="dialog-desc"   // string — id of the description element
/>

<button
  aria-expanded={isOpen}           // boolean
  aria-controls="menu-id"          // string
  aria-haspopup="menu"             // boolean | "dialog" | "listbox" | "menu" | "tree" | "grid"
/>

<input
  aria-invalid={!!error}           // boolean
  aria-required={true}             // boolean
  aria-describedby={error ? `${name}-error` : undefined} // string | undefined
/>

<ul
  role="listbox"
  aria-activedescendant={activeId} // string
  aria-multiselectable={false}     // boolean
/>
```

TypeScript will error on invalid ARIA attribute values — `aria-haspopup="modal"` is a type error.

---

## 21.2 Typed Keyboard Navigation

```tsx
interface MenuItemProps {
  label: string;
  onSelect: () => void;
  isActive?: boolean;
}

function MenuItem({ label, onSelect, isActive = false }: MenuItemProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLLIElement>) => {
    switch (e.key) {
      case "Enter":
      case " ":
        e.preventDefault();
        onSelect();
        break;
      case "ArrowDown":
        e.preventDefault();
        // focus next sibling
        (e.currentTarget.nextElementSibling as HTMLElement | null)?.focus();
        break;
      case "ArrowUp":
        e.preventDefault();
        (e.currentTarget.previousElementSibling as HTMLElement | null)?.focus();
        break;
    }
  };

  return (
    <li
      role="menuitem"
      tabIndex={isActive ? 0 : -1}
      aria-current={isActive ? "true" : undefined}
      onKeyDown={handleKeyDown}
      onClick={onSelect}
    >
      {label}
    </li>
  );
}
```

---

## 21.3 `useFocusTrap` — Typed Focus Management

Modal dialogs must trap focus inside them while open:

```tsx
function useFocusTrap(containerRef: React.RefObject<HTMLElement>, isActive: boolean) {
  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusable = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];

    first?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };

    container.addEventListener("keydown", handleKeyDown);
    return () => container.removeEventListener("keydown", handleKeyDown);
  }, [isActive, containerRef]);
}
```

---

## 21.4 Storybook Setup

```bash
npx storybook@latest init
npm install -D @storybook/addon-a11y
```

---

## 21.5 `Meta<typeof Component>` and `StoryObj<typeof Component>`

```tsx
// src/components/Button/Button.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./Button";

// Meta types the default export — controls what Storybook renders
const meta: Meta<typeof Button> = {
  title: "Components/Button",
  component: Button,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "ghost", "danger"],
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
    onClick: { action: "clicked" },
  },
};

export default meta;

// StoryObj types each named export
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    label: "Save Changes",
    variant: "primary",
    size: "md",
  },
};

export const Loading: Story = {
  args: {
    label: "Saving…",
    isLoading: true,
    variant: "primary",
  },
};

export const Danger: Story = {
  args: {
    label: "Delete Project",
    variant: "danger",
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex gap-4">
      <Button label="Primary" variant="primary" onClick={() => {}} />
      <Button label="Secondary" variant="secondary" onClick={() => {}} />
      <Button label="Ghost" variant="ghost" onClick={() => {}} />
      <Button label="Danger" variant="danger" onClick={() => {}} />
    </div>
  ),
};
```

---

## 21.6 Stories for Complex Components

```tsx
// src/components/DataTable/DataTable.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { DataTable } from "./DataTable";
import type { Column } from "./DataTable";

interface StoryProject {
  id: string;
  title: string;
  status: "draft" | "published";
}

const meta: Meta<typeof DataTable<StoryProject>> = {
  title: "Components/DataTable",
  component: DataTable,
};

export default meta;

type Story = StoryObj<typeof DataTable<StoryProject>>;

const columns: Column<StoryProject>[] = [
  { key: "title",  header: "Title",  render: (r) => r.title },
  { key: "status", header: "Status", render: (r) => <Badge>{r.status}</Badge> },
];

const data: StoryProject[] = [
  { id: "1", title: "DevLink",   status: "published" },
  { id: "2", title: "Portfolio", status: "draft" },
];

export const WithData: Story = {
  args: { data, columns },
};

export const Empty: Story = {
  args: { data: [], columns, emptyMessage: "No projects yet" },
};

export const Loading: Story = {
  args: { data: [], columns, isLoading: true },
};
```

---

## 21.7 a11y Addon — Automated Checks

The `@storybook/addon-a11y` runs `axe-core` on every story and surfaces violations in the Accessibility tab:

```typescript
// .storybook/main.ts
const config = {
  addons: [
    "@storybook/addon-a11y",
    // ... others
  ],
};
```

Configure per-story:
```tsx
export const PrimaryButton: Story = {
  args: { label: "Save", variant: "primary", onClick: () => {} },
  parameters: {
    a11y: {
      // Disable a specific rule for this story if justified
      config: { rules: [{ id: "color-contrast", enabled: false }] },
    },
  },
};
```

Run a11y checks in CI:
```bash
npx storybook build
npx axe-storybook
```

---

## Key Takeaways

| Pattern | Rule |
|---------|------|
| ARIA props | All typed — invalid values are compile errors |
| `role` | Use semantic HTML first, `role` only when HTML element doesn't convey the meaning |
| Keyboard nav | Use `e.key` (string) not `e.keyCode` (deprecated number) |
| `Meta<typeof C>` | Types the default export — controls args, argTypes, decorators |
| `StoryObj<typeof C>` | Types each named export — args must match component props |
| a11y addon | Catches missing labels, contrast issues, invalid ARIA — run in CI |
