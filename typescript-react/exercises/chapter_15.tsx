/**
 * Chapter 15 — Compound Components
 *
 * Type-check: npx tsc --noEmit --strict exercises/chapter_15.tsx
 * Run:        tsx exercises/chapter_15.tsx
 *
 * These exercises implement compound component logic (without JSX rendering)
 * to practice context-sharing and typed sub-component APIs.
 */

// =============================================================================
// EXERCISE 1 — Tabs state machine
// =============================================================================
// Implement the pure logic behind a Tabs compound component.
//
// TODO: Define interface `TabsState` with:
//   - activeTab:  string
//   - tabs:       string[]  (all registered tab values)
//
// TODO: Define type `TabsAction` as discriminated union:
//   - { type: "activate";  value: string }
//   - { type: "register";  value: string }
//   - { type: "unregister"; value: string }
//
// TODO: Implement `tabsReducer(state: TabsState, action: TabsAction): TabsState`

interface TabsState {
  // TODO
}

type TabsAction = never; // replace with discriminated union

function tabsReducer(state: TabsState, action: TabsAction): TabsState {
  // TODO: handle activate, register, unregister
  return state;
}

// =============================================================================
// EXERCISE 2 — Accordion state machine
// =============================================================================
// TODO: Define interface `AccordionState` with:
//   - openItems:     string[]  (for multi-expand accordion)
//   - allowMultiple: boolean
//
// TODO: Define `AccordionAction` as discriminated union:
//   - { type: "toggle"; id: string }
//   - { type: "open";   id: string }
//   - { type: "close";  id: string }
//   - { type: "close_all" }
//
// TODO: Implement `accordionReducer`
//   - "toggle": if open → close; if closed → open (respecting allowMultiple)
//   - If !allowMultiple, toggling open should close all others first

interface AccordionState {
  // TODO
}

type AccordionAction = never; // replace

function accordionReducer(state: AccordionState, action: AccordionAction): AccordionState {
  // TODO
  return state;
}

// =============================================================================
// EXERCISE 3 — Card compound context value
// =============================================================================
// TODO: Define `CardContextValue` with:
//   - variant:   "default" | "featured" | "ghost"
//   - isLoading: boolean
//
// TODO: Implement `createCardContext(variant, isLoading)` that returns a `CardContextValue`

interface CardContextValue {
  // TODO
}

function createCardContext(
  variant: CardContextValue["variant"] = "default",
  isLoading = false
): CardContextValue {
  // TODO
  return {} as CardContextValue;
}

// =============================================================================
// EXERCISE 4 — Typed sub-component namespacing
// =============================================================================
// TODO: Define interface `TabsComposite` describing the compound component's shape:
//   A callable function (tabs root) + named sub-components:
//   - (props: { defaultValue: string; children: unknown }) => unknown
//   - List: (props: { children: unknown }) => unknown
//   - Trigger: (props: { value: string; children: unknown }) => unknown
//   - Panel: (props: { value: string; children: unknown }) => unknown
//
// Then verify the composite is correctly shaped.

interface TabsRootProps {
  defaultValue: string;
  children: unknown;
}

interface TabsListProps {
  children: unknown;
}

interface TabsTriggerProps {
  value: string;
  children: unknown;
}

interface TabsPanelProps {
  value: string;
  children: unknown;
}

interface TabsComposite {
  // TODO: The callable + sub-component properties
}

// =============================================================================
// EXERCISE 5 — Compound component guard
// =============================================================================
// TODO: Implement `createCompoundGuard<T>(parentName: string)`:
//   Returns a function that takes `T | undefined` and returns `T`,
//   throwing if undefined with message: "<ChildName> must be used inside <<ParentName>>"
//
// This is used by sub-components to verify they're inside the correct parent.

function createCompoundGuard<T>(parentName: string): (value: T | undefined) => T {
  // TODO
  return (v) => v as T;
}

// =============================================================================
// VERIFICATION
// =============================================================================

function verify(): void {
  // Exercise 1 — tabs reducer
  const init: TabsState = { activeTab: "projects", tabs: ["projects"] };

  const afterRegister = tabsReducer(init, { type: "register", value: "links" } as TabsAction);
  console.assert(afterRegister.tabs.includes("links"), "Ex1: links should be registered");

  const afterActivate = tabsReducer(afterRegister, { type: "activate", value: "links" } as TabsAction);
  console.assert(afterActivate.activeTab === "links", "Ex1: active tab should be 'links'");

  const afterUnregister = tabsReducer(afterActivate, { type: "unregister", value: "links" } as TabsAction);
  console.assert(!afterUnregister.tabs.includes("links"), "Ex1: links should be unregistered");

  // Exercise 2 — accordion reducer
  const accInit: AccordionState = { openItems: [], allowMultiple: false };

  const afterOpen = accordionReducer(accInit, { type: "open", id: "section-1" } as AccordionAction);
  console.assert(afterOpen.openItems.includes("section-1"), "Ex2: section-1 should be open");

  const afterToggle = accordionReducer(afterOpen, { type: "toggle", id: "section-1" } as AccordionAction);
  console.assert(!afterToggle.openItems.includes("section-1"), "Ex2: section-1 should be closed after toggle");

  // allowMultiple = false: opening second closes first
  const single: AccordionState = { openItems: ["section-1"], allowMultiple: false };
  const afterSecond = accordionReducer(single, { type: "open", id: "section-2" } as AccordionAction);
  console.assert(!afterSecond.openItems.includes("section-1"), "Ex2: single mode — first should close");
  console.assert(afterSecond.openItems.includes("section-2"),  "Ex2: single mode — second should open");

  const multi: AccordionState = { openItems: ["section-1"], allowMultiple: true };
  const afterMulti = accordionReducer(multi, { type: "open", id: "section-2" } as AccordionAction);
  console.assert(afterMulti.openItems.includes("section-1"), "Ex2: multi — first stays open");
  console.assert(afterMulti.openItems.includes("section-2"), "Ex2: multi — second opens");

  const afterCloseAll = accordionReducer(afterMulti, { type: "close_all" } as AccordionAction);
  console.assert(afterCloseAll.openItems.length === 0, "Ex2: close_all clears all");

  // Exercise 3 — card context
  const ctx1 = createCardContext("featured", false);
  console.assert(ctx1.variant === "featured",  "Ex3: variant should be 'featured'");
  console.assert(ctx1.isLoading === false,     "Ex3: isLoading should be false");

  const ctx2 = createCardContext();
  console.assert(ctx2.variant === "default", "Ex3: default variant is 'default'");

  // Exercise 5 — compound guard
  const tabsGuard = createCompoundGuard<TabsContextValue>("Tabs");

  interface TabsContextValue { activeTab: string }
  const mockCtx: TabsContextValue = { activeTab: "projects" };
  const result = tabsGuard(mockCtx);
  console.assert(result.activeTab === "projects", "Ex5: should return value when defined");

  let threw = false;
  try { tabsGuard(undefined); }
  catch (e) {
    threw = true;
    console.assert(e instanceof Error && e.message.includes("Tabs"), "Ex5: error mentions Tabs");
  }
  console.assert(threw, "Ex5: should throw when undefined");

  console.log("Chapter 15 verification complete ✓");
}

verify();
