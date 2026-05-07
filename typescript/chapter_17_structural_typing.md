# Chapter 17: Structural Typing & Type Compatibility (Hour 17)

This chapter explains *how* TypeScript's type system actually works under the hood. Understanding these rules will help you reason through compiler errors that seem mysterious at first.

## 1. Structural Typing ("Duck Typing")

TypeScript uses **structural typing**: a type is compatible with another if it has at least the same structure — regardless of name.

```typescript
interface Point2D { x: number; y: number; }
interface Coordinate { x: number; y: number; } // same shape, different name

const p: Point2D = { x: 1, y: 2 };
const c: Coordinate = p; // OK — same structure

// A type with MORE properties is still assignable to a type with fewer
interface Point3D { x: number; y: number; z: number; }
const p3: Point3D = { x: 1, y: 2, z: 3 };
const p2: Point2D = p3; // OK — Point3D has everything Point2D needs
```

## 2. Excess Property Checking

TypeScript applies a stricter check when assigning **object literals** directly. Extra properties that don't exist on the target type cause an error.

```typescript
interface Point2D { x: number; y: number; }

// Direct object literal assignment — excess property check fires
const p: Point2D = { x: 1, y: 2, z: 3 }; // Error: 'z' does not exist in type 'Point2D'

// Assigning through a variable bypasses the check
const temp = { x: 1, y: 2, z: 3 };
const p2: Point2D = temp; // OK — structural typing applies, z is simply ignored
```

This is intentional: it catches typos in literal objects while remaining flexible for variables.

## 3. Function Type Compatibility

Function compatibility follows specific rules for parameters and return types.

### Return types are covariant (must be as specific or more specific)
```typescript
type GetUser    = () => { name: string };
type GetAdmin   = () => { name: string; role: string }; // returns more

let getUser: GetUser;
let getAdmin: GetAdmin = () => ({ name: "Alice", role: "admin" });

getUser = getAdmin; // OK — GetAdmin returns more than GetUser needs
// getAdmin = getUser; // Error — GetUser doesn't return `role`
```

### Parameters are contravariant (target can accept fewer parameters)
```typescript
type Callback    = (event: MouseEvent) => void;
type AnyCallback = (event: Event) => void; // broader parameter type

let onClick: Callback;
let onEvent: AnyCallback = (e: Event) => console.log(e.type);

onClick = onEvent; // OK — AnyCallback handles any Event, including MouseEvent
```

### Functions with fewer parameters are assignable to those with more
```typescript
// This is why array callbacks work without specifying all arguments
const nums = [1, 2, 3];
nums.forEach((n) => console.log(n));       // OK — ignoring `index` and `array`
nums.forEach((n, i) => console.log(n, i)); // OK too
```

## 4. Assignability Rules Summary

| Scenario | Allowed? |
|----------|----------|
| Assigning a subtype to a supertype | Yes |
| Assigning a supertype to a subtype | No |
| Extra properties in a variable | Yes (structural) |
| Extra properties in a literal | No (excess property check) |
| Function with fewer params to one with more | Yes |
| Function returning more to one returning less | Yes |
| Function returning less to one returning more | No |

## 5. `unknown` vs `any` vs `never`

These three types sit at the extremes of the type hierarchy.

```
        any          ← accepts everything, returns anything (unsafe)
         |
      unknown        ← accepts everything, forces narrowing before use (safe top type)
      /     \
   string  number  boolean  …  (all other types)
      \     /
       never         ← bottom type, represents impossibility (no value can be `never`)
```

```typescript
let a: unknown = "hello";
// a.toUpperCase(); // Error — must narrow first
if (typeof a === "string") {
    a.toUpperCase(); // OK after narrowing
}

// `never` appears in exhaustive checks and functions that never return
function fail(message: string): never {
    throw new Error(message); // never returns normally
}

function assertUnreachable(x: never): never {
    throw new Error("This should never happen");
}
```

## 6. Type Widening

When TypeScript infers a type from a value, it often "widens" the type from a literal to a broader type.

```typescript
let name = "Alice";       // inferred as `string`, not `"Alice"`
const greeting = "Hello"; // inferred as `"Hello"` (const prevents reassignment)

// Force a literal type with `as const`
const config = {
    method: "GET",
    path: "/users",
} as const;

// config.method: "GET"  (literal type, not just string)
// config.path:   "/users"
// config is now fully Readonly too

type Method = typeof config.method; // "GET"
```

## 7. `as const` with Arrays

```typescript
const ROLES = ["admin", "user", "guest"] as const;

type Role = typeof ROLES[number]; // "admin" | "user" | "guest"

function setRole(role: Role): void {
    console.log(`Role set to: ${role}`);
}

setRole("admin"); // OK
// setRole("superuser"); // Error: not in the union
```

## Action Item for Hour 17:

1. Create two interfaces `Cat` and `Dog` with overlapping and differing properties. Test which assignments TypeScript allows.
2. Write a function that takes `(handler: (event: Event) => void)` and verify you can pass a more specific `(event: MouseEvent) => void` function — then explain why this works based on contravariance.
3. Use `as const` to define a `PAYMENT_METHODS` array and derive a `PaymentMethod` union type from it automatically.

---

## Congratulations — You've Completed the Full TypeScript Curriculum!

Here is everything you have mastered across all 17 chapters:

| Chapter | Topic |
|---------|-------|
| 1  | Types & Basic Syntax |
| 2  | Interfaces & Type Aliases |
| 3  | Functions, Arrays & Tuples |
| 4  | Generics |
| 5  | Utility Types & Advanced Concepts |
| 6  | Classes & OOP |
| 7  | Type Narrowing & Type Guards |
| 8  | Mapped & Conditional Types |
| 9  | Async TypeScript |
| 10 | Modules & tsconfig.json |
| 11 | Decorators |
| 12 | Declaration Files (.d.ts) |
| 13 | Advanced Generic Patterns |
| 14 | Error Handling Patterns |
| 15 | Real-World Architecture |
| 16 | Symbols, Iterators & Generators |
| 17 | Structural Typing & Type Compatibility |

**Recommended next step:** Build a complete project — a REST API with NestJS or a React app with strict TypeScript — to apply everything in a real codebase under pressure.
