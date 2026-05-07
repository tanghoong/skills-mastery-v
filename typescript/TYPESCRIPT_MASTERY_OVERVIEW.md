# TypeScript Mastery — Complete Overview

A reference document capturing the full TypeScript curriculum, ecosystem map, portfolio project, and certification roadmap discussed and built in this learning journey.

---

## Full 25-Chapter Curriculum

### Phase 1 — Language Core (Ch. 1–8)

| Chapter | File | Topics |
|---------|------|--------|
| 1 | [chapter_1_basics.md](chapter_1_basics.md) | Primitives, type inference, `any`, `unknown`, `null`/`undefined` |
| 2 | [chapter_2_interfaces_types.md](chapter_2_interfaces_types.md) | Type aliases, interfaces, `extends`, intersection types |
| 3 | [chapter_3_functions_arrays.md](chapter_3_functions_arrays.md) | Typed functions, optional/default params, arrays, tuples |
| 4 | [chapter_4_generics.md](chapter_4_generics.md) | Generic functions, interfaces, classes, constraints |
| 5 | [chapter_5_advanced_utility.md](chapter_5_advanced_utility.md) | `Partial`, `Required`, `Readonly`, `Pick`, `Omit`, enums, type assertions |
| 6 | [chapter_6_classes_oop.md](chapter_6_classes_oop.md) | Access modifiers, constructor shorthand, inheritance, abstract classes, static |
| 7 | [chapter_7_type_narrowing.md](chapter_7_type_narrowing.md) | `typeof`, `instanceof`, discriminated unions, type guards (`is`), `never` |
| 8 | [chapter_8_mapped_conditional_types.md](chapter_8_mapped_conditional_types.md) | `keyof`, mapped types, template literals, conditional types, `infer` |

### Phase 2 — Advanced TypeScript (Ch. 9–17)

| Chapter | File | Topics |
|---------|------|--------|
| 9  | [chapter_9_async_typescript.md](chapter_9_async_typescript.md) | `Promise<T>`, `async/await`, typed fetch, `Promise.all`, error handling |
| 10 | [chapter_10_modules_tsconfig.md](chapter_10_modules_tsconfig.md) | ES modules, `import type`, `tsconfig.json`, path aliases, project references |
| 11 | [chapter_11_decorators.md](chapter_11_decorators.md) | Class/method/property decorators, decorator factories, NestJS-style patterns |
| 12 | [chapter_12_declaration_files.md](chapter_12_declaration_files.md) | `.d.ts` files, ambient declarations, module augmentation, `@types` |
| 13 | [chapter_13_advanced_generics.md](chapter_13_advanced_generics.md) | Recursive types, variadic tuples, builder pattern, `Parameters<T>`, `ReturnType<T>` |
| 14 | [chapter_14_error_handling.md](chapter_14_error_handling.md) | Custom errors, `Result<T, E>` pattern, discriminated error unions, `tryCatch` |
| 15 | [chapter_15_real_world_architecture.md](chapter_15_real_world_architecture.md) | Repository pattern, DI, branded types, `satisfies`, barrel files, strict config |
| 16 | [chapter_16_symbols_iterators_generators.md](chapter_16_symbols_iterators_generators.md) | `Symbol`, iterators, generators, infinite sequences, async generators |
| 17 | [chapter_17_structural_typing.md](chapter_17_structural_typing.md) | Duck typing, covariance/contravariance, `never`/`unknown`, `as const`, widening |

### Phase 3 — Ecosystem (Ch. 18–25)

| Chapter | File | Topics |
|---------|------|--------|
| 18 | [chapter_18_react_typescript.md](chapter_18_react_typescript.md) | Props, hooks, events, context, generic components, `forwardRef` |
| 19 | [chapter_19_nextjs.md](chapter_19_nextjs.md) | App Router, Server/Client components, API routes, Server Actions, Metadata API |
| 20 | [chapter_20_nestjs.md](chapter_20_nestjs.md) | Controllers, DTOs, Services, Modules, Guards, Pipes, `class-validator` |
| 21 | [chapter_21_prisma_database.md](chapter_21_prisma_database.md) | Schema → types, CRUD, relations, `include`/`select`, transactions |
| 22 | [chapter_22_trpc.md](chapter_22_trpc.md) | End-to-end type safety, Zod validation, protected procedures, React integration |
| 23 | [chapter_23_testing.md](chapter_23_testing.md) | Vitest, `vi.mocked`, async tests, React Testing Library, type-level tests |
| 24 | [chapter_24_react_native_expo.md](chapter_24_react_native_expo.md) | RN components, `StyleSheet`, typed navigation, Expo APIs, platform types |
| 25 | [chapter_25_ai_application_layer.md](chapter_25_ai_application_layer.md) | Anthropic SDK, streaming, tool use, Vercel AI SDK, structured output, RAG |

