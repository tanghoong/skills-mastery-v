/**
 * Chapter 21 — Accessibility & Storybook
 *
 * Type-check: npx tsc --noEmit --strict exercises/chapter_21.tsx
 * Run:        tsx exercises/chapter_21.tsx
 */

// =============================================================================
// EXERCISE 1 — ARIA attribute types
// =============================================================================
// TODO: Define `AriaRole` type as a subset of common ARIA roles:
//   "button" | "dialog" | "listbox" | "menu" | "menuitem" | "navigation"
//   | "option" | "radiogroup" | "tab" | "tablist" | "tabpanel" | "tooltip"
//   | "alert" | "alertdialog" | "checkbox" | "combobox" | "grid" | "link"
//   | "none" | "presentation" | "region" | "search" | "status"

type AriaRole = never; // replace with the union

// TODO: Define `AriaAttributes` interface with:
//   - role?:              AriaRole
//   - "aria-label"?:      string
//   - "aria-labelledby"?: string
//   - "aria-describedby"?: string
//   - "aria-expanded"?:   boolean
//   - "aria-selected"?:   boolean
//   - "aria-checked"?:    boolean | "mixed"
//   - "aria-disabled"?:   boolean
//   - "aria-hidden"?:     boolean
//   - "aria-required"?:   boolean
//   - "aria-invalid"?:    boolean | "grammar" | "spelling"
//   - "aria-live"?:       "polite" | "assertive" | "off"
//   - tabIndex?:          number

interface AriaAttributes {
  // TODO
}

// =============================================================================
// EXERCISE 2 — Keyboard event handler builder
// =============================================================================
// TODO: Define `KeyboardHandler` as a map type:
//   Partial<Record<"Enter" | "Escape" | "Space" | "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight" | "Home" | "End", () => void>>
//
// TODO: Implement `buildKeyboardHandler(handlers: KeyboardHandler): (e: { key: string; preventDefault: () => void }) => void`
//   For each key in handlers, when e.key matches (note: "Space" maps to " "), call the handler and e.preventDefault()

type KeyboardHandler = Partial<Record<
  "Enter" | "Escape" | "Space" | "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight" | "Home" | "End",
  () => void
>>;

function buildKeyboardHandler(
  handlers: KeyboardHandler
): (e: { key: string; preventDefault: () => void }) => void {
  // TODO: "Space" should match e.key === " "
  return () => {};
}

// =============================================================================
// EXERCISE 3 — Accessible component props
// =============================================================================
// TODO: Define `AccessibleButtonProps` with:
//   - label:      string (used as aria-label if no visible text)
//   - onClick:    () => void
//   - disabled?:  boolean
//   - isLoading?: boolean
//   - variant?:   "primary" | "secondary" | "danger"
//   - Spread from AriaAttributes

interface AccessibleButtonProps extends AriaAttributes {
  // TODO
}

// TODO: Define `AccessibleDialogProps` with:
//   - isOpen:    boolean
//   - onClose:   () => void
//   - title:     string  (maps to aria-labelledby)
//   - children:  unknown
//   The rendered dialog should have role="dialog" aria-modal=true

interface AccessibleDialogProps {
  // TODO
}

// =============================================================================
// EXERCISE 4 — Focus management simulation
// =============================================================================
// TODO: Define `FocusableElement` interface with:
//   - id:       string
//   - tabIndex: number
//   - disabled: boolean
//   - focus:    () => void
//   - blur:     () => void
//
// TODO: Implement `getFocusableElements(elements: FocusableElement[]): FocusableElement[]`
//   Returns elements where disabled === false and tabIndex >= 0, in order

interface FocusableElement {
  // TODO
}

function getFocusableElements(elements: FocusableElement[]): FocusableElement[] {
  // TODO
  return elements;
}

// TODO: Implement `trapFocus(elements: FocusableElement[], currentId: string, direction: "forward" | "backward"): string`
//   Returns the id of the next element to focus (wraps around at edges).

