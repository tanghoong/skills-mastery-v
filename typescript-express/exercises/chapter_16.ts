/**
 * Chapter 16 — API Versioning
 *
 * Run: tsx exercises/chapter_16.ts
 */

// =============================================================================
// EXERCISE 1 — Version extraction from path
// =============================================================================
// TODO: Implement `extractVersionFromPath(path: string): number | null`
//       - Extract version number from paths like "/api/v1/tasks", "/api/v2/projects"
//       - Returns the number (1, 2, etc.) or null if not found

export function extractVersionFromPath(path: string): number | null {
  // TODO
  return null;
}

// =============================================================================
// EXERCISE 2 — Versioned response shape transformer
// =============================================================================
// TODO: Define `TaskV1` interface: { id, title, status, priority, createdAt: string }
// TODO: Define `TaskV2` interface: extends TaskV1 but adds assigneeName? (string | null), labelCount (number)
//
// TODO: Implement `toTaskV1(task: { id: number; title: string; status: string; priority: string; createdAt: Date }): TaskV1`
// TODO: Implement `toTaskV2(task: TaskV1 & { assigneeName?: string | null; labelCount?: number }): TaskV2`

export interface TaskV1 {
  // TODO
}

export interface TaskV2 extends TaskV1 {
  // TODO
}

export function toTaskV1(task: { id: number; title: string; status: string; priority: string; createdAt: Date }): TaskV1 {
  // TODO
  return {} as TaskV1;
}

export function toTaskV2(task: TaskV1 & { assigneeName?: string | null; labelCount?: number }): TaskV2 {
  // TODO
  return {} as TaskV2;
}

// =============================================================================
// EXERCISE 3 — Breaking change detector
// =============================================================================
// TODO: Define `ApiChange` type: { type: "additive" | "breaking"; description: string }
// TODO: Implement `classifyChange(description: string): "additive" | "breaking"`
//       Rules (check for keywords):
//       - "remove"  → breaking
//       - "rename"  → breaking
//       - "require" → breaking (making a field required)
//       - "change type" → breaking
//       - "add"     → additive
//       - "optional" → additive
//       - default   → additive

export function classifyChange(description: string): "additive" | "breaking" {
  // TODO
  return "additive";
}

// =============================================================================
// EXERCISE 4 — Deprecation header builder
// =============================================================================
// TODO: Define `DeprecationInfo` interface:
//       { sunset: string; link?: string; replacement?: string }
//
// TODO: Implement `buildDeprecationHeaders(info: DeprecationInfo): Record<string, string>`
//       Returns a headers object with:
//       - "Deprecation": "true"
//       - "Sunset": info.sunset
//       - "Link": info.link if provided
//       - "X-API-Replacement": info.replacement if provided

export interface DeprecationInfo {
  // TODO
}

export function buildDeprecationHeaders(info: DeprecationInfo): Record<string, string> {
  // TODO
  return {};
}

// =============================================================================
// EXERCISE 5 — Version negotiation
// =============================================================================
// TODO: Implement `negotiateVersion(urlVersion?: string, headerVersion?: string, defaultVersion = 1): number`
//       - If urlVersion is present (e.g. "v1" or "1"), parse and return it
//       - Else if headerVersion is present, parse and return it
//       - Else return defaultVersion
//       - Strip "v" prefix before parsing

export function negotiateVersion(
  urlVersion?:    string,
  headerVersion?: string,
  defaultVersion  = 1
): number {
  // TODO
  return defaultVersion;
}

// =============================================================================
// VERIFICATION
// =============================================================================

function verify(): void {
  // Exercise 1
  console.assert(extractVersionFromPath("/api/v1/tasks")    === 1,    "Ex1: /api/v1 → 1");
  console.assert(extractVersionFromPath("/api/v2/projects") === 2,    "Ex1: /api/v2 → 2");
  console.assert(extractVersionFromPath("/api/tasks")       === null, "Ex1: no version → null");
  console.assert(extractVersionFromPath("/health")          === null, "Ex1: health → null");

  // Exercise 2 — transformers
  const raw = { id: 1, title: "Fix bug", status: "IN_PROGRESS", priority: "HIGH", createdAt: new Date("2024-01-01") };
  const v1  = toTaskV1(raw);
  console.assert(v1.id     === 1,           "Ex2: v1 id should be 1");
  console.assert(typeof v1.createdAt === "string", "Ex2: v1 createdAt should be ISO string");

  const v2 = toTaskV2({ ...v1, assigneeName: "Alice", labelCount: 3 });
  console.assert(v2.assigneeName === "Alice", "Ex2: v2 should have assigneeName");
  console.assert(v2.labelCount   === 3,       "Ex2: v2 should have labelCount");
  console.assert(v2.id           === 1,       "Ex2: v2 should inherit v1 fields");

  // Exercise 3 — classify change
  console.assert(classifyChange("remove the title field")          === "breaking",  "Ex3: remove is breaking");
  console.assert(classifyChange("rename assignee to assigneeId")   === "breaking",  "Ex3: rename is breaking");
  console.assert(classifyChange("add optional labelCount field")   === "additive",  "Ex3: add is additive");
  console.assert(classifyChange("require dueDate field")           === "breaking",  "Ex3: require is breaking");
  console.assert(classifyChange("add new endpoint for analytics")  === "additive",  "Ex3: new endpoint is additive");

  // Exercise 4 — deprecation headers
  const headers = buildDeprecationHeaders({
    sunset:      "2025-06-01T00:00:00Z",
    link:        "https://docs.example.com/migration",
    replacement: "/api/v2/tasks",
  });
  console.assert(headers["Deprecation"]     === "true",                              "Ex4: Deprecation header");
  console.assert(headers["Sunset"]          === "2025-06-01T00:00:00Z",              "Ex4: Sunset header");
  console.assert(headers["Link"]?.includes("docs.example.com"),                      "Ex4: Link header");
  console.assert(headers["X-API-Replacement"] === "/api/v2/tasks",                   "Ex4: Replacement header");

  const minHeaders = buildDeprecationHeaders({ sunset: "2025-01-01T00:00:00Z" });
  console.assert(minHeaders["Deprecation"] === "true", "Ex4: Deprecation always set");
  console.assert(!("Link" in minHeaders),              "Ex4: Link absent when not provided");

  // Exercise 5 — version negotiation
  console.assert(negotiateVersion("v1")              === 1, "Ex5: v1 from URL → 1");
  console.assert(negotiateVersion("2")               === 2, "Ex5: 2 from URL → 2");
  console.assert(negotiateVersion(undefined, "v2")   === 2, "Ex5: v2 from header");
  console.assert(negotiateVersion()                  === 1, "Ex5: default is 1");
  console.assert(negotiateVersion(undefined, undefined, 3) === 3, "Ex5: custom default");

  console.log("Chapter 16 verification complete ✓");
}

verify();
