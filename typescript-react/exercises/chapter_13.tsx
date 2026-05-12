/**
 * Chapter 13 — Component Libraries: Radix UI & shadcn/ui
 *
 * Type-check: npx tsc --noEmit --strict exercises/chapter_13.tsx
 *
 * These exercises practice prop type composition patterns from Radix — extending,
 * forwarding, and narrowing component props correctly.
 */

import type { ComponentPropsWithoutRef, ElementRef, ReactNode, forwardRef } from "react";

// =============================================================================
// EXERCISE 1 — ComponentPropsWithoutRef patterns
// =============================================================================
// TODO: Using `ComponentPropsWithoutRef<"element">`, define typed prop interfaces
//       for these wrapper components. Extend the HTML element's props.

// A wrapper around <button> that adds a `variant` and `isLoading` prop
interface StyledButtonProps extends ComponentPropsWithoutRef<"button"> {
  // TODO: add variant?: "default" | "destructive" | "outline"
  // TODO: add isLoading?: boolean
}

// A wrapper around <a> that adds a `external` boolean
interface StyledLinkProps extends ComponentPropsWithoutRef<"a"> {
  // TODO: add external?: boolean (adds target="_blank" rel="noopener noreferrer")
}

// A wrapper around <input> that adds label, error, and hint
interface LabeledInputProps extends ComponentPropsWithoutRef<"input"> {
  // TODO: add label: string
  // TODO: add error?: string
  // TODO: add hint?: string
}

// =============================================================================
// EXERCISE 2 — Simulate Radix-style prop spreading
// =============================================================================
// In Radix, wrappers accept all the primitive's props and spread them.
// TODO: Implement `createRadixWrapper` — a function that:
//   - Takes `baseProps: Record<string, unknown>` (simulating Radix component props)
//   - Takes `ownProps: Record<string, unknown>`
//   - Returns a merged object where ownProps override baseProps
//   This simulates what `{...props}` does when wrapping a Radix primitive.

function createRadixWrapper(
  baseProps: Record<string, unknown>,
  ownProps: Record<string, unknown>
): Record<string, unknown> {
  // TODO
  return {};
}

// =============================================================================
// EXERCISE 3 — Typed MenuItem model
// =============================================================================
// DevLink's admin menu needs a typed menu item model.
// TODO: Define interface `MenuItem` with:
//   - id:          string
//   - label:       string
//   - icon?:       ReactNode
//   - href?:       string
//   - onClick?:    () => void
//   - disabled?:   boolean
//   - destructive?: boolean
//   - separator?:  boolean  (renders a divider instead of a menu item)
//
// TODO: Implement `filterMenuItems(items: MenuItem[], isAdmin: boolean): MenuItem[]`
//   that removes items where `destructive === true && !isAdmin`

interface MenuItem {
  // TODO
}

function filterMenuItems(items: MenuItem[], isAdmin: boolean): MenuItem[] {
  // TODO
  return items;
}

// =============================================================================
// EXERCISE 4 — asChild pattern simulation
// =============================================================================
// Radix's `asChild` merges behaviour onto the child element.
// TODO: Define interface `AsChildProps` with:
//   - asChild?: boolean
//   - children: ReactNode
//
// TODO: Implement `resolveComponent(asChild: boolean, defaultTag: string): string`
//   that returns "slot" if asChild is true (simulating Radix's Slot component),
//   or defaultTag if false.

interface AsChildProps {
  // TODO
}

function resolveComponent(asChild: boolean, defaultTag: string): string {
  // TODO
  return defaultTag;
}

// =============================================================================
// EXERCISE 5 — Typed component extension
// =============================================================================
// shadcn components can be extended with custom props.
// TODO: Define `ExtendedDialogProps` that:
//   - Extends a base `DialogBaseProps` (define this too)
//   - Adds: title: string
//   - Adds: description?: string
//   - Adds: onConfirm: () => void
//   - Adds: confirmLabel?: string (default "Confirm")
//   - Adds: confirmVariant?: "default" | "destructive"

interface DialogBaseProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children?: ReactNode;
}

interface ExtendedDialogProps extends DialogBaseProps {
  // TODO
}

// =============================================================================
// EXERCISE 6 — Build the ActionMenu items for DevLink
// =============================================================================
// TODO: Create `projectMenuItems` — an array of `MenuItem[]` for a project row:
//   1. { label: "Edit",   onClick: handler, id: "edit" }
//   2. { label: "Duplicate", onClick: handler, id: "duplicate" }
//   3. { separator: true, id: "sep-1" }
//   4. { label: "Delete", onClick: handler, destructive: true, id: "delete" }
// Use placeholder functions for handlers.

function verify(): void {
  // Exercise 2 — wrapper
  const base = { onClick: "base-click", className: "base-class", "data-id": "123" };
  const own  = { className: "own-class", disabled: true };
  const merged = createRadixWrapper(base, own);
  console.assert(merged.className === "own-class",   "Ex2: ownProps should override baseProps");
  console.assert(merged.disabled === true,           "Ex2: own disabled should be present");
  console.assert(merged["data-id"] === "123",        "Ex2: base-only props should be preserved");

  // Exercise 3 — filter menu items
  const items: MenuItem[] = [
    { id: "edit",   label: "Edit" },
    { id: "delete", label: "Delete", destructive: true },
    { id: "view",   label: "View" },
  ];

  const adminItems  = filterMenuItems(items, true);
  const viewerItems = filterMenuItems(items, false);

  console.assert(adminItems.length === 3,  "Ex3: admin sees all 3 items");
  console.assert(viewerItems.length === 2, "Ex3: viewer sees 2 items (no destructive)");

  // Exercise 4 — asChild
  console.assert(resolveComponent(false, "button") === "button", "Ex4: no asChild → button");
  console.assert(resolveComponent(true,  "button") === "slot",   "Ex4: asChild → slot");

  // Exercise 5 — ExtendedDialogProps
  const dialogProps: ExtendedDialogProps = {
    open: true,
    onOpenChange: () => {},
    title: "Delete Project",
    description: "This cannot be undone.",
    onConfirm: () => {},
    confirmLabel: "Delete",
    confirmVariant: "destructive",
  };
  console.assert(dialogProps.title === "Delete Project", "Ex5: title should be set");
  console.assert(dialogProps.confirmVariant === "destructive", "Ex5: confirmVariant set");

  console.log("Chapter 13 verification complete ✓");
}

// Exercise 6 — project menu items
const noop = () => {};
const projectMenuItems: MenuItem[] = [
  // TODO
];

function postVerify(): void {
  console.assert(projectMenuItems.length === 4, "Ex6: should have 4 items (including separator)");
  const del = projectMenuItems.find(i => i.id === "delete");
  console.assert(del?.destructive === true,     "Ex6: delete should be destructive");
  const sep = projectMenuItems.find(i => i.separator === true);
  console.assert(sep !== undefined,              "Ex6: should have a separator");

  console.log("Chapter 13 exercise 6 passed ✓");
}

verify();
postVerify();
