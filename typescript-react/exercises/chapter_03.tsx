/**
 * Chapter 3 — Hooks: State, Refs & Effects
 *
 * Type-check: npx tsc --noEmit --strict exercises/chapter_03.tsx
 * Run:        tsx exercises/chapter_03.tsx
 *
 * These exercises implement typed hook logic and state transitions
 * used throughout the DevLink admin dashboard.
 */

// Simulated React types for tsx-only execution
type Dispatch<A> = (action: A) => void;
type SetStateAction<S> = S | ((prev: S) => S);

// =============================================================================
// EXERCISE 1 — useState type annotations
// =============================================================================
// Below are useState calls that TypeScript cannot infer correctly.
// TODO: Write the correct type annotation comment next to each one explaining
//       what the generic should be, and why inference fails.

// useState(null)        → needs annotation because: ???
// useState([])          → needs annotation because: ???
// useState("idle")      → correct without annotation because: ???
// useState({ name: "", bio: "" }) → correct without annotation because: ???

// =============================================================================
// EXERCISE 2 — ProfileForm state type
// =============================================================================
// TODO: Define interface `ProfileFormState` with:
//   - name:      string
//   - bio:       string
//   - avatarUrl: string
//   - location:  string
// TODO: Write a function `createEmptyProfile` that returns a `ProfileFormState`
//       with all fields set to empty strings.
// TODO: Write a function `updateField` that takes:
//   - state: ProfileFormState
//   - field: keyof ProfileFormState
//   - value: string
//   and returns a new ProfileFormState with that field updated (spread pattern)

interface ProfileFormState {
  // TODO
}

function createEmptyProfile(): ProfileFormState {
  // TODO
  return {} as ProfileFormState;
}

function updateField(
  state: ProfileFormState,
  field: keyof ProfileFormState,
  value: string
): ProfileFormState {
  // TODO
  return state;
}

// =============================================================================
// EXERCISE 3 — useReducer action types
// =============================================================================
// TODO: Define the action union type `ProjectAction` for a projects reducer:
//   - { type: "set_all"; payload: Project[] }
//   - { type: "add"; payload: Project }
//   - { type: "remove"; id: string }
//   - { type: "toggle_featured"; id: string }
//   - { type: "reset" }

interface Project {
  id: string;
  title: string;
  featured: boolean;
  tags: string[];
}

type ProjectAction = never; // replace with discriminated union

// TODO: Define `ProjectsState` with:
//   - items:       Project[]
//   - isLoading:   boolean
//   - selectedId:  string | null

interface ProjectsState {
  // TODO
}

// TODO: Implement `projectsReducer` — handle all five action types
function projectsReducer(state: ProjectsState, action: ProjectAction): ProjectsState {
  // TODO
  return state;
}

// =============================================================================
// EXERCISE 4 — useState vs useEffect decision
// =============================================================================
// For each scenario, answer: should this use useState, useEffect, or both?
// Write your answer as a comment next to each scenario.

// Scenario A: Track whether the profile form has unsaved changes
// Answer: ???

// Scenario B: Fetch the user's projects when the admin dashboard mounts
// Answer: ???

// Scenario C: Store the currently selected tab ("projects" | "links" | "settings")
// Answer: ???

// Scenario D: Update the document title when the active project changes
// Answer: ???

// Scenario E: Store the result of an API call (data, loading, error)
// Answer: ???

// =============================================================================
// EXERCISE 5 — Typed useRef scenarios
// =============================================================================
// TODO: For each use case, write the correct useRef type annotation:
//   a) A ref for an <input> element to call .focus() programmatically
//   b) A ref to store a setInterval return value (mutable, not DOM)
//   c) A ref to track whether the component has mounted (boolean flag)

// type InputRef    = useRef<???>(???)  — fill in the type and initial value
// type IntervalRef = useRef<???>(???)
// type MountedRef  = useRef<???>(???)

// =============================================================================
// EXERCISE 6 — useEffect cleanup
// =============================================================================
// TODO: Implement `createWindowResizeEffect` — a function that:
//   - Takes a callback `(width: number, height: number) => void`
//   - Returns a cleanup function that removes the event listener
//   (This simulates what a useEffect callback body would do)

function createWindowResizeEffect(
  callback: (width: number, height: number) => void
): () => void {
  // TODO: add listener, return cleanup
  return () => {};
}

// =============================================================================
// VERIFICATION
// =============================================================================

function verify(): void {
  // Exercise 2 — ProfileFormState
  const empty = createEmptyProfile();
  console.assert(empty.name === "",      "Ex2: name should be empty string");
  console.assert(empty.bio === "",       "Ex2: bio should be empty string");
  console.assert(empty.avatarUrl === "", "Ex2: avatarUrl should be empty string");

  const updated = updateField(empty, "name", "Charlie");
  console.assert(updated.name === "Charlie", "Ex2: name should be updated");
  console.assert(updated.bio === "",         "Ex2: bio should be unchanged");

  const updatedBio = updateField(updated, "bio", "TypeScript dev");
  console.assert(updatedBio.name === "Charlie",        "Ex2: name preserved after bio update");
  console.assert(updatedBio.bio === "TypeScript dev",  "Ex2: bio updated");

  // Exercise 3 — projectsReducer
  const initialState: ProjectsState = { items: [], isLoading: false, selectedId: null };

  const p1: Project = { id: "1", title: "DevLink", featured: false, tags: [] };
  const p2: Project = { id: "2", title: "Portfolio", featured: true, tags: ["react"] };

  const afterAdd = projectsReducer(
    initialState,
    { type: "add", payload: p1 } as ProjectAction
  );
  console.assert(afterAdd.items.length === 1, "Ex3: should have 1 project after add");

  const afterSecond = projectsReducer(
    afterAdd,
    { type: "add", payload: p2 } as ProjectAction
  );
  console.assert(afterSecond.items.length === 2, "Ex3: should have 2 projects");

  const afterToggle = projectsReducer(
    afterSecond,
    { type: "toggle_featured", id: "1" } as ProjectAction
  );
  const devLink = afterToggle.items.find((p) => p.id === "1");
  console.assert(devLink?.featured === true, "Ex3: DevLink should be featured after toggle");

  const afterRemove = projectsReducer(
    afterSecond,
    { type: "remove", id: "1" } as ProjectAction
  );
  console.assert(afterRemove.items.length === 1, "Ex3: should have 1 project after remove");

  const afterReset = projectsReducer(
    afterSecond,
    { type: "reset" } as ProjectAction
  );
  console.assert(afterReset.items.length === 0, "Ex3: items should be empty after reset");

  // Exercise 6 — cleanup function
  const cleanup = createWindowResizeEffect(() => {});
  console.assert(typeof cleanup === "function", "Ex6: should return a cleanup function");
  cleanup(); // should not throw

  console.log("Chapter 3 verification complete ✓");
}

verify();
