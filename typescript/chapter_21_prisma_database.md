# Chapter 21: Prisma & Database Typing (Hour 21)

Prisma is the gold standard for type-safe database access in TypeScript. You define a schema, run a command, and Prisma generates a fully typed client — every query result is typed automatically.

## 1. Setup

```bash
npm install prisma @prisma/client
npx prisma init  # creates prisma/schema.prisma and .env
```

Set your database URL in `.env`:
```
DATABASE_URL="postgresql://user:password@localhost:5432/mydb"
```

## 2. Defining the Schema

The Prisma schema (`prisma/schema.prisma`) describes your database models.

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String
  role      Role     @default(USER)
  createdAt DateTime @default(now())
  posts     Post[]   // one-to-many relation
}

model Post {
  id        Int      @id @default(autoincrement())
  title     String
  content   String?
  published Boolean  @default(false)
  author    User     @relation(fields: [authorId], references: [id])
  authorId  Int
  tags      Tag[]    @relation("PostToTag") // many-to-many
}

model Tag {
  id    Int    @id @default(autoincrement())
  name  String @unique
  posts Post[] @relation("PostToTag")
}

enum Role {
  USER
  ADMIN
}
```

Run migrations and generate the typed client:
```bash
npx prisma migrate dev --name init
npx prisma generate
```

## 3. The Prisma Client — Generated Types

After generation, Prisma exports types that match your schema exactly. You never write these manually.

```typescript
import { PrismaClient, User, Post, Role } from "@prisma/client";

const prisma = new PrismaClient();

// `User` type is auto-generated:
// {
//   id: number;
//   email: string;
//   name: string;
//   role: "USER" | "ADMIN";
//   createdAt: Date;
// }
```

## 4. CRUD Operations — All Fully Typed

```typescript
// CREATE
const user = await prisma.user.create({
    data: {
        name: "Alice",
        email: "alice@example.com",
        role: "ADMIN",
    },
});
// user: User — fully typed

// READ — find one
const found = await prisma.user.findUnique({
    where: { email: "alice@example.com" },
});
// found: User | null

// READ — find many with filtering
const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    orderBy: { createdAt: "desc" },
    take: 10,
    skip: 0,
});
// admins: User[]

// UPDATE
const updated = await prisma.user.update({
    where: { id: 1 },
    data: { name: "Alice Smith" },
});

// DELETE
await prisma.user.delete({ where: { id: 1 } });

// UPSERT — create if not exists, update if exists
const upserted = await prisma.user.upsert({
    where: { email: "bob@example.com" },
    update: { name: "Bob Updated" },
    create: { email: "bob@example.com", name: "Bob" },
});
```

## 5. Relations — `include` and `select`

```typescript
// Include related records (JOIN equivalent)
const userWithPosts = await prisma.user.findUnique({
    where: { id: 1 },
    include: { posts: true },
});
// userWithPosts: User & { posts: Post[] }

// Nested include
const userWithPostsAndTags = await prisma.user.findUnique({
    where: { id: 1 },
    include: {
        posts: {
            include: { tags: true },
            where: { published: true },
        },
    },
});

// Select only specific fields (like SQL SELECT col1, col2)
const userPreview = await prisma.user.findUnique({
    where: { id: 1 },
    select: { id: true, name: true, email: true },
});
// userPreview: { id: number; name: string; email: string } | null
// Note: no `role` or `createdAt` — only selected fields are typed
```

## 6. Prisma Types for Reuse

Prisma generates utility types you can use in your application layer.

```typescript
import { Prisma } from "@prisma/client";

// Type for the result of a specific query (including relations)
type UserWithPosts = Prisma.UserGetPayload<{
    include: { posts: true };
}>;
// { id: number; name: string; ...; posts: Post[] }

// Type for creating a user
type CreateUserInput = Prisma.UserCreateInput;

// Use in a service function
async function createUser(data: CreateUserInput): Promise<User> {
    return prisma.user.create({ data });
}
```

## 7. Transactions

Run multiple operations atomically — if one fails, all roll back.

```typescript
// Interactive transaction — use the tx client instead of prisma
const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
        data: { email: "charlie@example.com", name: "Charlie" },
    });

    const post = await tx.post.create({
        data: {
            title: "First Post",
            authorId: user.id,
        },
    });

    return { user, post };
});
// If the post creation fails, the user creation is also rolled back
```

## 8. Singleton Pattern for Prisma Client

In production, you must avoid creating multiple `PrismaClient` instances (especially in Next.js with hot reloading).

```typescript
// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
    globalForPrisma.prisma ?? new PrismaClient({ log: ["query"] });

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}
```

Import from here everywhere:
```typescript
import { prisma } from "@/lib/prisma";
```

## Action Item for Hour 21:

- Define a Prisma schema for an e-commerce app: `Product` (id, name, price, stock), `Order` (id, createdAt, total), and `OrderItem` (quantity, linking Order to Product).
- Write a typed service function `placeOrder(items: { productId: number; quantity: number }[])` that:
  1. Checks stock availability
  2. Creates the order and order items
  3. Decrements stock for each product
  4. Wraps everything in a transaction