---

## TypeScript Ecosystem Map

### By Domain

#### Frontend
| Framework | TS Support | Notes |
|-----------|-----------|-------|
| React | Excellent | Most popular. Full hook/props/context typing |
| Next.js | Excellent | React + SSR/SSG, TypeScript by default |
| Angular | Required | Built with TS — you cannot use it without TS |
| Vue 3 | Excellent | Rewritten in TS, Composition API is TS-native |

#### Backend
| Framework | TS Support | Notes |
|-----------|-----------|-------|
| NestJS | Required | Most TS-native backend, decorator-heavy |
| Express | Good | Needs `@types/express`, most popular Node framework |
| Fastify | Excellent | Fast, schema-based, great TS inference |
| Hono | Excellent | Modern, edge-ready, TS-first |
| tRPC | Required | End-to-end type safety — no REST/GraphQL schemas needed |

#### Mobile
| Framework | Notes |
|-----------|-------|
| React Native | iOS + Android. Same React TS patterns as web |
| Expo | React Native toolkit, TS first-class, easiest entry point |

#### Database / ORM
| Tool | Notes |
|------|-------|
| Prisma | Best-in-class type safety. Schema generates all types |
| Drizzle ORM | Lightweight, SQL-like, fully typed |
| TypeORM | Decorator-based, pairs naturally with NestJS |
| Kysely | Type-safe raw query builder |

#### AI / ML
| Use Case | TypeScript? | Notes |
|----------|-------------|-------|
| Calling LLM APIs (Claude, OpenAI) | **Yes — ideal** | Official SDKs are TS-first |
| Building AI-powered web apps | **Yes — ideal** | Next.js + Vercel AI SDK is the go-to stack |
| LLM orchestration (agents, chains) | **Yes** | LangChain.js, LlamaIndex.ts |
| Running pre-trained models | **Yes** | TensorFlow.js, ONNX Runtime |
| Training ML models | **No** | Python + PyTorch dominates. TS has no equivalent |

---

## Portfolio Project — "DevLog"

### Concept
**AI-Powered Developer Journal & Skill Tracker** — A platform where developers log what they learn daily, track skills, and get AI-powered career insights.

### Why This Project
- Employers instantly understand it (built for developers, by developers)
- Every chapter maps naturally to a real feature
- Web + Mobile + AI + Backend + Database in one codebase
- Has real utility — you would actually use it yourself

### Architecture

```
devlog/
├── apps/
│   ├── web/          ← Next.js (Ch. 18, 19)
│   ├── mobile/       ← Expo React Native (Ch. 24)
│   └── api/          ← NestJS (Ch. 20)
├── packages/
│   ├── database/     ← Prisma schema + client (Ch. 21)
│   ├── trpc/         ← Shared tRPC router (Ch. 22)
│   └── types/        ← Shared interfaces & branded types
└── tests/            ← Vitest test suites (Ch. 23)
```

### Feature → Chapter Coverage

| Feature | Chapters |
|---------|----------|
| Typed Prisma schema: `User`, `Log`, `Skill`, `Tag` | Ch. 2, 21 |
| Generic skill tracker | Ch. 4, 13 |
| Abstract `BaseRepository<T>` class | Ch. 6, 13 |
| Repository + Service + Controller pattern | Ch. 15, 20 |
| Auth guard (JWT validation) | Ch. 20 |
| `Result<T, E>` error handling throughout | Ch. 14 |
| tRPC router with Zod-validated procedures | Ch. 22 |
| Next.js App Router + Server Actions | Ch. 19 |
| React components with typed hooks & context | Ch. 18 |
| Discriminated union for log entry types | Ch. 7 |
| Mapped type for auto-generated form fields | Ch. 8 |
| `DeepPartial<T>` for patch update DTOs | Ch. 13 |
| `async function*` for streaming AI responses | Ch. 16 |
| Claude AI for skill gap analysis | Ch. 25 |
| Structured AI output with Zod schema | Ch. 25 |
| `.d.ts` for legacy date utility | Ch. 12 |
| `@Log` and `@Memoize` decorators | Ch. 11 |
| `tsconfig.json` with path aliases + strict mode | Ch. 10 |
| React Native mobile companion app | Ch. 24 |
| Vitest unit + integration + component tests | Ch. 23 |
| Branded `UserId`, `as const` skill levels | Ch. 15, 17 |

