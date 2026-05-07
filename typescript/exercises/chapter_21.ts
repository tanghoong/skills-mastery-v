// ============================================================
// Chapter 21 — Prisma & Database Typing
// Setup: npm install prisma @prisma/client && npx prisma init
// Run migrations: npx prisma migrate dev --name init
// ============================================================

// ----------------------------------------------------------------
// Exercise 1: Schema design
// Write a Prisma schema (prisma/schema.prisma) for a blog platform:
//
//   User:    id, email (unique), name, createdAt
//   Post:    id, title, content (optional), published (default false),
//            authorId (FK → User), createdAt
//   Tag:     id, name (unique)
//   Post ↔ Tag: many-to-many relation
//   Comment: id, body, authorId (FK → User), postId (FK → Post), createdAt
//
// Then run: npx prisma migrate dev --name blog-schema
// ----------------------------------------------------------------

// TODO: write prisma/schema.prisma


// ----------------------------------------------------------------
// Exercise 2: Basic CRUD
// Using the generated Prisma client, write a script that:
//   a) Creates a User named "Alice" with email "alice@blog.com"
//   b) Creates 2 Posts by Alice (one published, one draft)
//   c) Creates 2 Tags: "typescript" and "webdev"
//   d) Connects both tags to the published post
//   e) Logs the published post with its tags included
// ----------------------------------------------------------------

// TODO: write exercises/ch21/seed.ts and run with: tsx exercises/ch21/seed.ts


// ----------------------------------------------------------------
// Exercise 3: Typed query results
// Using Prisma.PostGetPayload, derive the TypeScript type for:
//   a) A post with its author and tags included
//   b) A post with only id and title selected (no content)
//
// Write both as named types and use them in typed functions.
// ----------------------------------------------------------------

// TODO: derive PostWithAuthorAndTags and PostPreview types

// async function getPostWithDetails(id: number): Promise<PostWithAuthorAndTags | null>
// async function getPostPreviews(): Promise<PostPreview[]>


// ----------------------------------------------------------------
// Exercise 4: Filtering & pagination
// Write a function:
//   searchPosts(options: {
//     query?: string;       // search title or content
//     published?: boolean;
//     tag?: string;         // filter by tag name
//     page?: number;        // default 1
//     perPage?: number;     // default 10
//   }): Promise<{ posts: PostPreview[]; total: number; pages: number }>
//
// Use Prisma's where, take, skip, and count.
// ----------------------------------------------------------------

// TODO: implement searchPosts


// ----------------------------------------------------------------
// Exercise 5: Transaction
// Write a function `deleteUser(userId: number): Promise<void>` that:
//   1. Deletes all Comments by the user
//   2. Unpublishes all Posts by the user (set published: false)
//   3. Deletes the User
//   All in a single transaction — if any step fails, all roll back.
// ----------------------------------------------------------------

// TODO: implement deleteUser using prisma.$transaction
