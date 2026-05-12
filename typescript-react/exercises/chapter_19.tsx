/**
 * Chapter 19 — Performance Typing
 *
 * Type-check: npx tsc --noEmit --strict exercises/chapter_19.tsx
 * Run:        tsx exercises/chapter_19.tsx
 */

// =============================================================================
// EXERCISE 1 — Identify memo-breaking patterns
// =============================================================================
// For each component props example, answer: will React.memo help? Why/why not?
// Write your answers as comments.

// A) Parent creates handler inline:
//    const Parent = () => <Child onDelete={() => api.delete(id)} />
//    Will memo on Child help? Answer: ???

// B) Parent passes primitive props:
//    const Parent = ({ userId }) => <Child userId={userId} isAdmin={true} />
//    Will memo on Child help? Answer: ???

// C) Parent passes an object literal:
//    const Parent = () => <Child config={{ pageSize: 10, sortable: true }} />
//    Will memo on Child help? Answer: ???

// D) Parent passes a useCallback-wrapped handler:
//    const handleEdit = useCallback((id: string) => ..., []);
//    const Parent = () => <Child onEdit={handleEdit} />
//    Will memo on Child help? Answer: ???

// =============================================================================
// EXERCISE 2 — Memoized computation
// =============================================================================
// Implement these as pure functions (not hooks) to practice the logic
// that useMemo would cache.

interface Project {
  id: string;
  title: string;
  tags: string[];
  featured: boolean;
  order: number;
}

// TODO: Implement `filterProjects` that:
//   - Takes `projects: Project[]` and `query: string`
//   - Returns projects whose title contains query (case-insensitive)
//     OR whose tags contain query (case-insensitive)
//   - An empty query returns all projects

function filterProjects(projects: Project[], query: string): Project[] {
  // TODO
  return projects;
}

// TODO: Implement `sortProjects` that:
//   - Takes `projects: Project[]` and `sortKey: "title" | "order" | "featured"`
//   - "title":    alphabetical ascending
//   - "order":    numeric ascending
//   - "featured": featured first, then by order
//   - Returns a new sorted array

function sortProjects(projects: Project[], sortKey: "title" | "order" | "featured"): Project[] {
  // TODO
  return [...projects];
}

// TODO: Implement `groupByFirstTag` that:
//   - Groups projects by their first tag (or "untagged" if no tags)
//   - Returns a Map<string, Project[]>

function groupByFirstTag(projects: Project[]): Map<string, Project[]> {
  // TODO
  return new Map();
}

// =============================================================================
// EXERCISE 3 — Stable reference simulation
// =============================================================================
// useCallback prevents function recreation on every render.
// Implement `stableCallback` to simulate this behaviour:
//
// TODO: `stableCallback<T extends (...args: unknown[]) => unknown>(fn: T): T`
//   Returns the same reference on subsequent calls with the same `fn`.
//   Use a WeakMap keyed by the input fn.
//   (This simulates useCallback with a stable deps array)

function stableCallback<T extends (...args: unknown[]) => unknown>(fn: T): T {
  // TODO: use a WeakMap
  return fn;
}

// =============================================================================
// EXERCISE 4 — Profiler callback type
// =============================================================================
// React.Profiler's onRender callback has a specific signature.
// TODO: Define the `ProfilerCallback` type matching React's:
//   Parameters:
//   - id:             string
//   - phase:          "mount" | "update" | "nested-update"
//   - actualDuration: number
//   - baseDuration:   number
//   - startTime:      number
//   - commitTime:     number

type ProfilerCallback = (
  id: string,
  phase: never,  // replace never with the correct type
  actualDuration: number,
  baseDuration: number,
  startTime: number,
  commitTime: number
) => void;

// TODO: Implement `createSlowRenderLogger(threshold: number): ProfilerCallback`
//   Logs a warning when actualDuration > threshold:
//   `console.warn(\`Slow render in "${id}": ${actualDuration.toFixed(1)}ms (${phase})\`)`

