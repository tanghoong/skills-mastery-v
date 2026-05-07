// ============================================================
// Chapter 22 — tRPC
// Setup: npm install @trpc/server @trpc/client @trpc/react-query
//        @tanstack/react-query zod
// Build inside a Next.js project (ch19 or a new one).
// ============================================================

// ----------------------------------------------------------------
// Exercise 1: Define the tRPC base
// Create: server/trpc.ts
//   - Initialise tRPC with initTRPC.create()
//   - Export: router, procedure
//   - Export: protectedProcedure — middleware that checks
//     a ctx.userId field and throws UNAUTHORIZED if missing
// ----------------------------------------------------------------

// TODO: create server/trpc.ts


// ----------------------------------------------------------------
// Exercise 2: Notes router
// Create: server/routers/notes.ts
// A "note" has: { id: number; title: string; content: string; createdAt: Date }
// Store notes in-memory (a module-level array is fine for this exercise).
//
// Procedures:
//   getAll   — query, returns Note[]
//   getById  — query, input: { id: number }, returns Note or throws NOT_FOUND
//   create   — protectedProcedure mutation
//              input: { title: z.string().min(1), content: z.string() }
//              returns the created Note
//   update   — protectedProcedure mutation
//              input: { id: number, title?: string, content?: string }
//              throws NOT_FOUND if missing, returns updated Note
//   delete   — protectedProcedure mutation
//              input: { id: number }, returns { success: true }
// ----------------------------------------------------------------

// TODO: create server/routers/notes.ts


// ----------------------------------------------------------------
// Exercise 3: Root router & API handler
// Create: server/routers/_app.ts — combine the notes router
// Create: app/api/trpc/[trpc]/route.ts — the Next.js API handler
// Export AppRouter type from _app.ts
// ----------------------------------------------------------------

// TODO: create both files


// ----------------------------------------------------------------
// Exercise 4: Client setup & React components
// Create: lib/trpc.ts — createTRPCReact<AppRouter>()
// Create: app/providers.tsx — wrap QueryClientProvider + trpc.Provider
//
// Then build:
//   NotesList component  — uses trpc.notes.getAll.useQuery()
//   CreateNoteForm       — uses trpc.notes.create.useMutation()
//                          invalidates getAll on success
// ----------------------------------------------------------------

// TODO: create lib/trpc.ts, app/providers.tsx, and the two components


// ----------------------------------------------------------------
// Exercise 5: Input validation errors in the UI
// tRPC automatically returns validation errors from Zod.
// Update CreateNoteForm to:
//   - Show the Zod validation message if title is empty
//   - Show a "Not authorised" message if the protectedProcedure rejects
//   - Disable the submit button while mutation is pending
// ----------------------------------------------------------------

// TODO: update CreateNoteForm with error handling

// Hint: the mutation error is typed — check error.data?.zodError for field errors
