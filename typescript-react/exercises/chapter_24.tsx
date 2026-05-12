/**
 * Chapter 24 — tRPC + React
 *
 * Type-check: npx tsc --noEmit --strict exercises/chapter_24.tsx
 * Run:        tsx exercises/chapter_24.tsx
 *
 * These exercises model the type inference patterns used by tRPC
 * without needing the actual library installed.
 */

import { z } from "zod";

// =============================================================================
// EXERCISE 1 — Procedure input/output types
// =============================================================================
// tRPC procedures have typed inputs (from Zod) and typed outputs (from return type).
// TODO: Define Zod schemas for each DevLink procedure:

// Profile get — input: { username: string }
export const profileGetInput = z.object({
  // TODO
});

// Profile update — input: { name: string (min 1, max 100), bio: string (max 500) }
export const profileUpdateInput = z.object({
  // TODO
});

// Project create — input: { title, description, tags[], featured?, url?, repoUrl? }
export const projectCreateInput = z.object({
  // TODO
});

// Project delete — input: { id: string }
export const projectDeleteInput = z.object({
  // TODO
});

// Link create — input: { platform (enum), url (URL), label (min 1, max 50) }
export const linkCreateInput = z.object({
  // TODO
});

// =============================================================================
// EXERCISE 2 — Derive TypeScript types from schemas
// =============================================================================
// TODO: Derive TypeScript types from all schemas above using z.infer<>

export type ProfileGetInput    = z.infer<typeof profileGetInput>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateInput>;
export type ProjectCreateInput = z.infer<typeof projectCreateInput>;
export type ProjectDeleteInput = z.infer<typeof projectDeleteInput>;
export type LinkCreateInput    = z.infer<typeof linkCreateInput>;

// =============================================================================
// EXERCISE 3 — inferRouterInputs / inferRouterOutputs simulation
// =============================================================================
// tRPC's `inferRouterInputs<Router>` extracts all input types.
// Simulate this with TypeScript mapped types.
//
// TODO: Define `ProcedureDefinition<TInput, TOutput>` with:
//   - input:    TInput
//   - output:   TOutput
//
// TODO: Define a `RouterShape` type for DevLink:
//   - profile.get:    ProcedureDefinition<ProfileGetInput, Profile>
//   - profile.update: ProcedureDefinition<ProfileUpdateInput, Profile>
//   - projects.list:  ProcedureDefinition<void, Project[]>
//   - projects.create: ProcedureDefinition<ProjectCreateInput, Project>
//   - projects.delete: ProcedureDefinition<ProjectDeleteInput, void>
//
// TODO: Define `RouterInputs<R extends RouterShape>` as a mapped type extracting inputs
// TODO: Define `RouterOutputs<R extends RouterShape>` as a mapped type extracting outputs

interface Profile { id: string; username: string; name: string; bio: string; }
interface Project { id: string; title: string; description: string; }

interface ProcedureDefinition<TInput, TOutput> {
  // TODO
}

type RouterShape = Record<string, ProcedureDefinition<unknown, unknown>>;

// DevLink router shape
type DevLinkRouter = {
  "profile.get":      ProcedureDefinition<ProfileGetInput, Profile>;
  "profile.update":   ProcedureDefinition<ProfileUpdateInput, Profile>;
  "projects.list":    ProcedureDefinition<void, Project[]>;
  "projects.create":  ProcedureDefinition<ProjectCreateInput, Project>;
  "projects.delete":  ProcedureDefinition<ProjectDeleteInput, void>;
};

type RouterInputs<R extends RouterShape>  = { [K in keyof R]: R[K] extends ProcedureDefinition<infer I, unknown> ? I : never };
type RouterOutputs<R extends RouterShape> = { [K in keyof R]: R[K] extends ProcedureDefinition<unknown, infer O> ? O : never };

// These should compile:
type DevLinkInputs  = RouterInputs<DevLinkRouter>;
type DevLinkOutputs = RouterOutputs<DevLinkRouter>;

// =============================================================================
// EXERCISE 4 — Typed mutation state
// =============================================================================
// tRPC mutations return a typed state object.
// TODO: Define `MutationState<TData, TError = Error, TVariables = void>` with:
//   - isPending:  boolean
//   - isSuccess:  boolean
//   - isError:    boolean
//   - data:       TData | undefined
//   - error:      TError | null
//   - variables:  TVariables | undefined
//   - mutate:     (vars: TVariables) => void

