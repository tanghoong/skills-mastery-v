/**
 * Chapter 12 — Styling with TypeScript: CVA & Tailwind
 *
 * Type-check: npx tsc --noEmit --strict exercises/chapter_12.tsx
 * Run:        tsx exercises/chapter_12.tsx
 *
 * These exercises build typed variant systems without the actual CVA library,
 * then use the real CVA types to understand what VariantProps produces.
 */

// =============================================================================
// EXERCISE 1 — Manual variant map (understanding what CVA does)
// =============================================================================
// TODO: Define a `ButtonVariantMap` object (as const) with these variants:
//   - variant: { primary, secondary, ghost, danger }
//   - size:    { sm, md, lg, icon }
// Each value is a string of Tailwind classes (can be placeholder strings).
// Use `as const` so types are narrow.

const buttonVariantMap = {
  variant: {
    // TODO: primary: "...", secondary: "...", ghost: "...", danger: "..."
  },
  size: {
    // TODO: sm: "...", md: "...", lg: "...", icon: "..."
  },
} as const;

// TODO: Derive `ButtonVariant` type from the variant map
type ButtonVariant = keyof typeof buttonVariantMap.variant; // should be "primary" | "secondary" | "ghost" | "danger"
type ButtonSize    = keyof typeof buttonVariantMap.size;    // should be "sm" | "md" | "lg" | "icon"

// =============================================================================
// EXERCISE 2 — Variant resolver function
// =============================================================================
// TODO: Implement `resolveButtonClasses` that:
//   - Takes `{ variant: ButtonVariant; size: ButtonSize; className?: string }`
//   - Returns a string of class names (joined with space)
//   - Uses the buttonVariantMap to look up the correct classes
//   - Appends the optional className at the end

interface ResolveButtonOptions {
  variant: ButtonVariant;
  size:    ButtonSize;
  className?: string;
}

function resolveButtonClasses({ variant, size, className }: ResolveButtonOptions): string {
  // TODO
  return "";
}

// =============================================================================
// EXERCISE 3 — Badge variant system
// =============================================================================
// TODO: Create `badgeVariantMap` (as const) with variants:
//   - variant: { default, success, warning, destructive }
//   - outline: { true: "...", false: "" }
// TODO: Derive `BadgeVariant` and `BadgeOutline` types from it.
// TODO: Implement `resolveBadgeClasses({ variant, outline, className? }): string`

const badgeVariantMap = {
  variant: {
    // TODO
  },
  outline: {
    // TODO
  },
} as const;

type BadgeVariant = keyof typeof badgeVariantMap.variant;
type BadgeOutline = keyof typeof badgeVariantMap.outline;

function resolveBadgeClasses(opts: {
  variant: BadgeVariant;
  outline: BadgeOutline;
  className?: string;
}): string {
  // TODO
  return "";
}

// =============================================================================
// EXERCISE 4 — cn() utility
// =============================================================================
// TODO: Implement a simplified `cn(...inputs: (string | false | null | undefined)[]): string`
//   - Filters out falsy values
//   - Joins remaining strings with a single space
//   - Trims the result
//   (This is the core of clsx — twMerge is out of scope here)

function cn(...inputs: (string | false | null | undefined)[]): string {
  // TODO
  return "";
}

// =============================================================================
// EXERCISE 5 — Input state variant
// =============================================================================
// TODO: Define `inputStateMap` (as const) with:
//   - state: { default, error, success, disabled }
//   - size:  { sm, md }
// TODO: Implement `resolveInputClasses({ state, size, className? }): string`

const inputStateMap = {
  state: {
    // TODO
  },
  size: {
    // TODO
  },
} as const;

type InputState = keyof typeof inputStateMap.state;
type InputSize  = keyof typeof inputStateMap.size;

function resolveInputClasses(opts: {
  state: InputState;
  size:  InputSize;
  className?: string;
}): string {
  // TODO
  return "";
}

// =============================================================================
// VERIFICATION
// =============================================================================

function verify(): void {
  // Exercise 1 — types are correct
  const v: ButtonVariant = "primary";
  const s: ButtonSize    = "md";
  console.assert(typeof v === "string", "Ex1: ButtonVariant should be a string");
  console.assert(typeof s === "string", "Ex1: ButtonSize should be a string");

  // Exercise 2 — resolveButtonClasses
  const classes1 = resolveButtonClasses({ variant: "primary", size: "md" });
  const classes2 = resolveButtonClasses({ variant: "danger", size: "sm", className: "my-2" });
  console.assert(typeof classes1 === "string",       "Ex2: should return a string");
  console.assert(classes2.includes("my-2"),          "Ex2: extra className should be included");
  console.assert(classes1 !== classes2,              "Ex2: different variants produce different classes");

  // Exercise 3 — badge variants
  const badge1 = resolveBadgeClasses({ variant: "success", outline: "false" });
  const badge2 = resolveBadgeClasses({ variant: "success", outline: "true", className: "ml-2" });
  console.assert(typeof badge1 === "string",   "Ex3: should return string");
  console.assert(badge2.includes("ml-2"),      "Ex3: extra className should be included");
  console.assert(badge1 !== badge2,            "Ex3: outline changes classes");

  // Exercise 4 — cn()
  console.assert(cn("a", "b", "c")              === "a b c",   "Ex4: basic join");
  console.assert(cn("a", false, "b")            === "a b",     "Ex4: filters false");
  console.assert(cn("a", null, undefined, "b")  === "a b",     "Ex4: filters null/undefined");
  console.assert(cn(false, null, undefined)      === "",        "Ex4: all falsy → empty string");
  console.assert(cn("  a  ", "  b  ")           === "a b",     "Ex4: trims result");

  // Exercise 5 — input classes
  const inputDefault = resolveInputClasses({ state: "default", size: "md" });
  const inputError   = resolveInputClasses({ state: "error",   size: "md" });
  console.assert(typeof inputDefault === "string", "Ex5: should return string");
  console.assert(inputDefault !== inputError,       "Ex5: error state differs from default");

  console.log("Chapter 12 verification complete ✓");
}

verify();
