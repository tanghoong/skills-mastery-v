# Chapter 27 — Capstone: DevLink

## What You're Building

DevLink is your **typed developer portfolio builder** — built across all 27 chapters, deployed to Vercel, and reviewed against the Codex checklist. By this point every piece exists; this chapter assembles them.

---

## Architecture Recap

```
devlink/
├── apps/
│   └── web/                     ← Next.js 15 App Router
│       ├── app/
│       │   ├── [username]/      ← Public profile (Server Component)
│       │   ├── admin/           ← Protected dashboard (Client Components)
│       │   ├── login/           ← Auth page
│       │   └── actions/         ← Server Actions (typed, Zod-validated)
│       ├── src/
│       │   ├── components/      ← UI library (Button, Card, Avatar, Badge...)
│       │   ├── features/        ← Feature modules (profile, projects, links, ai)
│       │   ├── hooks/           ← Custom hooks (useAuth, useProfile...)
│       │   ├── lib/             ← trpc, queryClient, env, cn
│       │   └── stores/          ← Zustand (auth, ui)
├── packages/
│   ├── api/                     ← tRPC router + Zod schemas
│   ├── db/                      ← Prisma schema + client
│   └── types/                   ← Branded types, shared interfaces
└── .github/workflows/ci.yml
```

---

## Build Order (Recommended)

### Week 1 — Foundation
1. Scaffold Next.js 15 with strict tsconfig
2. Set up Prisma schema + local PostgreSQL
3. Set up tRPC router with `profile`, `projects`, `links` procedures
4. Implement NextAuth.js with email/password
5. Build the component library: `Button`, `Card`, `Avatar`, `Badge`, `Input`

### Week 2 — Public Profile
6. `/:username` — Server Component reading from DB directly
7. `generateMetadata` — OG tags for sharing
8. Framer Motion: stagger animation for project grid
9. `ProfileCard`, `ProjectGrid`, `SocialLinks` components with full a11y
10. Deploy to Vercel — first live URL

### Week 3 — Admin Dashboard
11. `AdminGuard` — redirect to `/login` if no session
12. Profile editor with RHF + Zod + Server Action
13. Projects CRUD: `DataTable<Project>`, add/edit/delete
14. Links manager: `MultiSelect<Platform>`, drag-to-reorder
15. Zustand UI store: sidebar open/close, active section

### Week 4 — AI + Polish
16. AI bio generator: streaming via Anthropic SDK + `useOptimistic`
17. Framer Motion: page transitions on route change
18. Dark mode: Zustand `ThemeStore` + Tailwind dark variant
19. Storybook stories for all 8+ components
20. Vitest: >70% test coverage

---

## AI Bio Generator (The Signature Feature)

```tsx
// features/ai/AIBioGenerator.tsx
"use client";

import { useOptimistic, useTransition } from "react";
import { generateBioAction } from "@/app/actions/ai";

interface AIBioGeneratorProps {
  currentBio: string;
  profile: Profile;
  onBioAccepted: (bio: string) => void;
}

export function AIBioGenerator({ currentBio, profile, onBioAccepted }: AIBioGeneratorProps) {
  const [optimisticBio, setOptimisticBio] = useOptimistic<string, string>(
    currentBio,
    (_, newBio) => newBio
  );
  const [isPending, startTransition] = useTransition();
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedBio, setStreamedBio] = useState("");

  const generate = () => {
    startTransition(async () => {
      setIsStreaming(true);
      setStreamedBio("");

      const stream = await generateBioAction({
        name:     profile.name,
        projects: profile.projects.map((p) => p.title),
        links:    profile.links.map((l) => l.platform),
      });

      let fullBio = "";
      for await (const chunk of stream) {
        fullBio += chunk;
        setStreamedBio(fullBio);
      }

      setIsStreaming(false);
      setOptimisticBio(fullBio);
    });
  };

  const displayBio = isStreaming ? streamedBio : optimisticBio;

  return (
    <div>
      <div className="rounded-lg border p-4 min-h-[100px]">
        {displayBio || <span className="text-gray-400">Your bio will appear here…</span>}
        {isStreaming && <span className="animate-pulse">▋</span>}
      </div>

      <div className="mt-3 flex gap-2">
        <Button onClick={generate} isLoading={isPending} variant="secondary">
          ✨ Generate with AI
        </Button>
        {optimisticBio && optimisticBio !== currentBio && (
          <Button onClick={() => onBioAccepted(optimisticBio)} variant="primary">
            Use This Bio
          </Button>
        )}
      </div>
    </div>
  );
}
```

---

## Codex Review Checklist

Before you call this course complete, every item must pass:

### Types
- [ ] `grep -rn ': any' src/` returns 0 results
- [ ] `grep -rn 'as any' src/` returns 0 results
- [ ] `tsc --noEmit` exits 0 with zero errors
- [ ] All event handlers typed — no `(e: any)` patterns

### Forms & Validation
- [ ] Every form uses a Zod schema
- [ ] Every Server Action validates input with Zod before DB access
- [ ] `fieldErrors` are mapped back to form fields on validation failure

### Auth & Security
- [ ] `/admin/*` redirects to `/login` without a session
- [ ] Server Actions verify `session.user.id` before mutations
- [ ] No client-side auth bypass (server validates, not just the guard)

### Performance
- [ ] `React.memo` used on `ProjectCard`, `LinkRow`, `DataTable` row component
- [ ] `useCallback` used for handlers passed to memoized components
- [ ] `React.lazy` used for admin routes — not loaded on the public profile page

### Testing
- [ ] `vitest run` passes — 0 failures
- [ ] Test coverage ≥ 70% across components and hooks
- [ ] Generic components tested with concrete type arguments

### Accessibility
- [ ] All form inputs have associated `<label>` elements
- [ ] All interactive elements are keyboard-accessible
- [ ] Storybook a11y addon shows 0 violations on core components

### Deployment
- [ ] Vercel preview deploy is live and accessible
- [ ] Production deploy succeeds with correct env vars
- [ ] `VITE_ANTHROPIC_KEY` is marked sensitive in Vercel dashboard
- [ ] OG tags render correctly when sharing a `/username` URL

---

## Graduation

When every box above is checked:

1. Share your DevLink URL: `devlink.vercel.app/yourusername`
2. Share your GitHub repo URL
3. Run `/review` in Claude Code on the main branch

You've built a production-grade, fully typed React application from scratch. Every pattern in this course is in this codebase — and it's live.