interface MutationState<TData, TError = Error, TVariables = void> {
  // TODO
}

// TODO: Implement `createMutationState<TData, TVariables>(fn: (vars: TVariables) => Promise<TData>): MutationState<TData, Error, TVariables>`
//   Returns a state object that:
//   - Starts as idle (isPending: false, etc.)
//   - When mutate() is called: sets isPending: true, calls fn
//   - On success: sets data, isSuccess: true, isPending: false
//   - On error: sets error, isError: true, isPending: false
//   Use mutable let variables to simulate state.

function createMutationState<TData, TVariables>(
  fn: (vars: TVariables) => Promise<TData>
): MutationState<TData, Error, TVariables> {
  // TODO
  return {} as MutationState<TData, Error, TVariables>;
}

// =============================================================================
// EXERCISE 5 — Optimistic delete helper
// =============================================================================
// tRPC's `useMutation({ onMutate })` uses optimistic updates.
// TODO: Implement `simulateOptimisticDelete<T extends { id: string }>(cache: T[], id: string)`:
//   Returns { optimistic: T[], rollback: () => T[] }
//   - optimistic: cache with id removed
//   - rollback: function that returns the original cache

function simulateOptimisticDelete<T extends { id: string }>(
  cache: T[],
  id: string
): { optimistic: T[]; rollback: () => T[] } {
  // TODO
  return { optimistic: cache, rollback: () => cache };
}

// =============================================================================
// VERIFICATION
// =============================================================================

async function verify(): Promise<void> {
  // Exercise 1 — schemas
  const validGet = profileGetInput.safeParse({ username: "charlie" });
  console.assert(validGet.success === true, "Ex1: profile get input valid");

  const validCreate = projectCreateInput.safeParse({
    title: "DevLink", description: "Portfolio", tags: ["react"]
  });
  console.assert(validCreate.success === true, "Ex1: project create input valid");

  const invalidLink = linkCreateInput.safeParse({
    platform: "discord", url: "not-url", label: ""
  });
  console.assert(invalidLink.success === false, "Ex1: invalid link input fails");

  // Exercise 3 — type derivation (just check it compiles)
  const inputs: DevLinkInputs = {
    "profile.get":     { username: "charlie" },
    "profile.update":  { name: "Charlie", bio: "Dev" },
    "projects.list":   undefined,
    "projects.create": { title: "T", description: "D", tags: [] },
    "projects.delete": { id: "1" },
  };
  console.assert(inputs["profile.get"].username === "charlie", "Ex3: types work correctly");

  // Exercise 4 — mutation state
  const mut = createMutationState<Project, ProjectCreateInput>(
    async (data) => ({ id: "new-1", title: data.title, description: data.description })
  );

  console.assert(mut.isPending === false, "Ex4: starts as not pending");
  console.assert(mut.data === undefined,  "Ex4: starts with no data");

  await new Promise<void>((resolve) => {
    const orig = mut.mutate.bind(mut);
    mut.mutate({ title: "New Project", description: "Desc", tags: [] });
    setTimeout(resolve, 50);
  });

  console.assert(mut.isSuccess === true,                "Ex4: success after mutate");
  console.assert(mut.data?.title === "New Project",     "Ex4: data populated");
  console.assert(mut.isPending === false,               "Ex4: not pending after complete");

  // Exercise 5 — optimistic delete
  const cache: Project[] = [
    { id: "1", title: "DevLink",   description: "" },
    { id: "2", title: "Portfolio", description: "" },
    { id: "3", title: "API",       description: "" },
  ];

  const { optimistic, rollback } = simulateOptimisticDelete(cache, "2");
  console.assert(optimistic.length === 2,           "Ex5: optimistic has 2 items");
  console.assert(!optimistic.find(p => p.id === "2"), "Ex5: item 2 removed");

  const rolled = rollback();
  console.assert(rolled.length === 3,               "Ex5: rollback restores 3 items");
  console.assert(rolled.find(p => p.id === "2") !== undefined, "Ex5: item 2 restored");

  console.log("Chapter 24 verification complete ✓");
}

verify().catch(console.error);
