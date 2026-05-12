/**
 * Chapter 4 — Events & Forms
 *
 * Type-check: npx tsc --noEmit --strict exercises/chapter_04.tsx
 * Run:        tsx exercises/chapter_04.tsx
 *
 * These exercises build typed event handler factories and form state logic
 * for DevLink's link and profile forms.
 */

import type { ChangeEventHandler, FormEventHandler, MouseEventHandler, KeyboardEventHandler } from "react";

// Simulated React event types for tsx-only execution
interface FakeChangeEvent<T> {
  target: T & { value: string; checked: boolean };
}

// =============================================================================
// EXERCISE 1 — Match event types to elements
// =============================================================================
// TODO: Write the correct React event type for each handler signature.
//       Replace `never` with the correct type.

// Input text change
type InputChangeHandler    = (e: never) => void; // → React.ChangeEvent<HTMLInputElement>

// Form submit
type FormSubmitHandler     = (e: never) => void; // → React.FormEvent<HTMLFormElement>

// Button click
type ButtonClickHandler    = (e: never) => void; // → React.MouseEvent<HTMLButtonElement>

// Keyboard on input
type InputKeyDownHandler   = (e: never) => void; // → React.KeyboardEvent<HTMLInputElement>

// Select change
type SelectChangeHandler   = (e: never) => void; // → React.ChangeEvent<HTMLSelectElement>

// =============================================================================
// EXERCISE 2 — SocialLink form data
// =============================================================================
// TODO: Define interface `LinkFormData` with:
//   - platform: "github" | "twitter" | "linkedin" | "youtube" | "website" | "other"
//   - url:      string
//   - label:    string

interface LinkFormData {
  // TODO
}

// TODO: Implement `createEmptyLinkForm` returning a `LinkFormData` with
//   platform: "github", url: "", label: ""

function createEmptyLinkForm(): LinkFormData {
  // TODO
  return {} as LinkFormData;
}

// =============================================================================
// EXERCISE 3 — Generic field updater
// =============================================================================
// TODO: Implement `makeFieldUpdater` — a generic function that:
//   - Takes a `setState` function of type `(fn: (prev: T) => T) => void`
//   - Returns a function that accepts `field: keyof T` and `value: string`
//     and calls setState with the updated object
// This models the pattern used in controlled form components.

function makeFieldUpdater<T extends Record<string, string>>(
  setState: (fn: (prev: T) => T) => void
) {
  // TODO: return a function (field: keyof T, value: string) => void
  return (_field: keyof T, _value: string): void => {};
}

// =============================================================================
// EXERCISE 4 — Typed keyboard handler
// =============================================================================
// TODO: Implement `createKeyHandler` that takes an object mapping key names
//       to callbacks, and returns a KeyboardEventHandler<HTMLInputElement>.
//       Keys to support: "Enter", "Escape", "ArrowUp", "ArrowDown"

type KeyMap = Partial<Record<"Enter" | "Escape" | "ArrowUp" | "ArrowDown", () => void>>;

function createKeyHandler(_keyMap: KeyMap): KeyboardEventHandler<HTMLInputElement> {
  // TODO
  return () => {};
}

// =============================================================================
// EXERCISE 5 — Form validation
// =============================================================================
// TODO: Define interface `FormErrors<T>` as a type where each key of T
//       maps to an optional string (the error message)

type FormErrors<T> = {
  // TODO: Partial<Record<keyof T, string>> or similar
};

// TODO: Implement `validateLinkForm` that takes a `LinkFormData` and returns
//       `FormErrors<LinkFormData>`. Rules:
//   - url must not be empty and must start with "https://"
//   - label must not be empty (min 1 character)
//   - platform must be a valid value (it's a union — trust the type)
//   Return an empty object if all valid.

function validateLinkForm(data: LinkFormData): FormErrors<LinkFormData> {
  // TODO
  return {};
}

// =============================================================================
// EXERCISE 6 — Controlled vs uncontrolled decision
// =============================================================================
// For each scenario, write: "controlled" or "uncontrolled" as a comment.

// A) A search input that filters a list as the user types
//    Answer: ???

// B) A login form where you only need the values when Submit is clicked
//    Answer: ???

// C) A profile bio field with a live character counter (500 max)
//    Answer: ???

// D) A bulk import form with 20 fields, submitted once, no validation needed live
//    Answer: ???

// =============================================================================
// EXERCISE 7 — Handler type aliases using React shorthand
// =============================================================================
// TODO: Using ChangeEventHandler, FormEventHandler, MouseEventHandler from react,
//       define the props interface for a `SearchBar` component that has:
//   - value:       string
//   - onChange:    ChangeEventHandler<HTMLInputElement>
//   - onSubmit:    FormEventHandler<HTMLFormElement>
//   - onClear:     MouseEventHandler<HTMLButtonElement>
//   - placeholder?: string

interface SearchBarProps {
  // TODO
}

// =============================================================================
// VERIFICATION
// =============================================================================

function verify(): void {
  // Exercise 2
  const empty = createEmptyLinkForm();
  console.assert(empty.platform === "github", "Ex2: default platform should be 'github'");
  console.assert(empty.url === "",            "Ex2: url should be empty");
  console.assert(empty.label === "",          "Ex2: label should be empty");

  // Exercise 3 — makeFieldUpdater
  let state: LinkFormData = { platform: "github", url: "", label: "" };
  const setter = (fn: (prev: LinkFormData) => LinkFormData) => {
    state = fn(state);
  };
  const update = makeFieldUpdater<LinkFormData>(setter);
  update("url", "https://github.com/charlie");
  console.assert(state.url === "https://github.com/charlie", "Ex3: url should be updated");
  console.assert(state.label === "",                          "Ex3: label should be unchanged");

  // Exercise 4 — keyboard handler
  let enterCalled = false;
  let escapeCalled = false;
  const handler = createKeyHandler({
    Enter: () => { enterCalled = true; },
    Escape: () => { escapeCalled = true; },
  });
  handler({ key: "Enter" } as unknown as React.KeyboardEvent<HTMLInputElement>);
  handler({ key: "Escape" } as unknown as React.KeyboardEvent<HTMLInputElement>);
  handler({ key: "a" } as unknown as React.KeyboardEvent<HTMLInputElement>); // no-op
  console.assert(enterCalled,  "Ex4: Enter handler should have been called");
  console.assert(escapeCalled, "Ex4: Escape handler should have been called");

  // Exercise 5 — validation
  const validData: LinkFormData   = { platform: "github", url: "https://github.com/c", label: "GitHub" };
  const invalidUrl: LinkFormData  = { platform: "twitter", url: "not-a-url", label: "Twitter" };
  const emptyLabel: LinkFormData  = { platform: "linkedin", url: "https://linkedin.com/in/c", label: "" };

  const validErrors   = validateLinkForm(validData);
  const urlErrors     = validateLinkForm(invalidUrl);
  const labelErrors   = validateLinkForm(emptyLabel);

  console.assert(Object.keys(validErrors).length === 0,  "Ex5: valid data should have no errors");
  console.assert("url" in urlErrors,                     "Ex5: invalid URL should produce url error");
  console.assert("label" in labelErrors,                 "Ex5: empty label should produce label error");

  console.log("Chapter 4 verification complete ✓");
}

// Needed to reference React types in verify()
// eslint-disable-next-line @typescript-eslint/no-namespace
declare namespace React {
  interface KeyboardEvent<T> { key: string }
}

verify();
