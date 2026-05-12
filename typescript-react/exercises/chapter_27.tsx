/**
 * Chapter 27 — Capstone: DevLink
 *
 * Type-check: npx tsc --noEmit --strict exercises/chapter_27.tsx
 * Run:        tsx exercises/chapter_27.tsx
 *
 * This is your final integration exercise. Every type in here should come
 * naturally from the patterns practised in chapters 1–26.
 *
 * The exercise builds a typed "DevLink Core" — the shared data model
 * and business logic layer that ties the entire capstone together.
 */

import { z } from "zod";

// =============================================================================
// PART 1 — Complete data model (Branded types)
// =============================================================================
// TODO: Define branded types:
//   - UserId:    string & { readonly __brand: "UserId" }
//   - ProjectId: string & { readonly __brand: "ProjectId" }
//   - LinkId:    string & { readonly __brand: "LinkId" }
// TODO: Implement brand constructors:
//   - asUserId(id: string): UserId
//   - asProjectId(id: string): ProjectId
//   - asLinkId(id: string): LinkId

type UserId    = string & { readonly __brand: "UserId" };
type ProjectId = string & { readonly __brand: "ProjectId" };
type LinkId    = string & { readonly __brand: "LinkId" };

function asUserId(id: string):    UserId    { return id as UserId; }
function asProjectId(id: string): ProjectId { return id as ProjectId; }
function asLinkId(id: string):    LinkId    { return id as LinkId; }

// TODO: Define interface `Profile` using UserId:
//   - id:        UserId
//   - username:  string
//   - name:      string
//   - bio:       string
//   - avatarUrl: string | null
//   - location:  string | null
//   - createdAt: Date

interface Profile {
  // TODO
}

// TODO: Define interface `Project` using branded types:
//   - id:          ProjectId
//   - userId:      UserId
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

// TODO: Define type `SocialPlatform` and interface `SocialLink` using LinkId + UserId

type SocialPlatform = "github" | "twitter" | "linkedin" | "youtube" | "website" | "other";

interface SocialLink {
  // TODO
}

// =============================================================================
// PART 2 — Zod schemas (the source of truth for all input)
// =============================================================================
// TODO: Define these schemas + derive types:
//   - `profileUpdateSchema`: name (min 1, max 100), bio (max 500), location (max 100, optional)
//   - `projectCreateSchema`: title (min 1, max 80), description (max 500), url (optional URL),
//                            tags (array, max 10), featured (boolean, default false)
//   - `linkCreateSchema`:    platform (enum), url (URL), label (min 1, max 50)

export const profileUpdateSchema = z.object({
  // TODO
});

export const projectCreateSchema = z.object({
  // TODO
});

