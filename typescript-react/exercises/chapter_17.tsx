/**
 * Chapter 17 — Advanced Generic Components
 *
 * Type-check: npx tsc --noEmit --strict exercises/chapter_17.tsx
 * Run:        tsx exercises/chapter_17.tsx
 */

// =============================================================================
// EXERCISE 1 — Column definition type
// =============================================================================
// TODO: Define `Column<T>` interface with:
//   - key:      keyof T | string  (column identifier)
//   - header:   string
//   - render:   (row: T) => string  (returns rendered content as string here)
//   - width?:   string
//   - align?:   "left" | "center" | "right"
//   - sortable?: boolean

interface Column<T> {
  // TODO
}

// =============================================================================
// EXERCISE 2 — DataTable logic
// =============================================================================
// TODO: Define `DataTableProps<T extends { id: string }>` with:
//   - data:          T[]
//   - columns:       Column<T>[]
//   - onRowClick?:   (row: T) => void
//   - emptyMessage?: string
//   - sortKey?:      keyof T
//   - sortDir?:      "asc" | "desc"
//
// TODO: Implement `sortTableData<T extends { id: string }>(data: T[], key: keyof T, dir: "asc" | "desc"): T[]`
//   Sort by the given key — string comparison for strings, numeric for numbers.

interface DataTableProps<T extends { id: string }> {
  // TODO
}

function sortTableData<T extends { id: string }>(
  data: T[],
  key: keyof T,
  dir: "asc" | "desc"
): T[] {
  // TODO: sort a copy of data
  return [...data];
}

// =============================================================================
// EXERCISE 3 — Generic Select logic
// =============================================================================
// TODO: Implement `findOption<T extends { id: string }>(options: T[], id: string): T | null`
//   Returns the option with the matching id, or null.
//
// TODO: Implement `toggleMultiOption<T extends { id: string }>(selected: T[], option: T, max?: number): T[]`
//   - If option is in selected → remove it
//   - If option is not in selected AND (max is undefined OR selected.length < max) → add it
//   - Otherwise (max reached) → return selected unchanged

function findOption<T extends { id: string }>(options: T[], id: string): T | null {
  // TODO
  return null;
}

function toggleMultiOption<T extends { id: string }>(
  selected: T[],
  option: T,
  max?: number
): T[] {
  // TODO
  return selected;
}

// =============================================================================
// EXERCISE 4 — Generic List with render prop
// =============================================================================
// TODO: Define `ListProps<T>` with:
//   - items:        T[]
//   - renderItem:   (item: T, index: number) => string
//   - keyExtractor: (item: T) => string
//   - emptyMessage?: string
//
// TODO: Implement `renderList<T>(props: ListProps<T>): string[]`
//   Returns an array of rendered strings (one per item), or [] if empty.

interface ListProps<T> {
  // TODO
}

function renderList<T>(props: ListProps<T>): string[] {
  // TODO
  return [];
}

// =============================================================================
// EXERCISE 5 — Generic sorted + filtered list
// =============================================================================
// TODO: Implement `filterAndSort<T>(items: T[], predicate: (item: T) => boolean, comparator: (a: T, b: T) => number): T[]`
//   1. Filter items using predicate
//   2. Sort filtered results using comparator
//   Return a new array.

function filterAndSort<T>(
  items: T[],
  predicate: (item: T) => boolean,
  comparator: (a: T, b: T) => number
): T[] {
  // TODO
  return items;
}

// =============================================================================
// VERIFICATION
// =============================================================================

interface Project {
  id: string;
  title: string;
  order: number;
  featured: boolean;
  tags: string[];
}

const projects: Project[] = [
  { id: "3", title: "Zapier",    order: 2, featured: false, tags: ["automation"] },
  { id: "1", title: "DevLink",   order: 0, featured: true,  tags: ["react"] },
  { id: "2", title: "Portfolio", order: 1, featured: true,  tags: ["nextjs"] },
];

interface Platform {
  id: string;
  label: string;
}

const platforms: Platform[] = [
  { id: "github",   label: "GitHub" },
  { id: "twitter",  label: "Twitter" },
  { id: "linkedin", label: "LinkedIn" },
];

function verify(): void {
  // Exercise 2 — sortTableData
  const byTitle = sortTableData(projects, "title", "asc");
  console.assert(byTitle[0].title === "DevLink",   "Ex2: asc by title — DevLink first");
  console.assert(byTitle[2].title === "Zapier",    "Ex2: asc by title — Zapier last");

  const byOrder = sortTableData(projects, "order", "asc");
  console.assert(byOrder[0].id === "1", "Ex2: asc by order — id 1 first");
  console.assert(byOrder[2].id === "3", "Ex2: asc by order — id 3 last");

  const byTitleDesc = sortTableData(projects, "title", "desc");
  console.assert(byTitleDesc[0].title === "Zapier", "Ex2: desc by title — Zapier first");

  // Exercise 3 — findOption
  const found = findOption(platforms, "github");
  console.assert(found?.label === "GitHub", "Ex3: findOption returns correct item");

  const notFound = findOption(platforms, "discord");
  console.assert(notFound === null, "Ex3: not found returns null");

  // toggleMultiOption
  const selected: Platform[] = [platforms[0]];
  const after1 = toggleMultiOption(selected, platforms[1]);
  console.assert(after1.length === 2, "Ex3: adding item increases length");

  const after2 = toggleMultiOption(after1, platforms[0]);
  console.assert(after2.length === 1, "Ex3: removing item decreases length");
  console.assert(!after2.find(p => p.id === "github"), "Ex3: removed item is gone");

  // max reached
  const maxed = toggleMultiOption([platforms[0], platforms[1]], platforms[2], 2);
  console.assert(maxed.length === 2, "Ex3: max=2 prevents adding third");

  // Exercise 4 — renderList
  const rendered = renderList({
    items: platforms,
    renderItem: (p, i) => `${i + 1}. ${p.label}`,
    keyExtractor: (p) => p.id,
  });
  console.assert(rendered.length === 3,             "Ex4: 3 items rendered");
  console.assert(rendered[0] === "1. GitHub",       "Ex4: first item is '1. GitHub'");
  console.assert(rendered[2] === "3. LinkedIn",     "Ex4: third item is '3. LinkedIn'");

  const empty = renderList({ items: [], renderItem: (p: Platform) => p.label, keyExtractor: (p) => p.id });
  console.assert(empty.length === 0, "Ex4: empty list returns []");

  // Exercise 5 — filterAndSort
  const featuredSorted = filterAndSort(
    projects,
    (p) => p.featured,
    (a, b) => a.order - b.order
  );
  console.assert(featuredSorted.length === 2, "Ex5: 2 featured projects");
  console.assert(featuredSorted[0].id === "1", "Ex5: DevLink (order 0) first");
  console.assert(featuredSorted[1].id === "2", "Ex5: Portfolio (order 1) second");

  console.log("Chapter 17 verification complete ✓");
}

verify();
