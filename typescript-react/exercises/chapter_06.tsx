/**
 * Chapter 6 — Component Patterns: forwardRef, Generic Components & Polymorphic `as`
 *
 * Type-check: npx tsc --noEmit --strict exercises/chapter_06.tsx
 * Run:        tsx exercises/chapter_06.tsx
 *
 * These exercises implement the typed component patterns used throughout DevLink's
 * component library. No JSX execution — focus is on type correctness.
 */

import type { ElementType, ComponentPropsWithoutRef } from "react";

// =============================================================================
// EXERCISE 1 — forwardRef types
// =============================================================================
// TODO: Write the correct type signature for forwardRef for each case.
//       Don't implement the component body — just write what the types would be.

// Case A: A basic Input component forwarding to <input>
//   forwardRef<???, ???>(({ label, ...props }, ref) => ...)
//   What are the two type arguments?
//   Answer: ???

// Case B: A Dialog component forwarding a custom `DialogHandle` (not HTMLElement)
//   The parent needs to call: dialogRef.current?.open()
//   forwardRef<???, ???>(...)
//   Answer: ???

// Case C: A Card component forwarding to <div>
//   forwardRef<???, ???>(...)
//   Answer: ???

// =============================================================================
// EXERCISE 2 — useImperativeHandle API design
// =============================================================================
// TODO: Define interface `ToastManagerHandle` that exposes:
//   - show:    (message: string, variant: "success" | "error") => void
//   - dismiss: (id: string) => void
//   - dismissAll: () => void
// This is the API a parent would access via toastRef.current

interface ToastManagerHandle {
  // TODO
}

// TODO: Define interface `CarouselHandle` that exposes:
//   - next: () => void
//   - prev: () => void
//   - goTo: (index: number) => void
//   - currentIndex: () => number

interface CarouselHandle {
  // TODO
}

// =============================================================================
// EXERCISE 3 — Generic Select component types
// =============================================================================
// TODO: Define interface `SelectProps<T>` where T extends { id: string; label: string }:
//   - options:     T[]
//   - value:       T | null
//   - onChange:    (value: T | null) => void
//   - placeholder?: string
//   - disabled?:   boolean
//   - getLabel?:   (option: T) => string  (override default label display)

interface SelectProps<T extends { id: string; label: string }> {
  // TODO
}

// TODO: Define interface `MultiSelectProps<T>` extending SelectProps<T> (or similar):
//   - value:    T[]  (override — multiple selected)
//   - onChange: (value: T[]) => void  (override)
//   - max?:     number

interface MultiSelectProps<T extends { id: string; label: string }> {
  // TODO
}

// =============================================================================
// EXERCISE 4 — Polymorphic component type
// =============================================================================
// TODO: Define the `PolymorphicProps<T, OwnProps>` type helper that:
//   - Takes T extends ElementType (the "as" element type)
//   - Takes OwnProps (the component's own props)
//   - Returns OwnProps merged with ComponentPropsWithoutRef<T>, minus OwnProps keys
//   - Plus `as?: T`

type PolymorphicProps<T extends ElementType, OwnProps = {}> =
  // TODO: implement this
  never;

// TODO: Using PolymorphicProps, define `TextProps<T extends ElementType = "p">`:
//   OwnProps:
//   - size?:   "xs" | "sm" | "md" | "lg" | "xl"
//   - weight?: "normal" | "medium" | "bold"
//   - color?:  "default" | "muted" | "accent" | "danger"

interface TextOwnProps {
  size?:   "xs" | "sm" | "md" | "lg" | "xl";
  weight?: "normal" | "medium" | "bold";
  color?:  "default" | "muted" | "accent" | "danger";
}

type TextProps<T extends ElementType = "p"> = PolymorphicProps<T, TextOwnProps>;

// =============================================================================
// EXERCISE 5 — Constrained generic List
// =============================================================================
// TODO: Define interface `ListProps<T>` where T is unconstrained:
//   - items:          T[]
//   - renderItem:     (item: T, index: number) => unknown  (return type is display)
//   - keyExtractor:   (item: T) => string
//   - emptyMessage?:  string

interface ListProps<T> {
  // TODO
}

// =============================================================================
// EXERCISE 6 — Practical type usage
// =============================================================================
// These assignments test that your types work correctly.
// They should compile without errors when types are correct.

interface Platform {
  id: string;
  label: string;
  icon: string;
}

const platforms: Platform[] = [
  { id: "github",   label: "GitHub",   icon: "🐙" },
  { id: "twitter",  label: "Twitter",  icon: "🐦" },
  { id: "linkedin", label: "LinkedIn", icon: "💼" },
];

// Exercise 3 — SelectProps usage
const selectProps: SelectProps<Platform> = {
  options: platforms,
  value: platforms[0],
  onChange: (v) => {
    // v should be Platform | null
    if (v) console.log(v.icon); // icon is available — Platform type
  },
};

// Exercise 3 — MultiSelectProps usage
const multiProps: MultiSelectProps<Platform> = {
  options: platforms,
  value: [platforms[0]],
  onChange: (v) => {
    // v should be Platform[]
    v.forEach((p) => console.log(p.label));
  },
  max: 3,
};

// Exercise 5 — ListProps usage
const listProps: ListProps<Platform> = {
  items: platforms,
  renderItem: (p, i) => `${i}: ${p.label}`,
  keyExtractor: (p) => p.id,
  emptyMessage: "No platforms added yet",
};

function verify(): void {
  // Verify Exercise 6 compiles by using the values
  console.assert(selectProps.options.length === 3,  "Ex6: select should have 3 options");
  console.assert(multiProps.max === 3,              "Ex6: multiselect max should be 3");
  console.assert(listProps.emptyMessage !== undefined, "Ex6: listProps has emptyMessage");

  // Exercise 2 — ToastManagerHandle shape
  const mockHandle: ToastManagerHandle = {
    show: (msg, variant) => console.log(msg, variant),
    dismiss: (id) => console.log("dismiss", id),
    dismissAll: () => console.log("dismiss all"),
  };
  mockHandle.show("Saved", "success");
  mockHandle.dismissAll();

  // Exercise 2 — CarouselHandle shape
  const mockCarousel: CarouselHandle = {
    next: () => {},
    prev: () => {},
    goTo: (i) => console.log("go to", i),
    currentIndex: () => 0,
  };
  mockCarousel.next();
  console.assert(mockCarousel.currentIndex() === 0, "Ex2: initial carousel index should be 0");

  console.log("Chapter 6 type checks passed ✓");
}

verify();
