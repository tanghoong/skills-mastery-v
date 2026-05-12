/**
 * Chapter 9 — Forms: React Hook Form + Zod
 *
 * Type-check: npx tsc --noEmit --strict exercises/chapter_09.tsx
 * Run:        tsx exercises/chapter_09.tsx
 *
 * These exercises build Zod schemas and derive TypeScript types from them,
 * then implement validation logic — the same schemas used in DevLink forms.
 */

import { z } from "zod";

// =============================================================================
// EXERCISE 1 — Profile schema
// =============================================================================
// TODO: Define `profileSchema` with Zod:
//   - name:      string, min 1 ("Name is required"), max 100
//   - bio:       string, max 500 (optional content but field exists)
//   - location:  string, max 100, optional (can be omitted or empty)
//   - avatarUrl: string that is a valid URL, optional

export const profileSchema = z.object({
  // TODO
});

export type ProfileFormData = z.infer<typeof profileSchema>;
// Should be: { name: string; bio: string; location?: string | undefined; avatarUrl?: string | undefined }

// =============================================================================
// EXERCISE 2 — Project schema
// =============================================================================
// TODO: Define `projectSchema` with Zod:
//   - title:       string, min 1, max 80
//   - description: string, min 1, max 500
//   - url:         optional URL or empty string (hint: .url().optional().or(z.literal("")))
//   - repoUrl:     optional URL or empty string
//   - tags:        array of strings, max 10 items
//   - featured:    boolean

export const projectSchema = z.object({
  // TODO
});

export type ProjectFormData = z.infer<typeof projectSchema>;

// =============================================================================
// EXERCISE 3 — Social link schema
// =============================================================================
// TODO: Define `linkSchema` with Zod:
//   - platform: enum of "github" | "twitter" | "linkedin" | "youtube" | "website" | "other"
//               Use z.enum([...]) — not a string with refinement
//   - url:      string, valid URL
//   - label:    string, min 1, max 50

export const linkSchema = z.object({
  // TODO
});

export type LinkFormData = z.infer<typeof linkSchema>;

// =============================================================================
// EXERCISE 4 — Login schema
// =============================================================================
// TODO: Define `loginSchema` with Zod:
//   - email:    string, valid email
//   - password: string, min 8 ("Password must be at least 8 characters")

export const loginSchema = z.object({
  // TODO
});

export type LoginFormData = z.infer<typeof loginSchema>;

// =============================================================================
// EXERCISE 5 — Schema validation function
// =============================================================================
// TODO: Define `FormValidationResult<T>` discriminated union:
//   - { success: true;  data: T }
//   - { success: false; fieldErrors: Partial<Record<keyof T, string>> }
//
// TODO: Implement `validateForm<T>(schema: z.ZodSchema<T>, raw: unknown): FormValidationResult<T>`
//   On success: return { success: true, data }
//   On failure: map the first error per field path to fieldErrors

type FormValidationResult<T> = never; // replace

function validateForm<T>(
  schema: z.ZodSchema<T>,
  raw: unknown
): FormValidationResult<T> {
  // TODO: use schema.safeParse(raw)
  // On success return { success: true, data }
  // On failure map first error per field to fieldErrors
  return { success: false, fieldErrors: {} } as FormValidationResult<T>;
}

// =============================================================================
// EXERCISE 6 — Default values factory
// =============================================================================
// TODO: Implement `createDefaultProject(): ProjectFormData`
//   Returns: title: "", description: "", url: "", repoUrl: "", tags: [], featured: false
//
// TODO: Implement `createDefaultLink(): LinkFormData`
//   Returns: platform: "github", url: "", label: ""

function createDefaultProject(): ProjectFormData {
  // TODO
  return {} as ProjectFormData;
}

function createDefaultLink(): LinkFormData {
  // TODO
  return {} as LinkFormData;
}

// =============================================================================
// VERIFICATION
// =============================================================================

function verify(): void {
  // Exercise 1 — profile schema
  const validProfile = profileSchema.safeParse({ name: "Charlie", bio: "TypeScript dev" });
  console.assert(validProfile.success === true, "Ex1: valid profile should pass");

  const emptyName = profileSchema.safeParse({ name: "", bio: "" });
  console.assert(emptyName.success === false, "Ex1: empty name should fail");

  const longBio = profileSchema.safeParse({ name: "Charlie", bio: "x".repeat(501) });
  console.assert(longBio.success === false, "Ex1: bio > 500 chars should fail");

  // Exercise 2 — project schema
  const validProject = projectSchema.safeParse({
    title: "DevLink",
    description: "Portfolio builder",
    tags: ["react", "typescript"],
    featured: false,
  });
  console.assert(validProject.success === true, "Ex2: valid project should pass");

  const tooManyTags = projectSchema.safeParse({
    title: "DevLink",
    description: "desc",
    tags: new Array(11).fill("tag"),
    featured: false,
  });
  console.assert(tooManyTags.success === false, "Ex2: >10 tags should fail");

  // Exercise 3 — link schema
  const validLink = linkSchema.safeParse({
    platform: "github",
    url: "https://github.com/charlie",
    label: "GitHub",
  });
  console.assert(validLink.success === true, "Ex3: valid link should pass");

  const badPlatform = linkSchema.safeParse({
    platform: "discord", // not in enum
    url: "https://discord.com",
    label: "Discord",
  });
  console.assert(badPlatform.success === false, "Ex3: invalid platform should fail");

  // Exercise 4 — login schema
  const validLogin = loginSchema.safeParse({ email: "charlie@test.com", password: "password123" });
  console.assert(validLogin.success === true, "Ex4: valid login should pass");

  const shortPassword = loginSchema.safeParse({ email: "a@b.com", password: "short" });
  console.assert(shortPassword.success === false, "Ex4: short password should fail");

  // Exercise 5 — validateForm
  const result1 = validateForm(profileSchema, { name: "Charlie", bio: "Dev" });
  console.assert(result1.success === true, "Ex5: valid data should succeed");
  if (result1.success) {
    console.assert(result1.data.name === "Charlie", "Ex5: data.name should be 'Charlie'");
  }

  const result2 = validateForm(profileSchema, { name: "", bio: "" });
  console.assert(result2.success === false, "Ex5: invalid data should fail");
  if (!result2.success) {
    console.assert("name" in result2.fieldErrors, "Ex5: fieldErrors should have 'name'");
  }

  // Exercise 6 — defaults
  const defaultProject = createDefaultProject();
  console.assert(defaultProject.title === "",      "Ex6: default title is ''");
  console.assert(defaultProject.featured === false, "Ex6: default featured is false");
  console.assert(Array.isArray(defaultProject.tags), "Ex6: default tags is array");
  console.assert(defaultProject.tags.length === 0, "Ex6: default tags is empty");

  const defaultLink = createDefaultLink();
  console.assert(defaultLink.platform === "github", "Ex6: default platform is 'github'");
  console.assert(defaultLink.url === "",            "Ex6: default url is ''");

  console.log("Chapter 9 verification complete ✓");
}

verify();
