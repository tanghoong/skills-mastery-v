# Chapter 17 — Advanced Generic Components

## Learning Objectives

By the end of this chapter you will be able to:
- Build a typed `DataTable<T>` component with typed column definitions
- Build a typed `Select<T>` and `MultiSelect<T>` with constrained type parameters
- Build a typed render-prop `List<T>` component
- Understand when generic components are worth the complexity

---

## 17.1 Typed `DataTable<T>`

The most common generic component in admin UIs. Columns are defined once — the row type flows through:

```tsx
import type { ReactNode } from "react";

// Column definition — T is the row data type
interface Column<T> {
  key:     keyof T | string;            // header id
  header:  string;                      // display label
  render:  (row: T) => ReactNode;       // how to render this column
  width?:  string;
  align?:  "left" | "center" | "right";
  sortable?: boolean;
}

interface DataTableProps<T extends { id: string }> {
  data:       T[];
  columns:    Column<T>[];
  isLoading?: boolean;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
}

function DataTable<T extends { id: string }>({
  data,
  columns,
  isLoading = false,
  onRowClick,
  emptyMessage = "No data",
}: DataTableProps<T>) {
  if (isLoading) return <TableSkeleton columns={columns.length} />;

  return (
    <table className="w-full text-sm">
      <thead>
        <tr>
          {columns.map((col) => (
            <th
              key={String(col.key)}
              style={{ width: col.width }}
              className={`text-${col.align ?? "left"} px-4 py-3 font-medium text-gray-500`}
            >
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.length === 0 ? (
          <tr>
            <td colSpan={columns.length} className="py-8 text-center text-gray-400">
              {emptyMessage}
            </td>
          </tr>
        ) : (
          data.map((row) => (
            <tr
              key={row.id}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={onRowClick ? "cursor-pointer hover:bg-gray-50" : ""}
            >
              {columns.map((col) => (
                <td key={String(col.key)} className={`px-4 py-3 text-${col.align ?? "left"}`}>
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}
```

Usage — TypeScript ensures columns and data match:
```tsx
const projectColumns: Column<Project>[] = [
  {
    key: "title",
    header: "Title",
    render: (p) => <span className="font-medium">{p.title}</span>,
  },
  {
    key: "tags",
    header: "Tags",
    render: (p) => (
      <div className="flex gap-1">
        {p.tags.map((t) => <Badge key={t}>{t}</Badge>)}
      </div>
    ),
  },
  {
    key: "actions",
    header: "",
    align: "right",
    render: (p) => <ProjectActions project={p} />,
  },
];

<DataTable<Project>
  data={projects}
  columns={projectColumns}
  onRowClick={(p) => navigate(`/admin/projects/${p.id}`)}
/>
```

---

## 17.2 Typed `Select<T>` with Constraints

```tsx
interface SelectProps<T extends { id: string; label: string }> {
  options:     T[];
  value:       T | null;
  onChange:    (value: T | null) => void;
  getLabel?:   (option: T) => string;         // override default label rendering
  placeholder?: string;
  disabled?:   boolean;
}

function Select<T extends { id: string; label: string }>({
  options,
  value,
  onChange,
  getLabel = (o) => o.label,
  placeholder = "Select…",
  disabled = false,
}: SelectProps<T>) {
  return (
    <select
      value={value?.id ?? ""}
      disabled={disabled}
      onChange={(e) => {
        const found = options.find((o) => o.id === e.target.value) ?? null;
        onChange(found);
      }}
    >
      <option value="" disabled>{placeholder}</option>
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {getLabel(o)}
        </option>
      ))}
    </select>
  );
}
```

---

## 17.3 Typed `MultiSelect<T>`

```tsx
interface MultiSelectProps<T extends { id: string; label: string }> {
  options:   T[];
  value:     T[];
  onChange:  (value: T[]) => void;
  max?:      number;
}

function MultiSelect<T extends { id: string; label: string }>({
  options,
  value,
  onChange,
  max,
}: MultiSelectProps<T>) {
  const selectedIds = new Set(value.map((v) => v.id));

  const toggle = (option: T) => {
    if (selectedIds.has(option.id)) {
      onChange(value.filter((v) => v.id !== option.id));
    } else if (!max || value.length < max) {
      onChange([...value, option]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => toggle(o)}
          className={cn(
            "rounded-full border px-3 py-1 text-sm",
            selectedIds.has(o.id)
              ? "border-indigo-500 bg-indigo-50 text-indigo-700"
              : "border-gray-300 text-gray-600"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
```

---

## 17.4 Render-Prop `List<T>`

Render props let the consumer control exactly how each item renders:

```tsx
interface ListProps<T> {
  items:      T[];
  renderItem: (item: T, index: number) => ReactNode;
  keyExtractor: (item: T) => string;
  emptyState?: ReactNode;
  className?: string;
}

function List<T>({
  items,
  renderItem,
  keyExtractor,
  emptyState,
  className,
}: ListProps<T>) {
  if (items.length === 0) {
    return <>{emptyState ?? null}</>;
  }

  return (
    <ul className={className}>
      {items.map((item, i) => (
        <li key={keyExtractor(item)}>
          {renderItem(item, i)}
        </li>
      ))}
    </ul>
  );
}

// Usage
<List<SocialLink>
  items={links}
  keyExtractor={(l) => l.id}
  renderItem={(link) => (
    <LinkRow
      platform={link.platform}
      url={link.url}
      label={link.label}
    />
  )}
  emptyState={<EmptyLinksState />}
/>
```

---

## 17.5 When Generic Components Are Worth It

Generic components add complexity. Use them when:

| Situation | Use Generic |
|-----------|-------------|
| Same UI pattern, different data types (table, list, select) | Yes |
| Used 3+ times with different types | Yes |
| Used once with a single data type | No — just type it concretely |
| The type parameter would always be the same | No |

---

## Key Takeaways

| Component | Key Generic Constraint |
|-----------|----------------------|
| `DataTable<T>` | `T extends { id: string }` — required for keys |
| `Select<T>` | `T extends { id: string; label: string }` — needed to render options |
| `List<T>` | `T` unconstrained — caller provides `keyExtractor` |
| Column definition | `Column<T>` — `render: (row: T) => ReactNode` flows the type through |
| Render prop | `renderItem: (item: T, index: number) => ReactNode` |