export const linkCreateSchema = z.object({
  // TODO
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type ProjectCreateInput = z.infer<typeof projectCreateSchema>;
export type LinkCreateInput    = z.infer<typeof linkCreateSchema>;

// =============================================================================
// PART 3 — Result<T, E> and business logic
// =============================================================================
// TODO: Define `Result<T, E extends Error = Error>` discriminated union
// TODO: Implement `ok<T>(value: T): Result<T>` and `fail<E extends Error>(e: E): Result<never, E>`

type Result<T, E extends Error = Error> = never; // replace

function ok<T>(value: T): Result<T> { return { ok: true, value } as Result<T>; }
function fail<E extends Error>(e: E): Result<never, E> { return { ok: false, error: e } as Result<never, E>; }

// TODO: Implement `validateAndCreate<T>(schema: z.ZodSchema<T>, raw: unknown): Result<T>`
//   - If schema.safeParse succeeds → ok(data)
//   - If fails → fail(new Error with first field error message)

function validateAndCreate<T>(schema: z.ZodSchema<T>, raw: unknown): Result<T> {
  // TODO
  return fail(new Error("Not implemented")) as Result<T>;
}

// =============================================================================
// PART 4 — In-memory DevLink store (simulating the DB layer)
// =============================================================================
// TODO: Implement `createDevLinkStore()` that returns an object with:
//   - createProfile(input: ProfileUpdateInput & { username: string }): Result<Profile>
//   - getProfile(username: string): Result<Profile>
//   - updateProfile(userId: UserId, input: ProfileUpdateInput): Result<Profile>
//   - createProject(userId: UserId, input: ProjectCreateInput): Result<Project>
//   - getProjects(userId: UserId): Project[]
//   - deleteProject(userId: UserId, projectId: ProjectId): Result<void>
//   - createLink(userId: UserId, input: LinkCreateInput): Result<SocialLink>
//   - getLinks(userId: UserId): SocialLink[]

function createDevLinkStore() {
  const profiles = new Map<string, Profile>();
  const projects = new Map<ProjectId, Project>();
  const links    = new Map<LinkId, SocialLink>();
  let nextId = 1;
  const genId = () => String(nextId++);

  return {
    createProfile(input: ProfileUpdateInput & { username: string }): Result<Profile> {
      // TODO
      return fail(new Error("Not implemented")) as Result<Profile>;
    },
    getProfile(username: string): Result<Profile> {
      // TODO
      return fail(new Error("Not implemented")) as Result<Profile>;
    },
    updateProfile(userId: UserId, input: ProfileUpdateInput): Result<Profile> {
      // TODO
      return fail(new Error("Not implemented")) as Result<Profile>;
    },
    createProject(userId: UserId, input: ProjectCreateInput): Result<Project> {
      // TODO
      return fail(new Error("Not implemented")) as Result<Project>;
    },
    getProjects(userId: UserId): Project[] {
      // TODO
      return [];
    },
    deleteProject(userId: UserId, projectId: ProjectId): Result<void> {
      // TODO
      return fail(new Error("Not implemented")) as Result<void>;
    },
    createLink(userId: UserId, input: LinkCreateInput): Result<SocialLink> {
      // TODO
      return fail(new Error("Not implemented")) as Result<SocialLink>;
    },
    getLinks(userId: UserId): SocialLink[] {
      // TODO
      return [];
    },
  };
}

// =============================================================================
// PART 5 — AI Bio generation types
// =============================================================================
// TODO: Define `AIBioRequest` with:
//   - name:      string
//   - projects:  string[]  (project titles)
//   - links:     SocialPlatform[]
//   - tone?:     "professional" | "casual" | "technical"
//
// TODO: Define `AIBioChunk` (streaming) as:
//   - { type: "delta"; text: string }
//   | { type: "done";  fullText: string }
//
// TODO: Implement `simulateAIBioStream(request: AIBioRequest): AsyncGenerator<AIBioChunk>`
//   Yields 3 delta chunks then a done chunk.
//   Bio format: "Hi, I'm {name}. I build {projects[0]}..."

interface AIBioRequest {
  // TODO
}

type AIBioChunk = never; // replace with discriminated union

async function* simulateAIBioStream(request: AIBioRequest): AsyncGenerator<AIBioChunk> {
  // TODO: yield delta chunks, then done
}

// =============================================================================
// FINAL VERIFICATION
// =============================================================================

async function verify(): Promise<void> {
  const store = createDevLinkStore();

  // Part 3 — validateAndCreate
  const validProject = validateAndCreate(projectCreateSchema, {
    title: "DevLink", description: "Portfolio builder", tags: ["react"], featured: true
  });
  console.assert(validProject.ok === true, "P3: valid project creates ok");

  const invalidProject = validateAndCreate(projectCreateSchema, { title: "", description: "" });
  console.assert(invalidProject.ok === false, "P3: invalid project fails");

  // Part 4 — store operations
  const profileResult = store.createProfile({
    username: "charlie",
    name: "Charlie Tang",
    bio: "TypeScript dev",
  });
  console.assert(profileResult.ok === true, "P4: createProfile succeeds");

  let userId: UserId | null = null;
  if (profileResult.ok) {
    userId = profileResult.value.id;
    console.assert(profileResult.value.username === "charlie", "P4: username set");
  }

  const getResult = store.getProfile("charlie");
  console.assert(getResult.ok === true, "P4: getProfile finds created profile");

  const notFound = store.getProfile("nonexistent");
  console.assert(notFound.ok === false, "P4: getProfile returns fail for unknown user");

  if (userId) {
    const projectResult = store.createProject(userId, {
      title: "DevLink", description: "Portfolio", tags: ["react"], featured: true
    });
    console.assert(projectResult.ok === true, "P4: createProject succeeds");

    const projects = store.getProjects(userId);
    console.assert(projects.length === 1, "P4: one project in store");

    if (projectResult.ok) {
      const deleteResult = store.deleteProject(userId, projectResult.value.id);
      console.assert(deleteResult.ok === true, "P4: deleteProject succeeds");
      console.assert(store.getProjects(userId).length === 0, "P4: project removed");
    }

    const linkResult = store.createLink(userId, {
      platform: "github",
      url: "https://github.com/charlie",
      label: "GitHub",
    });
    console.assert(linkResult.ok === true, "P4: createLink succeeds");
    console.assert(store.getLinks(userId).length === 1, "P4: one link in store");
  }

  // Part 5 — AI bio streaming
  const chunks: AIBioChunk[] = [];
  for await (const chunk of simulateAIBioStream({
    name: "Charlie",
    projects: ["DevLink", "Portfolio"],
    links: ["github"],
  })) {
    chunks.push(chunk);
  }

  console.assert(chunks.length >= 2,                                 "P5: at least 2 chunks");
  console.assert((chunks[chunks.length - 1] as {type: string}).type === "done", "P5: last chunk is done");
  const doneChunk = chunks[chunks.length - 1] as { type: "done"; fullText: string };
  console.assert(doneChunk.fullText.includes("Charlie"), "P5: bio mentions the name");

  console.log("\n🎉 Chapter 27 — Capstone verification complete ✓");
  console.log("DevLink core types are fully implemented.");
  console.log("You're ready to build the real thing!");
}

verify().catch(console.error);
