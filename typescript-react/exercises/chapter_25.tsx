/**
 * Chapter 25 — Animations with Framer Motion
 *
 * Type-check: npx tsc --noEmit --strict exercises/chapter_25.tsx
 * Run:        tsx exercises/chapter_25.tsx
 *
 * These exercises model Framer Motion types without the library —
 * focus on understanding Variants, transition types, and animation state.
 */

// =============================================================================
// EXERCISE 1 — Variants type
// =============================================================================
// TODO: Define `AnimationTarget` interface with optional CSS properties:
//   - opacity?:    number
//   - x?:          number
//   - y?:          number
//   - scale?:      number
//   - rotate?:     number
//   - width?:      string | number
//   - height?:     string | number
//
// TODO: Define `TransitionConfig` interface with optional fields:
//   - duration?: number
//   - delay?:    number
//   - ease?:     "linear" | "easeIn" | "easeOut" | "easeInOut" | number[]
//   - staggerChildren?: number
//   - delayChildren?:   number
//   - type?:    "spring" | "tween" | "inertia"
//   - stiffness?: number
//   - damping?:   number
//
// TODO: Define `VariantDefinition` = AnimationTarget & { transition?: TransitionConfig }
// TODO: Define `Variants` = Record<string, VariantDefinition>

interface AnimationTarget {
  // TODO
}

interface TransitionConfig {
  // TODO
}

type VariantDefinition = AnimationTarget & { transition?: TransitionConfig };
type Variants = Record<string, VariantDefinition>;

// =============================================================================
// EXERCISE 2 — Define DevLink animation variants
// =============================================================================
// TODO: Create these typed `Variants` objects:
//
//   A) `fadeInVariants`: hidden={opacity:0,y:20}, visible={opacity:1,y:0,transition:{duration:0.3}}
//   B) `slideInVariants`: hidden={opacity:0,x:-20}, visible={opacity:1,x:0,transition:{duration:0.25}}
//   C) `scaleVariants`:   hidden={opacity:0,scale:0.9}, visible={opacity:1,scale:1,transition:{duration:0.2}}
//   D) `staggerContainer`: hidden={opacity:0}, visible={opacity:1,transition:{staggerChildren:0.1,delayChildren:0.2}}

const fadeInVariants: Variants = {
  // TODO
};

const slideInVariants: Variants = {
  // TODO
};

const scaleVariants: Variants = {
  // TODO
};

const staggerContainer: Variants = {
  // TODO
};

// =============================================================================
// EXERCISE 3 — Animation state machine
// =============================================================================
// TODO: Define `AnimationState` as a discriminated union:
//   - { state: "idle" }
//   - { state: "animating"; fromVariant: string; toVariant: string }
//   - { state: "complete"; variant: string }
//
// TODO: Define `AnimationAction` as:
//   - { type: "start";    from: string; to: string }
//   - { type: "complete"; variant: string }
//   - { type: "reset" }
//
// TODO: Implement `animationReducer(state: AnimationState, action: AnimationAction): AnimationState`

type AnimationState = never; // replace

type AnimationAction = never; // replace

function animationReducer(state: AnimationState, action: AnimationAction): AnimationState {
  // TODO
  return state;
}

// =============================================================================
// EXERCISE 4 — MotionValue simulation
// =============================================================================
// `useMotionValue<T>` creates a reactive value that doesn't trigger re-renders.
// `useTransform` maps one value range to another.
//
// TODO: Define `MotionValue<T>` interface with:
//   - get:         () => T
//   - set:         (value: T) => void
//   - onChange:    (callback: (value: T) => void) => () => void  (returns unsub fn)
//
// TODO: Implement `createMotionValue<T>(initial: T): MotionValue<T>`
//   Use a subscriber pattern with an internal Set of callbacks.
//
// TODO: Implement `createTransform<TIn extends number, TOut>(
//   source: MotionValue<TIn>,
//   inputRange: [TIn, TIn],
//   outputRange: [TOut, TOut]
// ): MotionValue<TOut>`
//   Linearly maps source value from inputRange to outputRange.
//   Output is live (subscribes to source and remaps).

interface MotionValue<T> {
  // TODO
}

function createMotionValue<T>(initial: T): MotionValue<T> {
  // TODO
  return {
    get: () => initial,
    set: () => {},
    onChange: () => () => {},
  };
}

function createTransform<TOut>(
  source: MotionValue<number>,
  inputRange:  [number, number],
  outputRange: [TOut, TOut]
): MotionValue<TOut> {
  // TODO: linear interpolation between outputRange values
  return createMotionValue(outputRange[0]) as unknown as MotionValue<TOut>;
}

