/**
 * Chapter 5 — Context & Providers
 *
 * Type-check: npx tsc --noEmit --strict exercises/chapter_05.tsx
 * Run:        tsx exercises/chapter_05.tsx
 *
 * These exercises build the typed context values and helper functions
 * that DevLink uses for auth, theme, and toast management.
 */

// =============================================================================
// EXERCISE 1 — Auth context value type
// =============================================================================
// TODO: Define interface `User` with:
//   - id:       string
//   - name:     string
//   - email:    string
//   - username: string
//   - role:     "admin" | "viewer"

interface User {
  // TODO
}

// TODO: Define interface `AuthContextValue` with:
//   - user:        User | null
//   - isLoading:   boolean
//   - isAuthenticated: boolean  (computed from user !== null)
//   - login:       (email: string, password: string) => Promise<void>
//   - logout:      () => void
//   - refreshUser: () => Promise<void>

interface AuthContextValue {
  // TODO
}

// =============================================================================
// EXERCISE 2 — Theme context value type
// =============================================================================
// TODO: Define type `Theme` as "light" | "dark" | "system"
// TODO: Define type `ResolvedTheme` as "light" | "dark"  (no "system")
// TODO: Define interface `ThemeContextValue` with:
//   - theme:         Theme
//   - resolvedTheme: ResolvedTheme
//   - setTheme:      (theme: Theme) => void

type Theme = never; // replace
type ResolvedTheme = never; // replace

interface ThemeContextValue {
  // TODO
}

// =============================================================================
// EXERCISE 3 — Toast context value type
// =============================================================================
// TODO: Define type `ToastVariant` as "success" | "error" | "warning" | "info"
// TODO: Define interface `Toast` with:
//   - id:       string
//   - message:  string
//   - variant:  ToastVariant
//   - duration?: number (ms, optional)
// TODO: Define interface `ToastContextValue` with:
//   - toasts:     Toast[]
//   - addToast:   (message: string, variant: ToastVariant, duration?: number) => void
//   - removeToast: (id: string) => void
//   - clearAll:   () => void

type ToastVariant = never; // replace

interface Toast {
  // TODO
}

interface ToastContextValue {
  // TODO
}

// =============================================================================
// EXERCISE 4 — Context guard function pattern
// =============================================================================
// TODO: Implement a generic function `createContextGuard` that:
//   - Takes a context name string (e.g. "AuthContext")
//   - Returns a function that takes `T | undefined` and returns `T`
//   - The returned function throws an Error if the value is undefined,
//     with the message: "use<ContextName> must be used inside <ContextNameProvider>"
//   This is the pattern used by useAuth(), useTheme(), useToast()

function createContextGuard<T>(contextName: string): (value: T | undefined) => T {
  // TODO
  return (value) => value as T;
}

// =============================================================================
// EXERCISE 5 — Toast reducer
// =============================================================================
// TODO: Define discriminated union `ToastAction`:
//   - { type: "add";    payload: Omit<Toast, "id"> }
//   - { type: "remove"; id: string }
//   - { type: "clear" }

type ToastAction = never; // replace

// TODO: Implement `toastReducer(state: Toast[], action: ToastAction): Toast[]`
//   - "add": append a new toast with a generated id (use a counter or "id-" + Date.now())
//   - "remove": filter out the toast with the matching id
//   - "clear": return []

let toastIdCounter = 0;

function toastReducer(state: Toast[], action: ToastAction): Toast[] {
  // TODO
  return state;
}

// =============================================================================
// EXERCISE 6 — Resolve theme
// =============================================================================
// TODO: Implement `resolveTheme` that takes a `Theme` and a `prefersDark: boolean`
//       and returns a `ResolvedTheme`:
//   - "light" → "light"
//   - "dark"  → "dark"
//   - "system" → depends on prefersDark

function resolveTheme(theme: Theme, prefersDark: boolean): ResolvedTheme {
  // TODO
  return "light";
}

// =============================================================================
// VERIFICATION
// =============================================================================

function verify(): void {
  // Exercise 4 — context guard
  const guardAuth = createContextGuard<AuthContextValue>("Auth");
  let threw = false;
  try { guardAuth(undefined); }
  catch (e) {
    threw = true;
    console.assert(
      e instanceof Error && e.message.includes("AuthProvider"),
      "Ex4: error message should mention AuthProvider"
    );
  }
  console.assert(threw, "Ex4: should throw when value is undefined");

  const mockUser: User = { id: "1", name: "Charlie", email: "c@c.com", username: "charlie", role: "admin" };
  const mockAuth: AuthContextValue = {
    user: mockUser,
    isLoading: false,
    isAuthenticated: true,
    login: async () => {},
    logout: () => {},
    refreshUser: async () => {},
  };
  const result = guardAuth(mockAuth);
  console.assert(result.user?.name === "Charlie", "Ex4: should return value when defined");

  // Exercise 5 — toast reducer
  const t1: Omit<Toast, "id"> = { message: "Saved!", variant: "success" };
  const t2: Omit<Toast, "id"> = { message: "Error occurred", variant: "error" };

  const after1 = toastReducer([], { type: "add", payload: t1 } as ToastAction);
  console.assert(after1.length === 1,             "Ex5: should have 1 toast");
  console.assert(after1[0].message === "Saved!",  "Ex5: message should match");

  const after2 = toastReducer(after1, { type: "add", payload: t2 } as ToastAction);
  console.assert(after2.length === 2, "Ex5: should have 2 toasts");

  const removed = toastReducer(after2, { type: "remove", id: after2[0].id } as ToastAction);
  console.assert(removed.length === 1, "Ex5: should have 1 toast after remove");

  const cleared = toastReducer(after2, { type: "clear" } as ToastAction);
  console.assert(cleared.length === 0, "Ex5: should be empty after clear");

  // Exercise 6 — resolve theme
  console.assert(resolveTheme("light", false)  === "light", "Ex6: light → light");
  console.assert(resolveTheme("light", true)   === "light", "Ex6: light → light (ignores system)");
  console.assert(resolveTheme("dark", false)   === "dark",  "Ex6: dark → dark");
  console.assert(resolveTheme("system", true)  === "dark",  "Ex6: system + dark → dark");
  console.assert(resolveTheme("system", false) === "light", "Ex6: system + light → light");

  console.log("Chapter 5 verification complete ✓");
}

verify();