function createSlowRenderLogger(threshold: number): ProfilerCallback {
  // TODO
  return () => {};
}

// =============================================================================
// EXERCISE 5 — Lazy import registry
// =============================================================================
// Lazy loading reduces initial bundle size.
// TODO: Define `LazyImport<T>` as a function `() => Promise<{ default: T }>`
//       (matching what React.lazy expects)
//
// TODO: Define `LazyRegistry` as a Record mapping section names to `LazyImport<unknown>`
//
// TODO: Create `adminLazyRegistry` with entries for:
//       "dashboard", "profile", "projects", "links", "settings"
//       Each value should be a function returning a placeholder Promise.

type LazyImport<T> = () => Promise<{ default: T }>;

type LazyRegistry = Record<string, LazyImport<unknown>>;

const adminLazyRegistry: LazyRegistry = {
  // TODO: each value is () => Promise.resolve({ default: {} as unknown })
};

// =============================================================================
// VERIFICATION
// =============================================================================

function verify(): void {
  const projects: Project[] = [
    { id: "1", title: "DevLink",   tags: ["react", "ts"],    featured: true,  order: 0 },
    { id: "2", title: "Portfolio", tags: ["nextjs"],          featured: true,  order: 1 },
    { id: "3", title: "API",       tags: ["node", "express"], featured: false, order: 2 },
    { id: "4", title: "CLI Tool",  tags: [],                  featured: false, order: 3 },
  ];

  // Exercise 2 — filterProjects
  const all = filterProjects(projects, "");
  console.assert(all.length === 4, "Ex2: empty query returns all");

  const byTitle = filterProjects(projects, "dev");
  console.assert(byTitle.length === 1 && byTitle[0].id === "1", "Ex2: filter by title");

  const byTag = filterProjects(projects, "node");
  console.assert(byTag.length === 1 && byTag[0].id === "3", "Ex2: filter by tag");

  // sortProjects
  const byOrder = sortProjects(projects, "order");
  console.assert(byOrder[0].id === "1", "Ex2: sort by order — DevLink first");

  const byTitle2 = sortProjects(projects, "title");
  console.assert(byTitle2[0].title === "API", "Ex2: sort by title — API first");

  const byFeatured = sortProjects(projects, "featured");
  console.assert(byFeatured[0].featured === true,  "Ex2: featured first");
  console.assert(byFeatured[2].featured === false, "Ex2: non-featured after");

  // groupByFirstTag
  const grouped = groupByFirstTag(projects);
  console.assert(grouped.get("react")?.length === 1, "Ex2: react group has 1");
  console.assert(grouped.get("untagged")?.length === 1, "Ex2: untagged group has CLI Tool");

  // Exercise 3 — stableCallback
  const fn1 = (x: number) => x * 2;
  const stable1 = stableCallback(fn1);
  const stable2 = stableCallback(fn1); // same input fn
  console.assert(stable1 === stable2, "Ex3: same fn input → same reference returned");

  // Exercise 4 — slow render logger
  const logger = createSlowRenderLogger(16);
  // Just verify it returns a callable function
  console.assert(typeof logger === "function", "Ex4: should return a function");
  // Call it without throwing
  logger("TestComponent", "mount", 5, 10, 0, 5);   // fast — no warn
  logger("SlowComp", "update", 50, 80, 0, 50);      // slow — warn expected

  // Exercise 5 — lazy registry
  const keys = Object.keys(adminLazyRegistry);
  console.assert(keys.includes("dashboard"), "Ex5: dashboard in registry");
  console.assert(keys.includes("profile"),   "Ex5: profile in registry");
  console.assert(keys.includes("projects"),  "Ex5: projects in registry");
  console.assert(keys.includes("links"),     "Ex5: links in registry");
  console.assert(keys.includes("settings"),  "Ex5: settings in registry");
  console.assert(typeof adminLazyRegistry["dashboard"] === "function", "Ex5: value is a function");

  console.log("Chapter 19 verification complete ✓");
}

verify();
