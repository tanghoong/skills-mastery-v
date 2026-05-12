/**
 * Chapter 23 — Next.js App Router
 *
 * Type-check: npx tsc --noEmit --strict exercises/chapter_23.tsx
 * Run:        tsx exercises/chapter_23.tsx
 *
 * These exercises model Next.js App Router types (params, searchParams,
 * Server Actions, Metadata) without needing Next.js installed.
 */

import { z } from "zod";

// =============================================================================
// EXERCISE 1 — Page params types
// =============================================================================
// In Next.js 15, params and searchParams are Promises.
// TODO: Define these page props interfaces:
//
//   A) `ProfilePageProps`:
//      - params:       Promise<{ username: string }>
//      - searchParams: Promise<{ tab?: string }>
//
//   B) `ProjectEditorPageProps`:
//      - params:       Promise<{ id: string }>
//
//   C) `AdminPageProps`:
//      - params:       Promise<{}>
//      - searchParams: Promise<{ page?: string; q?: string; sort?: string }>

interface ProfilePageProps {
  // TODO
}

interface ProjectEditorPageProps {
  // TODO
}

interface AdminPageProps {
  // TODO
}

// =============================================================================
// EXERCISE 2 — Search params parsing
// =============================================================================
// TODO: Implement `parseAdminSearchParams(raw: { page?: string; q?: string; sort?: string })`:
//   Returns { page: number; q: string; sort: "newest" | "oldest" | "title" }
//   - page: parse to number, default 1, min 1
//   - q: string, default ""
//   - sort: one of the enum values, default "newest"

interface AdminSearchParams {
  page: number;
  q:    string;
  sort: "newest" | "oldest" | "title";
}

function parseAdminSearchParams(
  raw: { page?: string; q?: string; sort?: string }
): AdminSearchParams {
  // TODO
  return { page: 1, q: "", sort: "newest" };
}

// =============================================================================
// EXERCISE 3 — Server Action result types
// =============================================================================
// TODO: Define `ServerActionResult<T = void>` as a discriminated union:
//   - { ok: true;  data: T }
//   - { ok: false; error: string; fieldErrors?: Record<string, string> }
//
// TODO: Define `UpdateProfileInput` using z.infer from a schema:

const updateProfileInputSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  bio:  z.string().max(500),
});

type UpdateProfileInput = z.infer<typeof updateProfileInputSchema>;

type ServerActionResult<T = void> = never; // replace

// TODO: Implement `simulateUpdateProfileAction(userId: string, input: UpdateProfileInput): Promise<ServerActionResult<{ name: string; bio: string }>>`
//   - Validate input with updateProfileInputSchema
//   - If invalid: return { ok: false, error: "Validation failed", fieldErrors: {...} }
//   - If valid:   return { ok: true, data: input }  (simulate DB update)

async function simulateUpdateProfileAction(
  userId: string,
  input: UpdateProfileInput
): Promise<ServerActionResult<UpdateProfileInput>> {
  // TODO
  return { ok: false, error: "Not implemented" } as ServerActionResult<UpdateProfileInput>;
}

// =============================================================================
// EXERCISE 4 — Metadata types
// =============================================================================
// TODO: Define `PageMetadata` interface matching Next.js Metadata shape:
//   - title:        string | { default?: string; template?: string; absolute?: string }
//   - description?: string
//   - openGraph?:   { title?: string; description?: string; images?: string[] }
//   - robots?:      { index?: boolean; follow?: boolean }
//
// TODO: Implement `buildProfileMetadata(name: string, bio: string, avatarUrl: string | null): PageMetadata`

interface PageMetadata {
  // TODO
}

function buildProfileMetadata(
  name: string,
  bio: string,
  avatarUrl: string | null
): PageMetadata {
  // TODO
  return {} as PageMetadata;
}

// =============================================================================
// EXERCISE 5 — Cache + revalidate helpers
// =============================================================================
// TODO: Define `CacheTag` type as: `profile:${string}` | `projects:${string}` | `links:${string}`
//       Use template literal types.
//
// TODO: Implement `buildCacheTag(entity: "profile" | "projects" | "links", id: string): CacheTag`

type CacheTag = `profile:${string}` | `projects:${string}` | `links:${string}`;

function buildCacheTag(entity: "profile" | "projects" | "links", id: string): CacheTag {
  // TODO
  return `profile:${id}`;
}

// =============================================================================
// VERIFICATION
// =============================================================================

async function verify(): Promise<void> {
  // Exercise 2 — parseAdminSearchParams
  const defaults = parseAdminSearchParams({});
  console.assert(defaults.page === 1,       "Ex2: default page is 1");
  console.assert(defaults.q    === "",      "Ex2: default q is ''");
  console.assert(defaults.sort === "newest","Ex2: default sort is newest");

  const custom = parseAdminSearchParams({ page: "3", q: "react", sort: "title" });
  console.assert(custom.page === 3,       "Ex2: page parsed to number");
  console.assert(custom.q   === "react",  "Ex2: q preserved");
  console.assert(custom.sort === "title", "Ex2: sort set to title");

  const invalidPage = parseAdminSearchParams({ page: "abc", q: "" });
  console.assert(invalidPage.page === 1,  "Ex2: invalid page falls back to 1");

  const invalidSort = parseAdminSearchParams({ sort: "random" });
  console.assert(invalidSort.sort === "newest", "Ex2: invalid sort falls back to newest");

  // Exercise 3 — Server Action simulation
  const validResult = await simulateUpdateProfileAction("user-1", { name: "Charlie", bio: "Dev" });
  console.assert(validResult.ok === true, "Ex3: valid input → success");
  if (validResult.ok) {
    console.assert(validResult.data.name === "Charlie", "Ex3: data.name preserved");
  }

  const invalidResult = await simulateUpdateProfileAction("user-1", { name: "", bio: "" });
  console.assert(invalidResult.ok === false, "Ex3: empty name → failure");
  if (!invalidResult.ok) {
    console.assert("name" in (invalidResult.fieldErrors ?? {}), "Ex3: name in fieldErrors");
  }

  // Exercise 4 — metadata
  const meta = buildProfileMetadata("Charlie Tang", "TypeScript dev", "/avatar.jpg");
  console.assert(typeof meta.title !== "undefined",    "Ex4: title should be set");
  console.assert(meta.description !== undefined,       "Ex4: description should be set");
  console.assert(meta.openGraph !== undefined,         "Ex4: openGraph should be set");
  console.assert(meta.openGraph?.images?.[0] === "/avatar.jpg", "Ex4: avatar in OG images");

  const metaNoAvatar = buildProfileMetadata("Charlie", "Dev", null);
  console.assert((metaNoAvatar.openGraph?.images?.length ?? 0) === 0, "Ex4: no images when no avatar");

  // Exercise 5 — cache tags
  const profileTag  = buildCacheTag("profile",  "user-1");
  const projectsTag = buildCacheTag("projects", "user-1");
  const linksTag    = buildCacheTag("links",    "user-1");

  console.assert(profileTag  === "profile:user-1",  "Ex5: profile cache tag");
  console.assert(projectsTag === "projects:user-1", "Ex5: projects cache tag");
  console.assert(linksTag    === "links:user-1",    "Ex5: links cache tag");

  console.log("Chapter 23 verification complete ✓");
}

verify().catch(console.error);