### Core Features to Build

```
1. Auth          — Register / login with JWT
2. Daily Log     — Create/edit markdown log entries, tag by skill
3. Skill Tracker — Auto-extract skills from logs using Claude AI
4. AI Insights   — Weekly summary, skill gap vs target job role
5. Dashboard     — Charts of learning streak, skill progress
6. Mobile App    — Quick-log from phone, view streak
7. Public Profile — Share your learning journey
```

### Deployment Stack

| Part | Service | Free Tier |
|------|---------|-----------|
| Web (Next.js) | Vercel | Yes |
| API (NestJS) | Railway | Yes (limited) |
| Database (PostgreSQL) | Supabase | Yes |
| Mobile | Expo Go (dev) / EAS Build | Yes (dev) |

### Resume Description

```
DevLog — AI-Powered Developer Journal  |  github.com/yourname/devlog
Full-stack TypeScript monorepo: Next.js 15 · NestJS · Prisma · tRPC · Expo
- End-to-end type safety with tRPC — zero REST/GraphQL boilerplate
- Claude AI integration for skill extraction and career gap analysis
- 85%+ test coverage with Vitest; typed mocks, repository pattern
- React Native mobile companion app with typed navigation
- Deployed: web on Vercel, API on Railway, DB on Supabase
```

---

## Certifications

### Highly Respected (Industry-Recognised)

| Certification | Provider | Cost | Relevance |
|---------------|----------|------|-----------|
| **JSNAD** — Node.js Application Developer | OpenJS Foundation | ~$250 | Best TS/Node cert available |
| **JSNSD** — Node.js Services Developer | OpenJS Foundation | ~$250 | Backend/API focused |
| **AWS Certified Developer** | Amazon | ~$150 | Cloud + Node.js deployment |
| **MongoDB Certified Developer** | MongoDB University | ~$150 | Database focused |

> **JSNAD/JSNSD are the strongest formal credentials** in the Node.js/TypeScript ecosystem. Recognised by large tech companies.

### Affordable / Free

| Certification | Provider | Cost | Notes |
|---------------|----------|------|-------|
| TypeScript skill certificate | HackerRank | Free | Quick, shareable on LinkedIn |
| JavaScript Algorithms | freeCodeCamp | Free | Well-known, respected |
| Back End Development | freeCodeCamp | Free | Node.js focused |
| Meta Front-End Developer | Coursera | ~$39/mo* | Recognised Meta brand |
| IBM Full Stack Developer | Coursera | ~$39/mo* | Broad coverage |
| TypeScript track | Exercism | Free | Peer-reviewed coding exercises |

*Financial aid available on Coursera — apply to reduce cost to free.

### Recommended Timeline

```
Now       → Build DevLog project (3–4 months)
Month 1   → HackerRank TypeScript certificate (free, quick LinkedIn win)
Month 2   → freeCodeCamp JavaScript certificate (free)
Month 3   → Study for JSNAD
Month 4   → Sit JSNAD exam (~$250) ← strongest formal credential
```

---

## Key TypeScript Best Practices (Quick Reference)

```typescript
// Always use strict mode in tsconfig.json
{ "compilerOptions": { "strict": true } }

// Prefer interfaces for objects, types for unions/primitives
interface User { name: string; age: number; }
type Status = "active" | "inactive" | "pending";

// Use `import type` for type-only imports
import type { User } from "./types";

// Use `as const` to derive union types from arrays
const ROLES = ["admin", "user", "guest"] as const;
type Role = typeof ROLES[number];

// Use branded types to prevent ID mixups
type UserId  = number & { readonly __brand: "UserId" };
type OrderId = number & { readonly __brand: "OrderId" };

// Use Result<T, E> instead of throwing in business logic
type Result<T, E = Error> =
    | { success: true;  value: T }
    | { success: false; error: E };

// Use discriminated unions for complex state
type RequestState<T> =
    | { status: "idle" }
    | { status: "loading" }
    | { status: "success"; data: T }
    | { status: "error";   error: Error };
```

---

*Generated from the 25-chapter TypeScript Mastery curriculum — 2026*
