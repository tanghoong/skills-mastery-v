# Chapter 1 — Setup & Tooling

## Learning Objectives

By the end of this chapter you will be able to:
- Bootstrap a Vite + React + TypeScript project with `strict: true`
- Understand what every key `tsconfig.json` option does in a React context
- Type `import.meta.env` with `vite-env.d.ts`
- Run the DevLink project locally with a fast dev loop

---

## 1.1 Why TypeScript Strict Mode in React

React ships with community types via `@types/react`. Without `strict: true`, TypeScript lets you skip null checks on refs, use implicit `any` in event handlers, and ignore undefined context values — all common runtime crash sources.

`strict: true` enables:
- `strictNullChecks` — `ref.current` could be `null`, you must check
- `noImplicitAny` — all event handler params need explicit types
- `strictFunctionTypes` — component prop callback types are checked
- `useUnknownInCatchVariables` — `catch (e)` gives `unknown`, not `any`

---

## 1.2 Scaffold the Project

```bash
npm create vite@latest devlink -- --template react-ts
cd devlink
npm install
npm run dev
```

Vite generates a project that already includes:
- `tsconfig.json` and `tsconfig.node.json`
- `src/vite-env.d.ts` — triples-slash reference for Vite's client types
- `@types/react` and `@types/react-dom`

---

## 1.3 tsconfig.json for React

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "skipLibCheck": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

Key decisions:
- `"jsx": "react-jsx"` — uses the new JSX transform, no `import React` needed
- `"moduleResolution": "Bundler"` — correct for Vite, allows `.ts` extension imports
- `"noEmit": true` — Vite handles compilation, TypeScript is type-check only
- `"noUnusedLocals"` + `"noUnusedParameters"` — prevents dead code accumulating

---

## 1.4 Typing Environment Variables

Vite exposes env vars via `import.meta.env`. Without typing, all values are `string | undefined`.

```typescript
// src/vite-env.d.ts — extend the built-in ImportMetaEnv
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_ANTHROPIC_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

Now `import.meta.env.VITE_API_URL` is typed as `string` — no more `string | undefined` for required vars.

---

## 1.5 Project Structure

```
devlink/
├── public/
├── src/
│   ├── components/       ← Reusable UI (Button, Card, Avatar...)
│   ├── features/         ← Feature-scoped components (admin/, profile/)
│   ├── hooks/            ← Custom hooks (useAuth, useProfile...)
│   ├── lib/              ← Utilities (cn, api client, trpc...)
│   ├── stores/           ← Zustand stores
│   ├── types/            ← Shared TypeScript types
│   ├── App.tsx
│   ├── main.tsx
│   └── vite-env.d.ts
├── tsconfig.json
├── vite.config.ts
└── package.json
```

---

## 1.6 Typing vite.config.ts

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

`defineConfig` provides full type inference on the config object — no need to annotate it manually.

---

## 1.7 First Typed Component

```tsx
// src/App.tsx
interface AppProps {
  title?: string;
}

function App({ title = "DevLink" }: AppProps) {
  return (
    <main>
      <h1>{title}</h1>
    </main>
  );
}

export default App;
```

Notice: `FC<AppProps>` is intentionally avoided. The function declaration form is preferred throughout this course because:
- Return type is inferred correctly (including `null`)
- No implicit `children` prop added by `FC`
- Easier to read and refactor

---

## Key Takeaways

| Concept | What to Remember |
|---------|-----------------|
| `strict: true` | Non-negotiable — enables the checks that prevent runtime crashes |
| `"jsx": "react-jsx"` | New transform — no `import React` needed in every file |
| `vite-env.d.ts` | Extend `ImportMetaEnv` to type all `VITE_` variables |
| `noEmit: true` | TypeScript is type-checker, Vite is compiler |
| Function over `FC<>` | Prefer `function Foo(props: Props)` over `const Foo: FC<Props>` |