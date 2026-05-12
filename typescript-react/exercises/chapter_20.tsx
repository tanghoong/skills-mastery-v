/**
 * Chapter 20 — Testing React
 *
 * Type-check: npx tsc --noEmit --strict exercises/chapter_20.tsx
 * Run:        tsx exercises/chapter_20.tsx
 *
 * These exercises build the typed testing utilities and mock patterns
 * used in DevLink's test suite.
 */

// =============================================================================
// EXERCISE 1 — Mock function types
// =============================================================================
// In Vitest, vi.fn<Args, Return>() creates a typed mock.
// TODO: Write the correct TypeScript type annotations for these mock declarations.
//       Replace `unknown` with the correct generic arguments.

// A) A mock for (email: string, password: string) => Promise<void>
//    type MockLogin = vi.Mock<unknown, unknown>;
//    Answer: vi.Mock<[email: string, password: string], Promise<void>>

// B) A mock for (id: string) => void
//    type MockDelete = vi.Mock<unknown, unknown>;
//    Answer: ???

// C) A mock for (data: ProjectFormData) => Promise<Project>
//    type MockCreate = vi.Mock<unknown, unknown>;
//    Answer: ???

interface ProjectFormData { title: string; description: string; tags: string[] }
interface Project         { id: string; title: string; description: string; tags: string[]; featured: boolean }

// Write answers as type aliases (not vi.Mock — just the function type):
type MockLoginFn  = (email: string, password: string) => Promise<void>;
type MockDeleteFn = never; // replace: (id: string) => void
type MockCreateFn = never; // replace: (data: ProjectFormData) => Promise<Project>

// =============================================================================
// EXERCISE 2 — Test data factories
// =============================================================================
// TODO: Implement `createTestProject(overrides?: Partial<Project>): Project`
//   Default values:
//   - id: "test-1", title: "Test Project", description: "A test project"
//   - tags: [], featured: false
//   Overrides should be spread on top of defaults.

function createTestProject(overrides?: Partial<Project>): Project {
  // TODO
  return {} as Project;
}

// TODO: Implement `createTestProjects(count: number): Project[]`
//   Returns an array of `count` projects with unique ids ("test-1", "test-2", ...)
//   and titles ("Project 1", "Project 2", ...)

function createTestProjects(count: number): Project[] {
  // TODO
  return [];
}

// =============================================================================
// EXERCISE 3 — Typed query simulation
// =============================================================================
// Testing Library's `screen.getByRole<T>` returns the element narrowed to T.
// Simulate this narrowing:
//
// TODO: Define `QueryResult<T extends HTMLElement>` as:
//   - { found: true;  element: T }
//   - { found: false; message: string }
//
// TODO: Implement `getByTestId<T extends HTMLElement>(container: Record<string, HTMLElement>, id: string): QueryResult<T>`
//   Returns found result if key exists in container, otherwise not found.

type QueryResult<T extends HTMLElement> = never; // replace

function getByTestId<T extends HTMLElement>(
  container: Record<string, HTMLElement>,
  id: string
): QueryResult<T> {
  // TODO
  return { found: false, message: `[data-testid="${id}"] not found` } as QueryResult<T>;
}

// =============================================================================
// EXERCISE 4 — Assert helpers
// =============================================================================
// TODO: Implement `assertCallCount(fn: { mock?: { calls: unknown[][] } }, count: number): void`
//   Throws an AssertionError if fn wasn't called exactly `count` times.
//   Works with any object that has a .mock.calls array (Vitest mock shape).
//
// TODO: Implement `assertCalledWith<T extends unknown[]>(fn: { mock?: { calls: T[] } }, ...args: T): void`
//   Throws if fn was never called with those exact arguments.

function assertCallCount(fn: { mock?: { calls: unknown[][] } }, count: number): void {
  const actual = fn.mock?.calls.length ?? 0;
  if (actual !== count) {
    throw new Error(`Expected ${count} call(s), got ${actual}`);
  }
}

