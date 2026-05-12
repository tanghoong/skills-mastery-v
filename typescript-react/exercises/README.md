# TypeScript React — Exercises

## Progress Tracker

| Chapter | Topic | Status |
|---------|-------|--------|
| 01 | Setup & Tooling | ⬜ Not started |
| 02 | Component Typing | ⬜ Not started |
| 03 | Hooks: State, Refs & Effects | ⬜ Not started |
| 04 | Events & Forms | ⬜ Not started |
| 05 | Context & Providers | ⬜ Not started |
| 06 | Component Patterns | ⬜ Not started |
| 07 | Custom Hooks | ⬜ Not started |
| 08 | Data Fetching — TanStack Query | ⬜ Not started |
| 09 | Forms — React Hook Form + Zod | ⬜ Not started |
| 10 | Routing & Guards | ⬜ Not started |
| 11 | State Management — Zustand | ⬜ Not started |
| 12 | Styling with TypeScript | ⬜ Not started |
| 13 | Component Libraries — Radix | ⬜ Not started |
| 14 | Error Boundaries & Suspense | ⬜ Not started |
| 15 | Compound Components | ⬜ Not started |
| 16 | Type Guards & Narrowing | ⬜ Not started |
| 17 | Advanced Generic Components | ⬜ Not started |
| 18 | React 19 New Hooks | ⬜ Not started |
| 19 | Performance Typing | ⬜ Not started |
| 20 | Testing React | ⬜ Not started |
| 21 | Accessibility & Storybook | ⬜ Not started |
| 22 | Typed Environment Variables | ⬜ Not started |
| 23 | Next.js App Router | ⬜ Not started |
| 24 | tRPC + React | ⬜ Not started |
| 25 | Animations — Framer Motion | ⬜ Not started |
| 26 | Deployment — Vercel + CI | ⬜ Not started |
| 27 | Capstone: DevLink | ⬜ Not started |

Update each row to ✅ when you've completed the exercise and had it reviewed.

---

## Running Exercises

### Type-only exercises (Ch 1–4, 7, 11, 22, 24)
```bash
# Type-check without running
npx tsc --noEmit --strict exercises/chapter_01.tsx

# Some exercises have runnable verification sections
tsx exercises/chapter_01.tsx
```

### JSX exercises (Ch 2, 4–6, 8–21, 23, 25)
These must be run inside a Vite dev server:
```bash
# Create a sandbox project once
npm create vite@latest sandbox -- --template react-ts
cd sandbox && npm install

# Copy an exercise into src/App.tsx, then:
npm run dev
```

---

## Review Workflow

When you're ready to have an exercise reviewed, say:

> "Review my chapter N exercise"

Claude will check:
1. **Correctness** — all TODOs implemented as specified
2. **Type safety** — no `any`, no `as` assertions where unnecessary
3. **Style** — idiomatic TypeScript + React patterns
4. **Improvements** — tighter types or better patterns from the chapter

---

## Phase Checkpoints

After completing Phase 1 (Ch 1–6), build the **Profile Card Kit** before moving to Phase 2.
After completing Phase 2 (Ch 7–15), build the **DataDash** mini-project.
After completing Phase 3 (Ch 16–21), build the **Component Showcase** with Storybook.
After all chapters, build and deploy **DevLink**.

See [DEVLINK_SPEC.md](../DEVLINK_SPEC.md) for the full capstone spec.
