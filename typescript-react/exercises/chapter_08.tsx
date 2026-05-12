/**
 * Chapter 8 — Data Fetching with TanStack Query
 *
 * Type-check: npx tsc --noEmit --strict exercises/chapter_08.tsx
 * Run:        tsx exercises/chapter_08.tsx
 *
 * These exercises build the typed API layer and query key structure
 * that DevLink uses for all data fetching. No actual HTTP calls — focus on types.
 */

// =============================================================================
// EXERCISE 1 — Core data models
// =============================================================================
// TODO: Define interface `Profile` with:
//   - id:        string
//   - username:  string
//   - name:      string
//   - bio:       string
//   - avatarUrl: string | null
//   - location:  string | null
//   - createdAt: Date

interface Profile {
  // TODO
}

// TODO: Define interface `Project` with:
//   - id:          string
//   - userId:      string
//   - title:       string
//   - description: string
//   - url:         string | null
//   - repoUrl:     string | null
//   - tags:        string[]
//   - featured:    boolean
//   - order:       number

interface Project {
  // TODO
}

// TODO: Define interface `SocialLink` with:
//   - id:       string
//   - userId:   string
//   - platform: "github" | "twitter" | "linkedin" | "youtube" | "website" | "other"
//   - url:      string
//   - label:    string
//   - order:    number

interface SocialLink {
  // TODO
}

// =============================================================================
// EXERCISE 2 — Query keys
// =============================================================================
// TODO: Define a `queryKeys` object with typed factory functions:
//   - profile:  (username: string) => readonly ["profile", string]
//   - projects: (userId: string)   => readonly ["projects", string]
//   - project:  (id: string)       => readonly ["project", string]
//   - links:    (userId: string)   => readonly ["links", string]
//   All return `as const` tuples so the type is narrow.

export const queryKeys = {
  profile:  // TODO: (username: string) => ...
  projects: // TODO: (userId: string)   => ...
  project:  // TODO: (id: string)       => ...
  links:    // TODO: (userId: string)   => ...
} as const; // remove this if it conflicts — just make the functions return as const

// =============================================================================
// EXERCISE 3 — Typed API fetch function
// =============================================================================
// TODO: Implement `apiFetch<T>` that:
//   - Takes `path: string` and optional `options: RequestInit`
//   - Makes a fetch call to `BASE_URL + path`
//   - Throws an `ApiError` if the response is not ok
//   - Returns `Promise<T>` (cast from res.json())

class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const BASE_URL = "https://api.devlink.app";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  // TODO
  return {} as T;
}

// =============================================================================
// EXERCISE 4 — Typed api object
// =============================================================================
// TODO: Implement the `api` object with these typed methods:
//   - getProfile:      (username: string) => Promise<Profile>
//   - getProjects:     (userId: string)   => Promise<Project[]>
//   - createProject:   (data: CreateProjectInput) => Promise<Project>
//   - updateProject:   (id: string, data: Partial<CreateProjectInput>) => Promise<Project>
//   - deleteProject:   (id: string) => Promise<void>
//   - getLinks:        (userId: string)   => Promise<SocialLink[]>

interface CreateProjectInput {
  title:       string;
  description: string;
  url?:        string;
  repoUrl?:    string;
  tags:        string[];
  featured?:   boolean;
}

export const api = {
  getProfile: // TODO
  getProjects: // TODO
  createProject: // TODO
  updateProject: // TODO
  deleteProject: // TODO
  getLinks: // TODO
};

// =============================================================================
// EXERCISE 5 — Loading state discrimination
// =============================================================================
// TODO: Define a generic `QueryState<T>` discriminated union:
//   - { status: "pending" }
//   - { status: "error";   error: Error }
//   - { status: "success"; data: T }
//
// TODO: Implement `getDisplayData<T>` that takes a `QueryState<T>` and returns:
//   - if pending: null
//   - if error:   null  (caller handles error separately)
//   - if success: data  (typed as T)

type QueryState<T> = never; // replace with discriminated union

function getDisplayData<T>(state: QueryState<T>): T | null {
  // TODO: use a switch or if-chain to narrow the type
  return null;
}

// =============================================================================
// EXERCISE 6 — Optimistic update helper
// =============================================================================
// TODO: Implement `applyOptimisticDelete<T extends { id: string }>` that:
//   - Takes `items: T[]` and `id: string`
//   - Returns a new array with the item removed
//   This simulates the optimistic update logic in useMutation's onMutate

function applyOptimisticDelete<T extends { id: string }>(items: T[], id: string): T[] {
  // TODO
  return items;
}

// =============================================================================
// VERIFICATION
// =============================================================================

async function verify(): Promise<void> {
  // Exercise 2 — queryKeys
  const profileKey = queryKeys.profile("charlie");
  console.assert(profileKey[0] === "profile",  "Ex2: first element should be 'profile'");
  console.assert(profileKey[1] === "charlie",  "Ex2: second element should be 'charlie'");

  const projectsKey = queryKeys.projects("user-1");
  console.assert(projectsKey[0] === "projects", "Ex2: first element should be 'projects'");

  // Exercise 5 — QueryState
  const pending: QueryState<Profile> = { status: "pending" };
  const error:   QueryState<Profile> = { status: "error", error: new Error("Not found") };
  const success: QueryState<Profile> = {
    status: "success",
    data: { id: "1", username: "charlie", name: "Charlie", bio: "", avatarUrl: null, location: null, createdAt: new Date() }
  };

  console.assert(getDisplayData(pending) === null,                 "Ex5: pending → null");
  console.assert(getDisplayData(error) === null,                   "Ex5: error → null");
  console.assert(getDisplayData(success)?.name === "Charlie",      "Ex5: success → Profile");

  // Exercise 6 — optimistic delete
  const projects: Project[] = [
    { id: "1", userId: "u1", title: "A", description: "", url: null, repoUrl: null, tags: [], featured: false, order: 0 },
    { id: "2", userId: "u1", title: "B", description: "", url: null, repoUrl: null, tags: [], featured: false, order: 1 },
    { id: "3", userId: "u1", title: "C", description: "", url: null, repoUrl: null, tags: [], featured: false, order: 2 },
  ];

  const after = applyOptimisticDelete(projects, "2");
  console.assert(after.length === 2,       "Ex6: should have 2 items after delete");
  console.assert(!after.find(p => p.id === "2"), "Ex6: project 2 should be removed");
  console.assert(after[0].id === "1",      "Ex6: project 1 should remain");
  console.assert(after[1].id === "3",      "Ex6: project 3 should remain");

  console.log("Chapter 8 verification complete ✓");
}

verify().catch(console.error);
