/**
 * Chapter 7 — Custom Hooks
 *
 * Type-check: npx tsc --noEmit --strict exercises/chapter_07.tsx
 * Run:        tsx exercises/chapter_07.tsx
 *
 * These exercises implement custom hooks (as pure logic functions without React)
 * to practice return type design and generic hook patterns.
 */

// =============================================================================
// EXERCISE 1 — Toggle hook return type
// =============================================================================
// TODO: Define interface `UseToggleReturn` with:
//   - isOn:    boolean
//   - toggle:  () => void
//   - setOn:   () => void
//   - setOff:  () => void
// Then implement `simulateToggle` (non-hook version) that:
//   - Takes `initial: boolean = false`
//   - Returns `UseToggleReturn` using a mutable let variable for state

interface UseToggleReturn {
  // TODO
}

function simulateToggle(initial = false): UseToggleReturn {
  // TODO: use a mutable `let isOn = initial` and return an object with closures
  return {} as UseToggleReturn;
}

// =============================================================================
// EXERCISE 2 — Tuple return with `as const`
// =============================================================================
// TODO: Implement `simulateLocalStorage<T>` that:
//   - Takes `key: string` and `initial: T`
//   - Simulates localStorage with an in-memory Map (passed as a parameter)
//   - Returns a tuple `[value: T, set: (next: T) => void]` using `as const`
//   The return type should be inferred as `readonly [T, (next: T) => void]`

function simulateLocalStorage<T>(
  key: string,
  initial: T,
  store: Map<string, string>
): readonly [T, (next: T) => void] {
  // TODO
  return [initial, () => {}] as const;
}

// =============================================================================
// EXERCISE 3 — Generic async state hook
// =============================================================================
// TODO: Define interface `AsyncState<T>` with:
//   - data:      T | null
//   - isLoading: boolean
//   - error:     Error | null
// TODO: Implement `simulateAsync<T>` that:
//   - Takes an async function `fn: () => Promise<T>`
//   - Returns a Promise<AsyncState<T>> with the resolved state
//   - On success: { data: result, isLoading: false, error: null }
//   - On error:   { data: null,   isLoading: false, error: the Error }

interface AsyncState<T> {
  // TODO
}

async function simulateAsync<T>(fn: () => Promise<T>): Promise<AsyncState<T>> {
  // TODO
  return { data: null, isLoading: false, error: null } as AsyncState<T>;
}

// =============================================================================
// EXERCISE 4 — useCallback equivalents
// =============================================================================
// TODO: Implement `memoize<TArgs extends unknown[], TReturn>` that:
//   - Takes a function `fn: (...args: TArgs) => TReturn`
//   - Returns a function with the same signature that:
//     * Caches the last result by stringifying the args
//     * Returns the cached result if args haven't changed
//   This simulates what useCallback + useMemo do together

function memoize<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => TReturn
): (...args: TArgs) => TReturn {
  // TODO
  return fn;
}

// =============================================================================
// EXERCISE 5 — Hook return: object vs tuple
// =============================================================================
// DevLink uses a `usePagination` hook. Implement the non-hook version.
//
// TODO: Define interface `PaginationReturn` with:
//   - page:      number
//   - pageSize:  number
//   - totalPages: number  (computed)
//   - hasNext:   boolean  (computed)
//   - hasPrev:   boolean  (computed)
//   - goNext:    () => void
//   - goPrev:    () => void
//   - goTo:      (page: number) => void
//
// TODO: Implement `simulatePagination(totalItems: number, pageSize: number)`:
//   Returns a `PaginationReturn` starting at page 1.
//   goNext, goPrev, goTo should mutate internal state (let variable).

interface PaginationReturn {
  // TODO
}

function simulatePagination(totalItems: number, pageSize: number): PaginationReturn {
  // TODO
  return {} as PaginationReturn;
}

// =============================================================================
// VERIFICATION
// =============================================================================

async function verify(): Promise<void> {
  // Exercise 1 — toggle
  const toggle = simulateToggle(false);
  console.assert(toggle.isOn === false, "Ex1: initial state should be false");
  toggle.toggle();
  console.assert(toggle.isOn === true, "Ex1: after toggle should be true");
  toggle.setOff();
  console.assert(toggle.isOn === false, "Ex1: after setOff should be false");
  toggle.setOn();
  console.assert(toggle.isOn === true, "Ex1: after setOn should be true");
  toggle.setOn(); // idempotent
  console.assert(toggle.isOn === true, "Ex1: setOn is idempotent");

  // Exercise 2 — localStorage simulation
  const store = new Map<string, string>();
  const [value, set] = simulateLocalStorage("theme", "light", store);
  console.assert(value === "light", "Ex2: initial value should be 'light'");
  set("dark");
  const [value2] = simulateLocalStorage("theme", "light", store);
  console.assert(value2 === "dark", "Ex2: stored value should be 'dark' after set");

  // Exercise 3 — async state
  const success = await simulateAsync(() => Promise.resolve({ name: "Charlie" }));
  console.assert(success.data?.name === "Charlie", "Ex3: should have data on success");
  console.assert(success.error === null,            "Ex3: error should be null on success");
  console.assert(success.isLoading === false,       "Ex3: isLoading false after resolve");

  const failure = await simulateAsync<string>(() => Promise.reject(new Error("404")));
  console.assert(failure.data === null,             "Ex3: data should be null on error");
  console.assert(failure.error?.message === "404",  "Ex3: error message should be '404'");

  // Exercise 4 — memoize
  let callCount = 0;
  const add = memoize((a: number, b: number) => { callCount++; return a + b; });
  const r1 = add(1, 2);
  const r2 = add(1, 2); // same args — should be cached
  const r3 = add(2, 3); // different args — new call
  console.assert(r1 === 3,       "Ex4: 1+2 should be 3");
  console.assert(r2 === 3,       "Ex4: cached 1+2 should be 3");
  console.assert(r3 === 5,       "Ex4: 2+3 should be 5");
  console.assert(callCount === 2, "Ex4: fn should be called twice (cache hit on second call)");

  // Exercise 5 — pagination
  const pager = simulatePagination(25, 10);
  console.assert(pager.page === 1,         "Ex5: starts at page 1");
  console.assert(pager.totalPages === 3,   "Ex5: 25 items at 10/page = 3 pages");
  console.assert(pager.hasNext === true,   "Ex5: should have next on page 1");
  console.assert(pager.hasPrev === false,  "Ex5: no prev on page 1");

  pager.goNext();
  console.assert(pager.page === 2,         "Ex5: page 2 after goNext");
  console.assert(pager.hasPrev === true,   "Ex5: has prev on page 2");

  pager.goTo(3);
  console.assert(pager.page === 3,         "Ex5: page 3 after goTo(3)");
  console.assert(pager.hasNext === false,  "Ex5: no next on last page");

  pager.goPrev();
  console.assert(pager.page === 2,         "Ex5: back to page 2 after goPrev");

  console.log("Chapter 7 verification complete ✓");
}

verify().catch(console.error);
