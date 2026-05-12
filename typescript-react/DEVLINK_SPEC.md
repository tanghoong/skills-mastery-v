# DevLink — Capstone Project Specification

## What Is DevLink?

DevLink is a **typed developer portfolio builder** — a personal site where a developer can:

- Present their profile, skills, projects, and social links (public-facing)
- Manage all content through an admin dashboard (auth-protected)
- Generate an AI-powered bio using the Anthropic SDK (streaming)
- Share a single shareable `devlink.app/username` URL

Think: Linktree × GitHub profile × personal portfolio — built entirely with TypeScript-strict React + tRPC + Next.js.

---

## Architecture

```
devlink/
├── apps/
│   └── web/                  ← Next.js 15 (App Router) — public + admin
├── packages/
│   ├── api/                  ← tRPC router (procedures + Zod schemas)
│   ├── db/                   ← Prisma schema + typed client
│   └── types/                ← Shared branded types, shared interfaces
├── tests/
│   └── ...                   ← Vitest + Testing Library
├── .github/
│   └── workflows/ci.yml      ← tsc --noEmit + tests on every PR
└── vercel.json
```

---

## Data Model

```typescript
// packages/types/src/index.ts

type UserId   = string & { readonly __brand: "UserId" };
type ProjectId = string & { readonly __brand: "ProjectId" };
type LinkId   = string & { readonly __brand: "LinkId" };

interface Profile {
  id:        UserId;
  username:  string;
  name:      string;
  bio:       string;
  avatarUrl: string | null;
  location:  string | null;
  createdAt: Date;
}

interface Project {
  id:          ProjectId;
  userId:      UserId;
  title:       string;
  description: string;
  url:         string | null;
  repoUrl:     string | null;
  tags:        string[];
  featured:    boolean;
  order:       number;
}

interface SocialLink {
  id:       LinkId;
  userId:   UserId;
  platform: "github" | "twitter" | "linkedin" | "website" | "youtube" | "other";
  url:      string;
  label:    string;
  order:    number;
}
```

---

## Pages

| Route | Description | Auth |
|-------|-------------|------|
| `/` | Landing / hero | Public |
| `/:username` | Public profile page | Public |
| `/admin` | Dashboard (redirect if not logged in) | Protected |
| `/admin/profile` | Edit profile + AI bio generator | Protected |
| `/admin/projects` | CRUD projects | Protected |
| `/admin/links` | CRUD social links | Protected |
| `/admin/settings` | Account settings | Protected |
| `/login` | Email + password login | Public |

---

## Key Features Built Per Phase

### Phase 1 (Ch 1–6): Profile Card Kit
- `<Avatar />`, `<Badge />`, `<Button variant="...">`, `<Card />`
- All typed with strict props, `forwardRef`, polymorphic `as`

### Phase 2 (Ch 7–15): DataDash Checkpoint
- Admin dashboard shell with Zustand auth store
- Project CRUD table powered by TanStack Query
- Project edit form with React Hook Form + Zod
- Route guards on `/admin/*`

### Phase 3 (Ch 16–21): Component Showcase
- Generic `<DataTable<T> />` used throughout admin
- Storybook stories for every UI component
- Full a11y: ARIA roles, keyboard nav, typed props
- Test coverage >70% across all components

### Phase 4 (Ch 22–27): Full DevLink
- Next.js App Router with Server Actions for mutations
- tRPC procedures for type-safe data fetching
- AI bio generator streaming via Anthropic SDK + `useOptimistic`
- Framer Motion page transitions
- Vercel deployment with typed env vars
- GitHub Actions CI: `tsc --noEmit` + tests must pass

---

## Codex Review Checklist (Graduation Criteria)

Before the course is complete, DevLink must pass all of the following:

- [ ] Zero `any` — run `grep -r ': any' src/` returns nothing
- [ ] All event handlers typed — no `(e: any)` patterns
- [ ] All API responses typed — no untyped `fetch().then(res => res.json())`
- [ ] All forms use Zod schemas — no unvalidated user input
- [ ] Route guards enforce auth — direct `/admin` URL without session redirects to `/login`
- [ ] `tsc --noEmit` exits 0
- [ ] All tests pass (`vitest run`)
- [ ] Storybook builds without errors
- [ ] Vercel preview deploy succeeds
- [ ] AI bio generator streams correctly without type errors

---

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5.x strict mode |
| Styling | Tailwind CSS + shadcn/ui + `cva` |
| State | Zustand (client), TanStack Query (server state) |
| Forms | React Hook Form + Zod |
| API | tRPC v11 |
| Database | Prisma + PostgreSQL |
| Auth | NextAuth.js v5 |
| AI | Anthropic SDK (streaming) |
| Animation | Framer Motion |
| Testing | Vitest + Testing Library |
| Storybook | Storybook 8 |
| Deployment | Vercel |
| CI | GitHub Actions |