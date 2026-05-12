/**
 * Chapter 16 — Type Guards & Narrowing in React
 *
 * Type-check: npx tsc --noEmit --strict exercises/chapter_16.tsx
 * Run:        tsx exercises/chapter_16.tsx
 */

// =============================================================================
// EXERCISE 1 — Discriminated union component props
// =============================================================================
// TODO: Define `AvatarProps` as a discriminated union (no `state: never`):
//   - { kind: "loading" }
//   - { kind: "image";    src: string;      alt: string }
//   - { kind: "initials"; initials: string; color: string }

type AvatarProps = never; // replace

// TODO: Implement `renderAvatar(props: AvatarProps): string`
//   - "loading"  → "<div class='skeleton-avatar' />"
//   - "image"    → `<img src="${src}" alt="${alt}" />`
//   - "initials" → `<div style="background:${color}">${initials}</div>`
//   Add an exhaustive `never` check in the default branch.

function renderAvatar(props: AvatarProps): string {
  // TODO: switch on props.kind
  return "";
}

// =============================================================================
// EXERCISE 2 — `is` type predicates
// =============================================================================
// TODO: Define these interfaces:
//   - `ApiSuccess<T>`: { status: "success"; data: T }
//   - `ApiError`:      { status: "error";   message: string; code?: number }
//   - `ApiLoading`:    { status: "loading" }
// TODO: Define `ApiResponse<T> = ApiSuccess<T> | ApiError | ApiLoading`
//
// TODO: Implement these type predicates:
//   - `isApiSuccess<T>(res: ApiResponse<T>): res is ApiSuccess<T>`
//   - `isApiError<T>(res: ApiResponse<T>): res is ApiError`

interface ApiSuccess<T> { status: "success"; data: T }
interface ApiError      { status: "error";   message: string; code?: number }
interface ApiLoading    { status: "loading" }

type ApiResponse<T> = ApiSuccess<T> | ApiError | ApiLoading;

function isApiSuccess<T>(res: ApiResponse<T>): res is ApiSuccess<T> {
  // TODO
  return false;
}

function isApiError<T>(res: ApiResponse<T>): res is ApiError {
  // TODO
  return false;
}

// =============================================================================
// EXERCISE 3 — Display state union
// =============================================================================
// TODO: Define `DisplayState<T>` as a discriminated union:
//   - { kind: "loading" }
//   - { kind: "empty" }
//   - { kind: "data";  items: T[] }
//   - { kind: "error"; message: string }
//
// TODO: Implement `computeDisplayState<T>`:
//   - isLoading → { kind: "loading" }
//   - isError && error → { kind: "error", message: error.message }
//   - data && data.length === 0 → { kind: "empty" }
//   - data && data.length > 0  → { kind: "data", items: data }
//   - else → { kind: "loading" }  (fallback)

type DisplayState<T> = never; // replace

function computeDisplayState<T>(
  isLoading: boolean,
  isError: boolean,
  error: Error | null,
  data: T[] | undefined
): DisplayState<T> {
  // TODO
  return { kind: "loading" } as DisplayState<T>;
}

// =============================================================================
// EXERCISE 4 — Exhaustive switch
// =============================================================================
// TODO: Define `ProjectStatus` as "draft" | "published" | "archived"
// TODO: Implement `getStatusLabel(status: ProjectStatus): string`
//   - "draft"     → "Draft"
//   - "published" → "Published"
//   - "archived"  → "Archived"
//   Include an exhaustive never check in the default branch.

type ProjectStatus = "draft" | "published" | "archived";

function getStatusLabel(status: ProjectStatus): string {
  // TODO: switch with exhaustive never check
  return "";
}

// =============================================================================
// EXERCISE 5 — Narrowing with `Extract` and `Exclude`
// =============================================================================
// TODO: Given type `Platform` = "github" | "twitter" | "linkedin" | "youtube" | "website" | "other"
// Define:
//   - `SocialPlatform` = Exclude<Platform, "other">  (known platforms only)
//   - `VideoPatform`   = Extract<Platform, "youtube">  (just YouTube for now)
//   - `ProfessionalPlatform` = Extract<Platform, "linkedin" | "website">

type Platform = "github" | "twitter" | "linkedin" | "youtube" | "website" | "other";

type SocialPlatform      = never; // replace using Exclude
type VideoPlatform       = never; // replace using Extract
type ProfessionalPlatform = never; // replace using Extract

// TODO: Implement `getPlatformCategory(p: Platform): "professional" | "social" | "video" | "other"`
//   professional: linkedin, website
//   video:        youtube
//   other:        other
//   social:       everything else (github, twitter)

function getPlatformCategory(p: Platform): "professional" | "social" | "video" | "other" {
  // TODO
  return "other";
}

// =============================================================================
// VERIFICATION
// =============================================================================

function verify(): void {
  // Exercise 1 — discriminated union render
  const loading = renderAvatar({ kind: "loading" });
  const image   = renderAvatar({ kind: "image", src: "/avatar.jpg", alt: "Charlie" });
  const initials = renderAvatar({ kind: "initials", initials: "CT", color: "#4F46E5" });

  console.assert(loading.includes("skeleton"),    "Ex1: loading should render skeleton");
  console.assert(image.includes("/avatar.jpg"),   "Ex1: image should contain src");
  console.assert(initials.includes("CT"),         "Ex1: initials should contain text");

  // Exercise 2 — type predicates
  const success: ApiResponse<string> = { status: "success", data: "hello" };
  const errorRes: ApiResponse<string> = { status: "error", message: "Not found" };
  const loading2: ApiResponse<string> = { status: "loading" };

  console.assert(isApiSuccess(success)  === true,  "Ex2: success is success");
  console.assert(isApiSuccess(errorRes) === false, "Ex2: error is not success");
  console.assert(isApiError(errorRes)   === true,  "Ex2: error is error");
  console.assert(isApiError(loading2)   === false, "Ex2: loading is not error");

  if (isApiSuccess(success)) {
    console.assert(success.data === "hello", "Ex2: data narrowed to string");
  }

  // Exercise 3 — display state
  const s1 = computeDisplayState(true, false, null, undefined);
  console.assert((s1 as {kind: string}).kind === "loading", "Ex3: isLoading → loading");

  const s2 = computeDisplayState(false, true, new Error("404"), undefined);
  console.assert((s2 as {kind: string}).kind === "error", "Ex3: isError → error");

  const s3 = computeDisplayState(false, false, null, []);
  console.assert((s3 as {kind: string}).kind === "empty", "Ex3: empty array → empty");

  const s4 = computeDisplayState(false, false, null, ["a", "b"]);
  console.assert((s4 as {kind: string}).kind === "data", "Ex3: data → data");
  if ((s4 as {kind: string}).kind === "data") {
    console.assert((s4 as {kind: "data"; items: string[]}).items.length === 2, "Ex3: items preserved");
  }

  // Exercise 4 — status labels
  console.assert(getStatusLabel("draft")     === "Draft",     "Ex4: draft label");
  console.assert(getStatusLabel("published") === "Published", "Ex4: published label");
  console.assert(getStatusLabel("archived")  === "Archived",  "Ex4: archived label");

  // Exercise 5 — platform categories
  console.assert(getPlatformCategory("linkedin") === "professional", "Ex5: linkedin → professional");
  console.assert(getPlatformCategory("youtube")  === "video",        "Ex5: youtube → video");
  console.assert(getPlatformCategory("github")   === "social",       "Ex5: github → social");
  console.assert(getPlatformCategory("other")    === "other",        "Ex5: other → other");

  console.log("Chapter 16 verification complete ✓");
}

verify();
