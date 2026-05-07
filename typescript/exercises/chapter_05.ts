// ============================================================
// Chapter 5 — Utility Types & Advanced Concepts
// Run: tsx exercises/chapter_05.ts
// ============================================================

interface User {
    id: number;
    name: string;
    email: string;
    passwordHash: string;
    role: "admin" | "user" | "guest";
    createdAt: Date;
}

// ----------------------------------------------------------------
// Exercise 1: Partial & Required
// a) Write `updateUser(user: User, changes: Partial<User>): User`
//    that merges changes into a user object.
// b) Create a type `StrictUser` using Required<> that makes every
//    field of User required (even if some were optional).
// ----------------------------------------------------------------

// TODO: implement updateUser and define StrictUser

// const existing: User = { id: 1, name: "Alice", email: "a@b.com", passwordHash: "x", role: "user", createdAt: new Date() };
// console.log(updateUser(existing, { name: "Alice Smith", role: "admin" }));


// ----------------------------------------------------------------
// Exercise 2: Pick & Omit
// a) Create `PublicUser` using Omit — exclude passwordHash
// b) Create `UserPreview` using Pick — include only id and name
// c) Write `toPublicUser(user: User): PublicUser` that strips the password
// ----------------------------------------------------------------

// TODO: define PublicUser, UserPreview, and toPublicUser


// ----------------------------------------------------------------
// Exercise 3: Readonly
// a) Create `FrozenUser` using Readonly<User>
// b) Create a FrozenUser object and verify that trying to assign
//    to any field causes a TypeScript error (write the attempted
//    assignment as a comment so we can see you know it errors).
// ----------------------------------------------------------------

// TODO: define FrozenUser and demonstrate the readonly error


// ----------------------------------------------------------------
// Exercise 4: Enum
// Define an enum `OrderStatus` with values:
//   Pending, Processing, Shipped, Delivered, Cancelled
// Write `describeOrder(status: OrderStatus): string` that returns
// a human-readable sentence for each status.
// Use exhaustiveness checking with `never` in the default case.
// ----------------------------------------------------------------

// TODO: implement OrderStatus enum and describeOrder

// console.log(describeOrder(OrderStatus.Shipped)); // "Your order is on its way!"


// ----------------------------------------------------------------
// Exercise 5: Type assertion
// The function below returns `unknown`. Use a type assertion to
// treat the result as a User and access its name property.
// Then rewrite it more safely using a type guard instead of assertion.
// ----------------------------------------------------------------

function fetchRawUser(): unknown {
    return { id: 1, name: "Bob", email: "bob@example.com", passwordHash: "hash", role: "user", createdAt: new Date() };
}

// TODO: version 1 — use `as User` assertion to log the name
// TODO: version 2 — write a `isUser(val: unknown): val is User` type guard and use it safely