// =============================================================================
// EXERCISE 5 — AnimatePresence key tracking
// =============================================================================
// AnimatePresence requires unique keys to track enter/exit.
// TODO: Define `AnimatePresenceState<T extends { id: string }>` with:
//   - items:      T[]
//   - exitingIds: Set<string>  (items that are leaving)
//
// TODO: Implement `addItem<T extends { id: string }>(state: AnimatePresenceState<T>, item: T): AnimatePresenceState<T>`
//   Adds item to items (if not already present).
//
// TODO: Implement `startExit<T extends { id: string }>(state: AnimatePresenceState<T>, id: string): AnimatePresenceState<T>`
//   Adds id to exitingIds (marks as leaving).
//
// TODO: Implement `completeExit<T extends { id: string }>(state: AnimatePresenceState<T>, id: string): AnimatePresenceState<T>`
//   Removes from both items and exitingIds.

interface AnimatePresenceState<T extends { id: string }> {
  items:      T[];
  exitingIds: Set<string>;
}

function addItem<T extends { id: string }>(
  state: AnimatePresenceState<T>,
  item: T
): AnimatePresenceState<T> {
  // TODO
  return state;
}

function startExit<T extends { id: string }>(
  state: AnimatePresenceState<T>,
  id: string
): AnimatePresenceState<T> {
  // TODO
  return state;
}

function completeExit<T extends { id: string }>(
  state: AnimatePresenceState<T>,
  id: string
): AnimatePresenceState<T> {
  // TODO
  return state;
}

// =============================================================================
// VERIFICATION
// =============================================================================

function verify(): void {
  // Exercise 2 — variants
  console.assert(fadeInVariants.hidden.opacity === 0,   "Ex2: hidden opacity is 0");
  console.assert(fadeInVariants.visible.opacity === 1,  "Ex2: visible opacity is 1");
  console.assert(staggerContainer.visible.transition?.staggerChildren === 0.1, "Ex2: stagger children set");

  // Exercise 3 — animation state machine
  const idle: AnimationState   = { state: "idle" } as AnimationState;
  const animating = animationReducer(idle, { type: "start", from: "hidden", to: "visible" } as AnimationAction);
  console.assert((animating as {state: string}).state === "animating", "Ex3: should be animating");

  const complete = animationReducer(animating, { type: "complete", variant: "visible" } as AnimationAction);
  console.assert((complete as {state: string}).state === "complete", "Ex3: should be complete");

  const reset = animationReducer(complete, { type: "reset" } as AnimationAction);
  console.assert((reset as {state: string}).state === "idle", "Ex3: should reset to idle");

  // Exercise 4 — MotionValue
  const mv = createMotionValue(0);
  console.assert(mv.get() === 0, "Ex4: initial value");
  mv.set(100);
  console.assert(mv.get() === 100, "Ex4: value after set");

  let callbackValue = -1;
  const unsub = mv.onChange((v) => { callbackValue = v; });
  mv.set(42);
  console.assert(callbackValue === 42, "Ex4: onChange callback fires");
  unsub();
  mv.set(0); // after unsubscribe — callback should NOT fire
  console.assert(callbackValue === 42, "Ex4: no callback after unsubscribe");

  // createTransform
  const scrollY = createMotionValue(0);
  const opacity = createTransform(scrollY, [0, 300], [1, 0]);
  console.assert(Math.abs(opacity.get() - 1) < 0.01, "Ex4: transform at 0 → opacity 1");

  scrollY.set(150); // midpoint
  console.assert(Math.abs(opacity.get() - 0.5) < 0.05, "Ex4: transform at midpoint → opacity ~0.5");

  scrollY.set(300);
  console.assert(Math.abs(opacity.get() - 0) < 0.01, "Ex4: transform at max → opacity 0");

  // Exercise 5 — AnimatePresence state
  interface Toast { id: string; message: string }
  const init: AnimatePresenceState<Toast> = { items: [], exitingIds: new Set() };

  const t1: Toast = { id: "1", message: "Saved!" };
  const t2: Toast = { id: "2", message: "Error" };

  const after1 = addItem(init, t1);
  const after2 = addItem(after1, t2);
  console.assert(after2.items.length === 2, "Ex5: 2 items after adding");

  const exiting = startExit(after2, "1");
  console.assert(exiting.exitingIds.has("1"), "Ex5: item 1 in exitingIds");
  console.assert(exiting.items.length === 2,  "Ex5: items not removed yet");

  const completed = completeExit(exiting, "1");
  console.assert(completed.items.length === 1,         "Ex5: item removed after exit complete");
  console.assert(!completed.exitingIds.has("1"),        "Ex5: id cleared from exitingIds");

  console.log("Chapter 25 verification complete ✓");
}

verify();
