/**
 * Chapter 18 — React 19 New Hooks
 *
 * Type-check: npx tsc --noEmit --strict exercises/chapter_18.tsx
 * Run:        tsx exercises/chapter_18.tsx
 *
 * These exercises model the typing patterns for React 19 hooks without
 * actual React imports — focus on understanding the type signatures.
 */

// =============================================================================
// EXERCISE 1 — useOptimistic type signature
// =============================================================================
// `useOptimistic<S, A>(state: S, updateFn: (current: S, update: A) => S)`
// returns `[optimisticState: S, addOptimistic: (update: A) => void]`
//
// TODO: Define the TypeScript overload signature for `useOptimistic`:

declare function useOptimistic<S, A>(
  state: S,
  updateFn: (currentState: S, update: A) => S
): [optimisticState: S, addOptimistic: (update: A) => void];

// TODO: Using the declared type, write the correct variable annotations for
//       these useOptimistic calls (just the LHS types, not the impl):

interface Project { id: string; title: string; featured: boolean; }
interface Todo    { id: string; text: string; done: boolean; }

// A) Optimistic toggle of `featured` on a single project
//    state: Project, update: boolean
//    annotate: const [optimisticProject, setFeatured] = useOptimistic<???, ???>(...)

// B) Optimistic add to a list of todos
//    state: Todo[], update: Todo
//    annotate: const [optimisticTodos, addTodo] = useOptimistic<???, ???>(...)

// C) Optimistic delete from a list
//    state: string[], update: string  (the id to remove)
//    annotate: const [optimisticIds, removeId] = useOptimistic<???, ???>(...)

// Write your answers here as comments:
// A: useOptimistic<Project, boolean>
// B: ???
// C: ???

// =============================================================================
// EXERCISE 2 — Action state shape
// =============================================================================
// `useActionState` requires an initial state and returns [state, dispatch, isPending]
//
// TODO: Define `ProfileActionState` with:
//   - errors:   Partial<Record<"name" | "bio", string>>
//   - message:  string | null
//   - success:  boolean

interface ProfileActionState {
  // TODO
}

// TODO: Define the initial state value `profileActionInitialState: ProfileActionState`
const profileActionInitialState: ProfileActionState = {
  // TODO
};

// =============================================================================
// EXERCISE 3 — Server Action return type
// =============================================================================
// Server Actions return serialisable data — no functions, no class instances.
// TODO: Define `ActionResult<T = void>` as a discriminated union:
//   - { ok: true; data: T }
//   - { ok: false; error: string; fieldErrors?: Record<string, string> }

type ActionResult<T = void> = never; // replace

// TODO: Implement `createActionResult` factory functions:
//   - `actionOk<T>(data: T): ActionResult<T>`
//   - `actionFail(error: string, fieldErrors?: Record<string, string>): ActionResult<never>`

function actionOk<T>(data: T): ActionResult<T> {
  // TODO
  return {} as ActionResult<T>;
}

function actionFail(error: string, fieldErrors?: Record<string, string>): ActionResult<never> {
  // TODO
  return {} as ActionResult<never>;
}

// =============================================================================
// EXERCISE 4 — Optimistic list mutation helpers
// =============================================================================
// useOptimistic needs an update function that computes the next state.
// Implement these typed update functions:

// TODO: `optimisticAdd<T>(current: T[], item: T): T[]`
//   Returns current with item appended.

function optimisticAdd<T>(current: T[], item: T): T[] {
  // TODO
  return current;
}

// TODO: `optimisticRemove<T extends { id: string }>(current: T[], id: string): T[]`
//   Returns current with the item matching id removed.

function optimisticRemove<T extends { id: string }>(current: T[], id: string): T[] {
  // TODO
  return current;
}

// TODO: `optimisticUpdate<T extends { id: string }>(current: T[], id: string, patch: Partial<T>): T[]`
//   Returns current with the matching item merged with patch.

function optimisticUpdate<T extends { id: string }>(current: T[], id: string, patch: Partial<T>): T[] {
  // TODO
  return current;
}

// =============================================================================
// EXERCISE 5 — FormData field extraction
// =============================================================================
// Server Actions receive FormData. Implement typed extractors.
//
// TODO: Implement `getFormString(data: FormData, key: string): string`
//   Returns the value as string, or "" if absent.
//
// TODO: Implement `getFormBoolean(data: FormData, key: string): boolean`
//   Returns true if the value is "true" or "on", false otherwise.
//
// TODO: Implement `getFormNumber(data: FormData, key: string, fallback?: number): number`
//   Parses to number, returns fallback (default 0) if NaN or absent.

function getFormString(data: FormData, key: string): string {
  // TODO
  return "";
}

function getFormBoolean(data: FormData, key: string): boolean {
  // TODO
  return false;
}

function getFormNumber(data: FormData, key: string, fallback = 0): number {
  // TODO
  return fallback;
}

// =============================================================================
// VERIFICATION
// =============================================================================

function verify(): void {
  // Exercise 2 — initial state
  console.assert(profileActionInitialState.success === false,  "Ex2: initial success is false");
  console.assert(profileActionInitialState.message === null,   "Ex2: initial message is null");

  // Exercise 3 — ActionResult
  const ok = actionOk({ id: "1", name: "Charlie" });
  console.assert(ok.ok === true, "Ex3: actionOk → ok: true");
  if (ok.ok) {
    console.assert(ok.data.name === "Charlie", "Ex3: data is accessible");
  }

  const fail = actionFail("Validation failed", { name: "Name is required" });
  console.assert(fail.ok === false, "Ex3: actionFail → ok: false");
  if (!fail.ok) {
    console.assert(fail.error === "Validation failed",       "Ex3: error message");
    console.assert(fail.fieldErrors?.name === "Name is required", "Ex3: fieldErrors");
  }

  // Exercise 4 — optimistic helpers
  const todos: Todo[] = [
    { id: "1", text: "Write tests", done: false },
    { id: "2", text: "Review PR",   done: true },
  ];

  const added = optimisticAdd(todos, { id: "3", text: "Deploy", done: false });
  console.assert(added.length === 3, "Ex4: add should have 3 items");

  const removed = optimisticRemove(todos, "1");
  console.assert(removed.length === 1, "Ex4: remove should have 1 item");
  console.assert(removed[0].id === "2", "Ex4: correct item removed");

  const updated = optimisticUpdate(todos, "1", { done: true });
  console.assert(updated.find(t => t.id === "1")?.done === true, "Ex4: item updated");
  console.assert(updated.find(t => t.id === "2")?.done === true, "Ex4: other item unchanged");

  // Exercise 5 — FormData extraction
  const fd = new FormData();
  fd.append("name", "Charlie");
  fd.append("featured", "true");
  fd.append("order", "3");

  console.assert(getFormString(fd, "name")    === "Charlie", "Ex5: string extraction");
  console.assert(getFormString(fd, "missing") === "",        "Ex5: missing → ''");
  console.assert(getFormBoolean(fd, "featured") === true,    "Ex5: 'true' → true");
  console.assert(getFormBoolean(fd, "missing")  === false,   "Ex5: missing → false");
  console.assert(getFormNumber(fd, "order")      === 3,      "Ex5: '3' → 3");
  console.assert(getFormNumber(fd, "missing")    === 0,      "Ex5: missing → 0 (default)");
  console.assert(getFormNumber(fd, "missing", 5) === 5,      "Ex5: missing → custom fallback");

  console.log("Chapter 18 verification complete ✓");
}

verify();
