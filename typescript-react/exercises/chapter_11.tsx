/**
 * Chapter 11 — State Management with Zustand
 *
 * Type-check: npx tsc --noEmit --strict exercises/chapter_11.tsx
 * Run:        tsx exercises/chapter_11.tsx
 *
 * These exercises implement Zustand store logic (without the React bindings)
 * to practice typing state, actions, and selectors.
 */

// =============================================================================
// EXERCISE 1 — Auth store state and actions
// =============================================================================
// TODO: Define interface `User` with: id, name, email, role: "admin" | "viewer"
// TODO: Define interface `AuthState` with:
//   - user:            User | null
//   - token:           string | null
//   - isAuthenticated: boolean
// TODO: Define interface `AuthActions` with:
//   - setUser:   (user: User, token: string) => void
//   - clearAuth: () => void
// TODO: Define type `AuthStore = AuthState & AuthActions`

interface User {
  // TODO
}

interface AuthState {
  // TODO
}

interface AuthActions {
  // TODO
}

type AuthStore = AuthState & AuthActions;

// =============================================================================
// EXERCISE 2 — Simulate a Zustand store
// =============================================================================
// Without React, simulate how Zustand works: a state object + set function.
// TODO: Implement `createAuthStore()` that returns an `AuthStore` object where:
//   - Initial state: user: null, token: null, isAuthenticated: false
//   - setUser: updates all three fields
//   - clearAuth: resets all three fields

function createAuthStore(): AuthStore {
  // TODO: use a mutable `let state` and closures to implement set/get
  return {} as AuthStore;
}

// =============================================================================
// EXERCISE 3 — Projects slice state
// =============================================================================
// TODO: Define interface `Project` with: id, title, featured, order: number
// TODO: Define interface `ProjectsState` with:
//   - projects:         Project[]
//   - selectedId:       string | null
//   - filterFeatured:   boolean
// TODO: Define interface `ProjectsActions` with:
//   - setProjects:      (projects: Project[]) => void
//   - selectProject:    (id: string | null) => void
//   - toggleFeatured:   (id: string) => void
//   - setFilter:        (featured: boolean) => void
//   - getVisible:       () => Project[]   (derived — returns filtered projects)

interface Project {
  // TODO
}

interface ProjectsState {
  // TODO
}

interface ProjectsActions {
  // TODO
}

type ProjectsStore = ProjectsState & ProjectsActions;

// TODO: Implement `createProjectsStore(): ProjectsStore`

function createProjectsStore(): ProjectsStore {
  // TODO
  return {} as ProjectsStore;
}

// =============================================================================
// EXERCISE 4 — Selector typing
// =============================================================================
// Zustand selectors take the full state and return a slice.
// TODO: Implement these typed selector functions for the auth store:

// Returns true only when user is authenticated AND has the given role
function selectHasRole(store: AuthStore, role: User["role"]): boolean {
  // TODO
  return false;
}

// Returns the user's display name, or "Guest" if not authenticated
function selectDisplayName(store: AuthStore): string {
  // TODO
  return "Guest";
}

// =============================================================================
// EXERCISE 5 — UI store slice
// =============================================================================
// TODO: Define `UIState` with:
//   - sidebarOpen:    boolean
//   - activeSection:  "profile" | "projects" | "links" | "settings" | null
//   - theme:          "light" | "dark" | "system"
// TODO: Define `UIActions` with:
//   - toggleSidebar:    () => void
//   - closeSidebar:     () => void
//   - setActiveSection: (section: UIState["activeSection"]) => void
//   - setTheme:         (theme: UIState["theme"]) => void
// TODO: Implement `createUIStore(): UIState & UIActions`

interface UIState {
  // TODO
}

interface UIActions {
  // TODO
}

function createUIStore(): UIState & UIActions {
  // TODO
  return {} as UIState & UIActions;
}

// =============================================================================
// VERIFICATION
// =============================================================================

function verify(): void {
  // Exercise 2 — auth store
  const auth = createAuthStore();
  console.assert(auth.user === null,             "Ex2: initial user should be null");
  console.assert(auth.isAuthenticated === false, "Ex2: initial isAuthenticated should be false");

  const user: User = { id: "1", name: "Charlie", email: "c@c.com", role: "admin" };
  auth.setUser(user, "token-abc");
  console.assert(auth.user?.name === "Charlie",  "Ex2: user should be set");
  console.assert(auth.token === "token-abc",     "Ex2: token should be set");
  console.assert(auth.isAuthenticated === true,  "Ex2: isAuthenticated should be true");

  auth.clearAuth();
  console.assert(auth.user === null,             "Ex2: user should be null after clearAuth");
  console.assert(auth.isAuthenticated === false, "Ex2: isAuthenticated false after clearAuth");

  // Exercise 3 — projects store
  const projects = createProjectsStore();
  const p1: Project = { id: "1", title: "DevLink", featured: true, order: 0 };
  const p2: Project = { id: "2", title: "Portfolio", featured: false, order: 1 };

  projects.setProjects([p1, p2]);
  console.assert(projects.projects.length === 2, "Ex3: should have 2 projects");

  projects.setFilter(true);
  const visible = projects.getVisible();
  console.assert(visible.length === 1, "Ex3: filter featured=true should show 1");
  console.assert(visible[0].id === "1", "Ex3: featured project should be DevLink");

  projects.setFilter(false);
  console.assert(projects.getVisible().length === 2, "Ex3: no filter shows all");

  projects.toggleFeatured("2");
  const afterToggle = projects.projects.find(p => p.id === "2");
  console.assert(afterToggle?.featured === true, "Ex3: portfolio should be featured after toggle");

  projects.selectProject("1");
  console.assert(projects.selectedId === "1", "Ex3: selected should be '1'");

  // Exercise 4 — selectors
  const authStore = createAuthStore();
  authStore.setUser({ id: "1", name: "Charlie", email: "c@c.com", role: "admin" }, "t");

  console.assert(selectHasRole(authStore, "admin")  === true,  "Ex4: admin has admin role");
  console.assert(selectHasRole(authStore, "viewer") === false, "Ex4: admin doesn't have viewer role");
  console.assert(selectDisplayName(authStore) === "Charlie",   "Ex4: display name is user's name");

  authStore.clearAuth();
  console.assert(selectDisplayName(authStore) === "Guest", "Ex4: guest display name");

  // Exercise 5 — UI store
  const ui = createUIStore();
  console.assert(ui.sidebarOpen === false, "Ex5: sidebar starts closed");
  ui.toggleSidebar();
  console.assert(ui.sidebarOpen === true, "Ex5: sidebar opens after toggle");
  ui.closeSidebar();
  console.assert(ui.sidebarOpen === false, "Ex5: sidebar closes");

  ui.setActiveSection("projects");
  console.assert(ui.activeSection === "projects", "Ex5: active section set");

  ui.setTheme("dark");
  console.assert(ui.theme === "dark", "Ex5: theme set to dark");

  console.log("Chapter 11 verification complete ✓");
}

verify();
