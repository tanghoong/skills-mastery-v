// ============================================================
// Chapter 8 — Mapped & Conditional Types
// Run: tsx exercises/chapter_08.ts
// ============================================================

// ----------------------------------------------------------------
// Exercise 1: keyof and indexed access
// Given the Product interface, write:
//   a) A type `ProductKeys` = all keys of Product as a union
//   b) A function `getField<T, K extends keyof T>(obj: T, key: K): T[K]`
//   c) A function `pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K>`
//      that constructs a new object with only the specified keys
// ----------------------------------------------------------------

interface Product {
    id: number;
    name: string;
    price: number;
    category: string;
    inStock: boolean;
}

// TODO: define ProductKeys, implement getField and pick

// const p: Product = { id: 1, name: "Laptop", price: 999, category: "Electronics", inStock: true };
// console.log(getField(p, "name"));               // "Laptop"
// console.log(pick(p, ["name", "price"]));        // { name: "Laptop", price: 999 }


// ----------------------------------------------------------------
// Exercise 2: Build your own utility types
// Implement these from scratch using mapped types (no built-ins):
//   MyPartial<T>  — all fields optional
//   MyRequired<T> — all fields required
//   MyReadonly<T> — all fields readonly
// Test each with the Product interface.
// ----------------------------------------------------------------

// TODO: implement MyPartial, MyRequired, MyReadonly


// ----------------------------------------------------------------
// Exercise 3: Conditional types
// Implement:
//   a) IsString<T>  — resolves to true if T extends string, else false
//   b) IsArray<T>   — resolves to "yes" if T is an array, else "no"
//   c) Flatten<T>   — if T is an array, return the element type; otherwise T
// ----------------------------------------------------------------

// TODO: implement IsString, IsArray, Flatten

// Test (these are type-level, verify with hover in VS Code or add comments):
// type A = IsString<string>;   // true
// type B = IsString<number>;   // false
// type C = IsArray<string[]>;  // "yes"
// type D = IsArray<number>;    // "no"
// type E = Flatten<string[]>;  // string
// type F = Flatten<boolean>;   // boolean


// ----------------------------------------------------------------
// Exercise 4: Template literal types
// Given: type HttpMethod = "get" | "post" | "put" | "delete"
// Create:
//   a) `HandlerName` — "onGet" | "onPost" | "onPut" | "onDelete"
//   b) `RouteRecord` — a mapped type that maps each HandlerName
//      to a function: (req: unknown) => unknown
// ----------------------------------------------------------------

type HttpMethod = "get" | "post" | "put" | "delete";

// TODO: define HandlerName and RouteRecord


// ----------------------------------------------------------------
// Exercise 5: infer
// Write these utility types using `infer`:
//   a) UnpackPromise<T>  — extracts T from Promise<T>
//   b) FirstArg<T>       — extracts the type of the first argument of a function
// ----------------------------------------------------------------

// TODO: implement UnpackPromise and FirstArg

// type R1 = UnpackPromise<Promise<string>>;          // string
// type R2 = UnpackPromise<Promise<{ id: number }>>;  // { id: number }
// type R3 = FirstArg<(a: number, b: string) => void>; // number
// type R4 = FirstArg<(user: Product) => void>;        // Product
