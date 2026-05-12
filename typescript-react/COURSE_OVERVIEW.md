# TypeScript React Mastery — Course Overview

## Mission

Build **production-grade React applications** using TypeScript strict mode — from zero to a live deployed portfolio app that passes a typed code review. Every chapter is grounded in real patterns used in professional React codebases.

Every chapter feeds directly into the **DevLink** capstone: a typed developer portfolio builder with an admin dashboard, AI bio generator, and Vercel deployment.

---

## Final Goals

| Goal | Definition of Done |
|------|--------------------|
| **Live deployment** | DevLink running on Vercel with tRPC API, accessible via public URL |
| **Pass typed review** | Zero `any`, all props typed, forms validated end-to-end, route guards enforced, >70% test coverage, `tsc --noEmit` green in CI |

---

## Phase Checkpoints (Mini-Projects)

| Checkpoint | After Ch | Build |
|------------|----------|-------|
| **Profile Card Kit** | 6 | Typed component library: `Avatar`, `Badge`, `Button`, `Card` — strict props, `forwardRef`, polymorphic `as` |
| **DataDash** | 15 | Mini dashboard: form (RHF+Zod), data table (TanStack Query), route guards, Zustand auth store |
| **Component Showcase** | 21 | Storybook stories for all Phase 3 components + full test coverage + a11y audit |
| **DevLink Capstone** | 27 | Full portfolio app: Vercel deploy, AI bio generator, tRPC API, Codex review |

---

## Curriculum Map

### Phase 1 — React + TypeScript Foundations (Ch 1–6)

| # | Chapter | Key Skill |
|---|---------|-----------|
| 1 | Setup & Tooling | Vite + React + strict tsconfig, `@types/react`, `vite-env.d.ts`, dev loop |
| 2 | Component Typing | Props interfaces, `FC` vs function syntax, `ReactNode` vs `ReactElement`, `children` |
| 3 | Hooks — State, Refs & Effects | `useState<T>`, `useRef<T>`, `useReducer<S,A>`, `useEffect` cleanup + typed deps |
| 4 | Events & Forms | `ChangeEvent`, `FormEvent`, `MouseEvent`, controlled inputs, typed submit |
| 5 | Context & Providers | `createContext<T>`, avoiding `undefined`, typed theme + auth context |
| 6 | Component Patterns | `forwardRef<T,P>`, `useImperativeHandle`, generic components, polymorphic `as` |

### Phase 2 — Real-World Patterns (Ch 7–15)

| # | Chapter | Key Skill |
|---|---------|-----------|
| 7  | Custom Hooks | Typed return values, generics in hooks, `useCallback<T>`, `useMemo<T>` |
| 8  | Data Fetching — TanStack Query | `useQuery<TData,TError>`, `useMutation`, `QueryClient`, typed API layer |
| 9  | Forms — React Hook Form + Zod | `zodResolver`, `useForm<z.infer<T>>`, typed validation errors |
| 10 | Routing & Guards | React Router v6, typed `useParams`, `useNavigate`, typed auth guards |
| 11 | State Management — Zustand | `create<State>()`, typed slices, `StoreApi<T>`, selector typing |
| 12 | Styling with TypeScript | `cva`, Tailwind + typed class names, `cn()`, `VariantProps<T>` |
| 13 | Component Libraries — Radix + shadcn | Typed primitives, `ComponentPropsWithoutRef`, extending component props |
| 14 | Error Boundaries & Suspense | Typed `ErrorBoundary`, `React.lazy<T>`, `Suspense`, `react-error-boundary` |
| 15 | Compound Components | Context + composition, typed sub-components, slot pattern |

### Phase 3 — Advanced TypeScript in React (Ch 16–21)

| # | Chapter | Key Skill |
|---|---------|-----------|
| 16 | Type Guards & Narrowing in React | Discriminated union props, `is` predicates in render, API response narrowing |
| 17 | Advanced Generic Components | Typed `Table<T>`, `Select<T>`, `List<T>`, constrained generics |
| 18 | React 19 New Hooks | `useOptimistic<T>`, `useActionState`, `useFormStatus`, `use(promise)` |
| 19 | Performance Typing | `React.memo<T>`, typed `useMemo`/`useCallback`, `React.Profiler` API |
| 20 | Testing React | Testing Library typed queries, mocking hooks, `vi.fn<T>`, generic component tests |
| 21 | Accessibility & Storybook | ARIA typed props, `Meta<typeof Component>`, `StoryObj<T>`, typed args |

### Phase 4 — Ecosystem & Production (Ch 22–27)

| # | Chapter | Key Skill |
|---|---------|-----------|
| 22 | Typed Environment Variables | `import.meta.env`, `vite-env.d.ts` augmentation, Zod env schema on client |
| 23 | Next.js App Router | Server/Client components, typed `params`/`searchParams`, Server Actions |
| 24 | tRPC + React | `createTRPCReact`, typed `useQuery`/`useMutation`, `inferRouterInputs` |
| 25 | Animations — Framer Motion | `Variants` type, `motion` components, `AnimatePresence`, `MotionValue<T>` |
| 26 | Deployment — Vercel + CI | `tsc --noEmit` in CI, GitHub Actions, env var management, preview deploys |
| 27 | Capstone: DevLink | Full build + Vercel deploy, AI bio generator, Codex review checklist |

---

## Running Exercises

```bash
# Install dependencies
npm install -g tsx typescript

# Type-check an exercise (recommended first step)
npx tsc --noEmit --strict exercises/chapter_01.tsx

# Run a non-JSX exercise directly
tsx exercises/chapter_01.tsx

# For JSX exercises, scaffold a Vite app and copy the exercise in
npm create vite@latest devlink-sandbox -- --template react-ts
```

## Vite + React Local Dev (start here in Ch 1)

```bash
npm create vite@latest devlink -- --template react-ts
cd devlink
npm install
npm run dev
```

---

## TypeScript Conventions (enforced throughout)

```typescript
// Props: always an interface, never inline
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary";
}

// Prefer function declarations over FC<>
function Button({ label, onClick, variant = "primary" }: ButtonProps) { ... }

// Use import type for type-only imports
import type { ReactNode } from "react";

// Typed event handlers — never use `any` for events
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => { ... };

// Generic components with constraints
function Select<T extends { id: string; label: string }>(props: SelectProps<T>) { ... }

// Discriminated unions for component state
type LoadState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; message: string };
```

Always use `strict: true` in `tsconfig.json`. No exceptions.