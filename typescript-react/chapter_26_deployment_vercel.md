# Chapter 26 — Deployment: Vercel + CI

## Learning Objectives

By the end of this chapter you will be able to:
- Configure Vercel deployment for a Vite + React or Next.js project
- Set up a GitHub Actions workflow that runs `tsc --noEmit` and tests
- Manage typed environment variables in Vercel's dashboard
- Use preview deployments for PR reviews

---

## 26.1 Vite + React on Vercel

Vercel auto-detects Vite projects. For manual setup:

```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

The `rewrites` rule is critical for SPAs — without it, direct URL access to `/admin/profile` returns a 404.

---

## 26.2 Next.js on Vercel

Next.js requires no `vercel.json` — Vercel auto-configures everything. For monorepos:

```json
// vercel.json
{
  "buildCommand": "cd ../.. && npx turbo build --filter=web",
  "outputDirectory": "apps/web/.next",
  "framework": "nextjs",
  "installCommand": "npm install"
}
```

---

## 26.3 `package.json` Scripts

```json
{
  "scripts": {
    "dev":       "vite",
    "build":     "tsc --noEmit && vite build",
    "preview":   "vite preview",
    "typecheck": "tsc --noEmit",
    "test":      "vitest run",
    "test:ui":   "vitest --ui",
    "lint":      "eslint src --ext .ts,.tsx",
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build"
  }
}
```

`"build": "tsc --noEmit && vite build"` — TypeScript errors fail the build. Vite alone doesn't type-check.

---

## 26.4 GitHub Actions CI

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  typecheck-and-test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npm run typecheck

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build
        env:
          VITE_API_URL: ${{ secrets.VITE_API_URL }}
          VITE_APP_NAME: DevLink
          VITE_ENABLE_AI_BIO: "false"
```

---

## 26.5 Typed Environment Variables on Vercel

Set variables in **Vercel Dashboard → Project → Settings → Environment Variables**:

| Variable | Environment | Value |
|----------|-------------|-------|
| `VITE_API_URL` | Production | `https://api.devlink.app` |
| `VITE_API_URL` | Preview | `https://api-preview.devlink.app` |
| `VITE_API_URL` | Development | `http://localhost:3001` |
| `VITE_ANTHROPIC_KEY` | Production | `sk-ant-...` (mark as Sensitive) |
| `VITE_ENABLE_AI_BIO` | Production | `true` |
| `VITE_ENABLE_AI_BIO` | Preview | `true` |
| `VITE_ENABLE_AI_BIO` | Development | `false` |

Vercel injects these at build time. The Zod env validator in `src/lib/env.ts` catches missing vars immediately when the app loads.

---

## 26.6 Preview Deployments

Every PR on a Vercel project gets a unique preview URL. Use this pattern in `vercel.json` to route preview deploys to a staging API:

```json
{
  "env": {
    "VITE_API_URL": {
      "value": "https://api-staging.devlink.app"
    }
  }
}
```

Or override per-branch via Vercel's environment variable targeting.

---

## 26.7 Pre-Merge Checklist (Typed Review)

Before merging to `main`, every PR must pass:

```bash
# 1. No TypeScript errors
npm run typecheck

# 2. No failing tests
npm test

# 3. No lint errors
npm run lint

# 4. Build succeeds
npm run build

# 5. No `any` in source
grep -r ': any' src/
grep -r 'as any' src/

# 6. All forms use Zod schemas
# Manual check: search for unvalidated input usage

# 7. Preview deploy accessible
# Check Vercel dashboard for the PR's preview URL
```

Items 1–4 are automated by GitHub Actions. Items 5–7 are the Codex review checklist.

---

## 26.8 Deployment Checklist (First Production Deploy)

- [ ] `VITE_API_URL` set for production
- [ ] `VITE_ANTHROPIC_KEY` set as sensitive for production
- [ ] `VITE_ENABLE_AI_BIO=true` for production
- [ ] `vercel.json` rewrite rule in place (Vite SPA)
- [ ] Custom domain added in Vercel
- [ ] `CORS` configured on API to allow production domain
- [ ] Database connection string set in API service
- [ ] GitHub Actions passes on `main` branch

---

## Key Takeaways

| Pattern | Rule |
|---------|------|
| Build script | `"build": "tsc --noEmit && vite build"` — type errors fail the deploy |
| CI | Run typecheck, tests, and build on every PR |
| Env vars in Vercel | Set per environment (production/preview/dev) — never commit secrets |
| SPA rewrites | `vercel.json` must rewrite all paths to `index.html` |
| Preview deploys | Every PR gets a unique URL — use for manual QA before merge |
| `grep ': any'` | Run before every production deploy — zero `any` is the bar |
