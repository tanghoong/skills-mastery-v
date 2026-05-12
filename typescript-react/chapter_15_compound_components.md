# Chapter 15 — Compound Components

## Learning Objectives

By the end of this chapter you will be able to:
- Build a typed compound component using the context + composition pattern
- Enforce that sub-components are used inside the correct parent
- Type the slot pattern for flexible content injection
- Apply the pattern to build DevLink's `Card` compound component

---

## 15.1 What Are Compound Components

A compound component is a set of related components that share implicit state through context. The most familiar examples are `<select>/<option>` and `<table>/<tr>/<td>` — child components only work meaningfully inside the parent.

In React:
```tsx
// External API — reads cleanly
<Tabs defaultValue="projects">
  <Tabs.List>
    <Tabs.Trigger value="projects">Projects</Tabs.Trigger>
    <Tabs.Trigger value="links">Links</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Panel value="projects"><ProjectsTab /></Tabs.Panel>
  <Tabs.Panel value="links"><LinksTab /></Tabs.Panel>
</Tabs>
```

---

## 15.2 Context + Sub-Components Pattern

```tsx
import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

// 1. Define the shared context value
interface TabsContextValue {
  activeTab: string;
  setActiveTab: (value: string) => void;
}

const TabsContext = createContext<TabsContextValue | undefined>(undefined);

function useTabsContext(): TabsContextValue {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("Tabs sub-components must be used inside <Tabs>");
  return ctx;
}

// 2. Root component
interface TabsProps {
  defaultValue: string;
  children: ReactNode;
}

function Tabs({ defaultValue, children }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultValue);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div>{children}</div>
    </TabsContext.Provider>
  );
}

// 3. Sub-components
interface TabsListProps {
  children: ReactNode;
}

function TabsList({ children }: TabsListProps) {
  return <div role="tablist">{children}</div>;
}

interface TabsTriggerProps {
  value: string;
  children: ReactNode;
}

function TabsTrigger({ value, children }: TabsTriggerProps) {
  const { activeTab, setActiveTab } = useTabsContext();

  return (
    <button
      role="tab"
      aria-selected={activeTab === value}
      onClick={() => setActiveTab(value)}
    >
      {children}
    </button>
  );
}

interface TabsPanelProps {
  value: string;
  children: ReactNode;
}

function TabsPanel({ value, children }: TabsPanelProps) {
  const { activeTab } = useTabsContext();

  if (activeTab !== value) return null;
  return <div role="tabpanel">{children}</div>;
}

// 4. Attach sub-components as properties
Tabs.List    = TabsList;
Tabs.Trigger = TabsTrigger;
Tabs.Panel   = TabsPanel;

export { Tabs };
```

---

## 15.3 Typing Sub-Components as Properties

When you attach sub-components as namespace properties, TypeScript needs the function types to be explicit:

```tsx
// Typing the namespace assignments
Tabs.List    = TabsList    as typeof TabsList;
Tabs.Trigger = TabsTrigger as typeof TabsTrigger;
Tabs.Panel   = TabsPanel   as typeof TabsPanel;
```

Or use an interface for the combined type:

```tsx
interface TabsComposite {
  (props: TabsProps): JSX.Element;
  List:    typeof TabsList;
  Trigger: typeof TabsTrigger;
  Panel:   typeof TabsPanel;
}

const Tabs = (({ defaultValue, children }: TabsProps) => {
  // ...
}) as TabsComposite;

Tabs.List    = TabsList;
Tabs.Trigger = TabsTrigger;
Tabs.Panel   = TabsPanel;
```

---

## 15.4 DevLink Card Compound Component

```tsx
// src/components/Card/Card.tsx
interface CardContextValue {
  variant: "default" | "featured";
}

const CardContext = createContext<CardContextValue | undefined>(undefined);

function useCardContext() {
  const ctx = useContext(CardContext);
  if (!ctx) throw new Error("Card sub-components must be used inside <Card>");
  return ctx;
}

interface CardProps {
  variant?: "default" | "featured";
  children: ReactNode;
  className?: string;
}

function Card({ variant = "default", children, className }: CardProps) {
  return (
    <CardContext.Provider value={{ variant }}>
      <div
        className={cn(
          "rounded-lg border bg-white p-6 shadow-sm",
          variant === "featured" && "border-indigo-500 shadow-indigo-100",
          className
        )}
      >
        {children}
      </div>
    </CardContext.Provider>
  );
}

function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mb-4 flex items-start justify-between", className)}>{children}</div>;
}

function CardTitle({ children }: { children: ReactNode }) {
  const { variant } = useCardContext();
  return (
    <h3 className={cn("text-lg font-semibold", variant === "featured" && "text-indigo-700")}>
      {children}
    </h3>
  );
}

function CardBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("text-sm text-gray-600", className)}>{children}</div>;
}

function CardFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("mt-4 flex items-center gap-2 border-t pt-4", className)}>
      {children}
    </div>
  );
}

Card.Header = CardHeader;
Card.Title  = CardTitle;
Card.Body   = CardBody;
Card.Footer = CardFooter;

export { Card };
```

Usage:
```tsx
<Card variant="featured">
  <Card.Header>
    <Card.Title>DevLink Portfolio</Card.Title>
    <Badge variant="success">Live</Badge>
  </Card.Header>
  <Card.Body>
    A typed developer portfolio builder with AI bio generation.
  </Card.Body>
  <Card.Footer>
    <Button size="sm" variant="ghost">Edit</Button>
    <Button size="sm" variant="danger">Delete</Button>
  </Card.Footer>
</Card>
```

---

## 15.5 Enforcing Correct Child Types

To restrict what children a compound component accepts, use `React.Children` with type checking:

```tsx
import { Children, isValidElement } from "react";

function RadioGroup({ children }: { children: ReactNode }) {
  Children.forEach(children, (child) => {
    if (isValidElement(child) && child.type !== RadioGroup.Item) {
      console.warn("RadioGroup only accepts RadioGroup.Item children");
    }
  });
  return <div role="radiogroup">{children}</div>;
}
```

TypeScript can't enforce the child type at compile time — this is a runtime check.

---

## Key Takeaways

| Pattern | Rule |
|---------|------|
| Context per compound | Each compound family has its own context — never share across compounds |
| Guard hook | `useXContext()` throws if called outside the parent — fails fast |
| Namespace attachment | `Tabs.List = TabsList` — attach sub-components to root for clean imports |
| `TabsComposite` type | Use an interface cast when TypeScript can't infer the namespace shape |
| Context value | Minimal — only state the sub-components actually need |
