# Chapter 10: Modules & tsconfig.json (Hour 10)

Understanding how TypeScript organises code across files and how to configure the compiler is essential for any real project.

## 1. ES Modules in TypeScript

TypeScript uses the same `import` / `export` syntax as modern JavaScript.

```typescript
// math.ts — named exports
export function add(a: number, b: number): number {
    return a + b;
}

export const PI = 3.14159;

// Default export (one per file)
export default function multiply(a: number, b: number): number {
    return a * b;
}
```

```typescript
// main.ts — importing
import multiply, { add, PI } from "./math"; // default + named
import * as Math from "./math";              // namespace import

console.log(add(1, 2));       // 3
console.log(Math.PI);         // 3.14159
console.log(multiply(3, 4));  // 12
```

## 2. Exporting Types

Types and interfaces can be exported and imported just like values.

```typescript
// types.ts
export interface User {
    id: number;
    name: string;
}

export type ID = string | number;
```

```typescript
// service.ts
import type { User, ID } from "./types"; // `import type` is tree-shaken at compile time

function getUser(id: ID): User {
    return { id: 1, name: "Alice" };
}
```

> **Best practice:** Use `import type` when importing only types — it signals intent and ensures zero runtime cost.

## 3. The tsconfig.json File

`tsconfig.json` is the configuration file for the TypeScript compiler (`tsc`). Every real project needs one.

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## 4. Key Compiler Options Explained

| Option | What it does |
|--------|-------------|
| `target` | Which JS version to compile to (`ES5`, `ES2020`, `ESNext`) |
| `module` | Module system to emit (`CommonJS` for Node, `ESNext` for bundlers) |
| `strict` | Enables all strict checks — **always turn this on** |
| `outDir` | Where compiled `.js` files go |
| `rootDir` | Root of your TypeScript source files |
| `esModuleInterop` | Allows `import x from "x"` for CommonJS modules |
| `skipLibCheck` | Skips type checking `.d.ts` files (speeds up build) |
| `noImplicitAny` | Errors when a type is inferred as `any` (included in `strict`) |
| `strictNullChecks` | `null`/`undefined` are not assignable to other types (included in `strict`) |

## 5. Path Aliases

Avoid deep relative imports (`../../../utils`) by setting up path aliases.

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@utils/*": ["src/utils/*"],
      "@models/*": ["src/models/*"]
    }
  }
}
```

```typescript
// Before — ugly relative path
import { formatDate } from "../../../utils/date";

// After — clean alias
import { formatDate } from "@utils/date";
```

> **Note:** Path aliases in `tsconfig.json` only affect type resolution. If you use a bundler (Vite, Webpack), you also need to configure the alias there.

## 6. Project References (Monorepos)

For large codebases split into multiple packages, project references let each package have its own `tsconfig.json` while sharing type information.

```
my-monorepo/
├── packages/
│   ├── core/        tsconfig.json
│   └── app/         tsconfig.json
└── tsconfig.json    (root)
```

```json
// packages/app/tsconfig.json
{
  "compilerOptions": { "composite": true },
  "references": [{ "path": "../core" }]
}
```

Run `tsc --build` to compile all packages in the correct dependency order.

## 7. Useful `tsc` CLI Commands

```bash
tsc               # Compile using nearest tsconfig.json
tsc --watch       # Watch mode — recompile on every save
tsc --noEmit      # Type-check only, do not output files (great for CI)
tsc --build       # Build with project references
tsc --init        # Generate a default tsconfig.json
```

## Action Item for Hour 10:

- Create a small two-file project: `src/utils.ts` (exports a typed helper function) and `src/index.ts` (imports and uses it).
- Write a `tsconfig.json` with `strict: true`, `outDir: "dist"`, and a path alias `@utils` pointing to `src/utils.ts`.
- Run `tsc --noEmit` to verify there are no type errors.
