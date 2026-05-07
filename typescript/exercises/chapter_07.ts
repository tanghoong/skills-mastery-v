// ============================================================
// Chapter 7 — Type Narrowing & Type Guards
// Run: tsx exercises/chapter_07.ts
// ============================================================

// ----------------------------------------------------------------
// Exercise 1: typeof narrowing
// Write `formatValue(val: string | number | boolean): string` that:
//   - string  → returns it uppercased
//   - number  → returns it formatted to 2 decimal places
//   - boolean → returns "YES" or "NO"
// ----------------------------------------------------------------

// TODO: implement formatValue

// console.log(formatValue("hello"));  // "HELLO"
// console.log(formatValue(3.14159)); // "3.14"
// console.log(formatValue(true));    // "YES"


// ----------------------------------------------------------------
// Exercise 2: Discriminated union
// Define these types with a `kind` discriminant:
//   Circle:    { kind: "circle";    radius: number }
//   Rectangle: { kind: "rectangle"; width: number; height: number }
//   Triangle:  { kind: "triangle";  base: number; height: number }
//
// Write `area(shape: Shape): number` using a switch statement.
// Add exhaustiveness checking with `never` in the default case.
// ----------------------------------------------------------------

// TODO: define Shape union and implement area()

// console.log(area({ kind: "circle",    radius: 5 }));        // ~78.54
// console.log(area({ kind: "rectangle", width: 4, height: 6 })); // 24
// console.log(area({ kind: "triangle",  base: 3, height: 8 }));  // 12


// ----------------------------------------------------------------
// Exercise 3: instanceof narrowing
// Define two classes: `Dog` (with bark(): string) and `Cat` (with meow(): string).
// Write `makeNoise(animal: Dog | Cat): string` using instanceof.
// ----------------------------------------------------------------

// TODO: implement Dog, Cat, makeNoise


// ----------------------------------------------------------------
// Exercise 4: User-defined type guard
// Define interfaces:
//   Admin: { role: "admin"; permissions: string[] }
//   Member: { role: "member"; subscriptionLevel: "free" | "pro" }
//
// Write:
//   isAdmin(user: Admin | Member): user is Admin
//   canAccessFeature(user: Admin | Member, feature: string): boolean
//     — admins can always access; members only if subscriptionLevel === "pro"
// ----------------------------------------------------------------

// TODO: implement isAdmin and canAccessFeature

// const admin: Admin   = { role: "admin",  permissions: ["delete", "ban"] };
// const member: Member = { role: "member", subscriptionLevel: "pro" };
// const free: Member   = { role: "member", subscriptionLevel: "free" };
// console.log(canAccessFeature(admin,  "export")); // true
// console.log(canAccessFeature(member, "export")); // true
// console.log(canAccessFeature(free,   "export")); // false


// ----------------------------------------------------------------
// Exercise 5: Nullish narrowing with ?.  and  ??
// Given the interface below, write `getFullAddress(user: User): string`
// that returns "123 Main St, Bangkok, Thailand" if address exists,
// or "No address on file" if it doesn't.
// Use optional chaining and nullish coalescing — no if statements allowed.
// ----------------------------------------------------------------

interface User {
    name: string;
    address?: {
        street: string;
        city: string;
        country: string;
    };
}

// TODO: implement getFullAddress

// console.log(getFullAddress({ name: "Alice", address: { street: "123 Main St", city: "Bangkok", country: "Thailand" } }));
// console.log(getFullAddress({ name: "Bob" }));