function assertCalledWith<T extends unknown[]>(
  fn: { mock?: { calls: T[] } },
  ...args: T
): void {
  const calls = fn.mock?.calls ?? [];
  const found = calls.some((call) =>
    JSON.stringify(call) === JSON.stringify(args)
  );
  if (!found) {
    throw new Error(`Expected call with args: ${JSON.stringify(args)}`);
  }
}

// =============================================================================
// EXERCISE 5 — Mock API layer
// =============================================================================
// TODO: Define `MockApiLayer` with typed mock functions for:
//   - getProjects:   (userId: string) => Promise<Project[]>
//   - createProject: (data: ProjectFormData) => Promise<Project>
//   - deleteProject: (id: string) => Promise<void>
//
// TODO: Implement `createMockApi(projects: Project[] = []): MockApiLayer`
//   - getProjects:   returns all projects matching userId (use first project's id as userId stub)
//   - createProject: creates a new project with a generated id, adds to internal list
//   - deleteProject: removes the project from the internal list

interface MockApiLayer {
  getProjects:   (userId: string) => Promise<Project[]>;
  createProject: (data: ProjectFormData) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
  _projects:     Project[];  // for inspection in tests
}

function createMockApi(initialProjects: Project[] = []): MockApiLayer {
  // TODO
  return {
    _projects: [],
    getProjects: async () => [],
    createProject: async () => ({} as Project),
    deleteProject: async () => {},
  };
}

// =============================================================================
// VERIFICATION
// =============================================================================

async function verify(): Promise<void> {
  // Exercise 2 — test factories
  const p1 = createTestProject();
  console.assert(p1.id === "test-1",           "Ex2: default id");
  console.assert(p1.title === "Test Project",  "Ex2: default title");
  console.assert(p1.featured === false,         "Ex2: default featured");

  const p2 = createTestProject({ title: "Custom", featured: true });
  console.assert(p2.title === "Custom",  "Ex2: override title");
  console.assert(p2.featured === true,   "Ex2: override featured");
  console.assert(p2.id === "test-1",     "Ex2: unoverridden id stays default");

  const bulk = createTestProjects(3);
  console.assert(bulk.length === 3,           "Ex2: 3 projects created");
  console.assert(bulk[0].id === "test-1",     "Ex2: first id is test-1");
  console.assert(bulk[2].id === "test-3",     "Ex2: third id is test-3");
  console.assert(bulk[1].title === "Project 2", "Ex2: second title is 'Project 2'");

  // Exercise 3 — typed queries
  const container: Record<string, HTMLElement> = {
    "save-button": document.createElement("button"),
    "title-input": document.createElement("input"),
  };

  const btn = getByTestId<HTMLButtonElement>(container, "save-button");
  console.assert(btn.found === true, "Ex3: found element");

  const missing = getByTestId<HTMLInputElement>(container, "missing-id");
  console.assert(missing.found === false, "Ex3: not found returns false");
  if (!missing.found) console.assert(missing.message.includes("missing-id"), "Ex3: message mentions id");

  // Exercise 4 — assert helpers
  const mockFn = { mock: { calls: [["arg1"], ["arg2", "arg3"]] as unknown[][] } };
  assertCallCount(mockFn, 2); // should not throw

  let threw = false;
  try { assertCallCount(mockFn, 5); } catch { threw = true; }
  console.assert(threw, "Ex4: wrong count should throw");

  // Exercise 5 — mock API
  const api = createMockApi([
    { id: "1", title: "DevLink", description: "", tags: [], featured: false },
  ]);

  const projects = await api.getProjects("any-user");
  console.assert(projects.length === 1, "Ex5: initial projects loaded");

  const newProject = await api.createProject({ title: "New", description: "", tags: [] });
  console.assert(typeof newProject.id === "string",    "Ex5: createProject returns project with id");
  console.assert(newProject.title === "New",           "Ex5: title is preserved");
  console.assert(api._projects.length === 2,          "Ex5: project added to internal list");

  await api.deleteProject(newProject.id);
  console.assert(api._projects.length === 1, "Ex5: project removed after delete");

  console.log("Chapter 20 verification complete ✓");
}

verify().catch(console.error);