function trapFocus(
  elements: FocusableElement[],
  currentId: string,
  direction: "forward" | "backward"
): string {
  // TODO
  return currentId;
}

// =============================================================================
// EXERCISE 5 — Storybook meta type structure
// =============================================================================
// Storybook uses Meta<typeof Component> and StoryObj<typeof Component>.
// Without importing Storybook, model the equivalent structure:
//
// TODO: Define `StoryMeta<TComponent extends (...args: unknown[]) => unknown>` interface with:
//   - title:     string
//   - component: TComponent
//   - tags?:     string[]
//   - argTypes?: Partial<Record<string, { control: string; options?: string[] }>>
//
// TODO: Define `Story<TProps extends object>` interface with:
//   - args?:  Partial<TProps>
//   - render?: (args: TProps) => unknown

interface StoryMeta<TComponent extends (...args: unknown[]) => unknown> {
  // TODO
}

interface Story<TProps extends object> {
  // TODO
}

// =============================================================================
// VERIFICATION
// =============================================================================

function verify(): void {
  // Exercise 1 — AriaAttributes
  const buttonAttrs: AriaAttributes = {
    role: "button",
    "aria-label": "Close dialog",
    "aria-disabled": false,
  };
  console.assert(buttonAttrs.role === "button", "Ex1: role should be 'button'");

  const inputAttrs: AriaAttributes = {
    "aria-required": true,
    "aria-invalid": false,
    "aria-describedby": "email-hint",
  };
  console.assert(inputAttrs["aria-required"] === true, "Ex1: aria-required set");

  // Exercise 2 — keyboard handler
  let enterCalled = false;
  let escapeCalled = false;
  let spaceCalled  = false;
  let preventCalled = false;

  const handler = buildKeyboardHandler({
    Enter:  () => { enterCalled  = true; },
    Escape: () => { escapeCalled = true; },
    Space:  () => { spaceCalled  = true; },
  });

  handler({ key: "Enter",  preventDefault: () => { preventCalled = true; } });
  handler({ key: "Escape", preventDefault: () => {} });
  handler({ key: " ",      preventDefault: () => {} }); // Space maps to " "
  handler({ key: "a",      preventDefault: () => {} }); // no handler

  console.assert(enterCalled,   "Ex2: Enter handler called");
  console.assert(escapeCalled,  "Ex2: Escape handler called");
  console.assert(spaceCalled,   "Ex2: Space handler called via ' '");
  console.assert(preventCalled, "Ex2: preventDefault called on handled key");

  // Exercise 4 — focus management
  const createEl = (id: string, tabIndex: number, disabled = false): FocusableElement => ({
    id,
    tabIndex,
    disabled,
    focus: () => {},
    blur:  () => {},
  });

  const elements = [
    createEl("btn-1", 0),
    createEl("btn-2", 0, true),  // disabled — should be filtered out
    createEl("btn-3", -1),        // tabIndex < 0 — should be filtered out
    createEl("btn-4", 0),
    createEl("btn-5", 0),
  ];

  const focusable = getFocusableElements(elements);
  console.assert(focusable.length === 3,        "Ex4: 3 focusable elements");
  console.assert(focusable[0].id === "btn-1",   "Ex4: first focusable is btn-1");
  console.assert(focusable[1].id === "btn-4",   "Ex4: second focusable is btn-4");

  // trapFocus
  const next     = trapFocus(focusable, "btn-1",  "forward");
  const prev     = trapFocus(focusable, "btn-1",  "backward");
  const wrapFwd  = trapFocus(focusable, "btn-5",  "forward");   // wraps to first
  const wrapBwd  = trapFocus(focusable, "btn-1",  "backward");  // wraps to last

  console.assert(next    === "btn-4", "Ex4: forward from btn-1 → btn-4");
  console.assert(wrapFwd === "btn-1", "Ex4: forward from last → wraps to btn-1");
  // Note: prev and wrapBwd should wrap to last
  console.assert(prev    === "btn-5", "Ex4: backward from btn-1 → wraps to btn-5");

  console.log("Chapter 21 verification complete ✓");
}

verify();
