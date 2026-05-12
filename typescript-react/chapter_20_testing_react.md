# Chapter 20 — Testing React

## Learning Objectives

By the end of this chapter you will be able to:
- Set up Vitest + Testing Library with correct TypeScript config
- Write typed queries using Testing Library's query methods
- Mock hooks and modules with `vi.fn<T>` and `vi.mocked`
- Test generic components with concrete type arguments
- Write type-level tests with `expectTypeOf`

---

## 20.1 Setup

```bash
npm install -D vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom
```

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
  },
});

// src/test/setup.ts
import "@testing-library/jest-dom";
```

```typescript
// tsconfig.json — add vitest globals
{
  "compilerOptions": {
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  }
}
```

---

## 20.2 Typed `render` and Queries

Testing Library's queries return typed DOM elements:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "@/components/Button";

test("calls onClick when clicked", async () => {
  const handleClick = vi.fn<[], void>();
  render(<Button onClick={handleClick} label="Save" />);

  const button = screen.getByRole("button", { name: "Save" });
  // button is HTMLElement — typed

  await userEvent.click(button);
  expect(handleClick).toHaveBeenCalledOnce();
});

test("is disabled when isLoading", () => {
  render(<Button label="Save" isLoading onClick={vi.fn()} />);

  const button = screen.getByRole<HTMLButtonElement>("button");
  // getByRole<T> narrows to HTMLButtonElement
  expect(button).toBeDisabled();
  expect(button.disabled).toBe(true); // typed — .disabled exists on HTMLButtonElement
});
```

---

## 20.3 `vi.fn<Args, Return>` — Typed Mocks

```tsx
// Typed mock function
const onSubmit = vi.fn<[ProjectFormData], Promise<void>>();

// Or infer from an existing function type
const mockLogin = vi.fn<Parameters<typeof authApi.login>, ReturnType<typeof authApi.login>>();

// Check typed arguments
expect(onSubmit).toHaveBeenCalledWith<[ProjectFormData]>({
  title: "DevLink",
  description: "A portfolio builder",
  tags: ["react", "typescript"],
  featured: true,
  url: "",
  repoUrl: "",
});
```

---

## 20.4 Mocking Modules with `vi.mocked`

```tsx
// src/lib/api.ts
export const api = {
  getProjects: (userId: string): Promise<Project[]> => fetch(`/projects/${userId}`).then(r => r.json()),
};

// __tests__/ProjectList.test.tsx
import { api } from "@/lib/api";

vi.mock("@/lib/api");

const mockApi = vi.mocked(api, true);
// mockApi.getProjects is now typed as Mock<[string], Promise<Project[]>>

beforeEach(() => {
  mockApi.getProjects.mockResolvedValue([
    { id: "1", title: "DevLink", tags: ["react"], featured: true, url: null, repoUrl: null },
  ]);
});

test("renders projects", async () => {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <ProjectList userId="user-1" />
    </QueryClientProvider>
  );

  expect(await screen.findByText("DevLink")).toBeInTheDocument();
  expect(mockApi.getProjects).toHaveBeenCalledWith("user-1");
});
```

---

## 20.5 Testing Custom Hooks with `renderHook`

```tsx
import { renderHook, act } from "@testing-library/react";
import { useToggle } from "@/hooks/useToggle";

test("useToggle starts off", () => {
  const { result } = renderHook(() => useToggle());
  expect(result.current.isOn).toBe(false);
});

test("toggle switches state", () => {
  const { result } = renderHook(() => useToggle(false));

  act(() => {
    result.current.toggle();
  });

  expect(result.current.isOn).toBe(true);
});

test("setOn forces true", () => {
  const { result } = renderHook(() => useToggle(false));

  act(() => result.current.setOn());
  expect(result.current.isOn).toBe(true);

  act(() => result.current.setOn()); // idempotent
  expect(result.current.isOn).toBe(true);
});
```

---

## 20.6 Testing Generic Components

For generic components, provide a concrete type when rendering:

```tsx
import { DataTable } from "@/components/DataTable";
import type { Column } from "@/components/DataTable";

const columns: Column<Project>[] = [
  { key: "title", header: "Title", render: (p) => p.title },
  { key: "tags",  header: "Tags",  render: (p) => p.tags.join(", ") },
];

const projects: Project[] = [
  { id: "1", title: "DevLink", tags: ["react", "ts"], featured: true, url: null, repoUrl: null },
];

test("renders column headers", () => {
  render(<DataTable<Project> data={projects} columns={columns} />);

  expect(screen.getByText("Title")).toBeInTheDocument();
  expect(screen.getByText("Tags")).toBeInTheDocument();
});

test("renders empty state", () => {
  render(<DataTable<Project> data={[]} columns={columns} emptyMessage="No projects yet" />);
  expect(screen.getByText("No projects yet")).toBeInTheDocument();
});
```

---

## 20.7 Type-Level Tests with `expectTypeOf`

Vitest exposes `expectTypeOf` for asserting types at compile time:

```typescript
import { expectTypeOf } from "vitest";
import { useToggle } from "@/hooks/useToggle";
import { renderHook } from "@testing-library/react";

test("useToggle return type", () => {
  const { result } = renderHook(() => useToggle());

  expectTypeOf(result.current.isOn).toBeBoolean();
  expectTypeOf(result.current.toggle).toEqualTypeOf<() => void>();
  expectTypeOf(result.current.setOn).toEqualTypeOf<() => void>();
});
```

---

## 20.8 Wrapping in Providers

Create a typed `renderWithProviders` helper:

```tsx
// src/test/renderWithProviders.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import type { RenderOptions } from "@testing-library/react";

interface RenderWithProvidersOptions extends RenderOptions {
  initialPath?: string;
}

export function renderWithProviders(
  ui: React.ReactElement,
  { initialPath = "/", ...options }: RenderWithProvidersOptions = {}
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[initialPath]}>
          {children}
        </MemoryRouter>
      </QueryClientProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...options });
}
```

---

## Key Takeaways

| Pattern | Rule |
|---------|------|
| `vi.fn<Args, Return>` | Always type mock functions — prevents wrong argument assertions |
| `vi.mocked(module, true)` | Deep mock typing — all methods become `Mock<...>` |
| `getByRole<T>` | Narrow the element type when you need typed DOM properties |
| `renderHook` | Test hooks in isolation — wrap state updates in `act` |
| Generic components | Provide concrete type arg (`DataTable<Project>`) in tests |
| `renderWithProviders` | Centralise provider setup — keeps tests DRY |
