# Chapter 8: Mapped Types & Conditional Types (Hour 8)

This chapter covers the most advanced part of the TypeScript type system. These features let you transform and derive types programmatically — powering the utility types you learned in Chapter 5 (`Partial`, `Readonly`, `Pick`, etc.) from within the language itself.

## 1. `keyof` — Extracting Keys as a Union

`keyof` takes an object type and returns a union of its keys as string literals.

```typescript
interface User {
    id: number;
    name: string;
    email: string;
}

type UserKeys = keyof User; // "id" | "name" | "email"

function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
    return obj[key];
}

const user: User = { id: 1, name: "Alice", email: "alice@example.com" };
const name = getProperty(user, "name");   // type is string
const id   = getProperty(user, "id");     // type is number
// getProperty(user, "age");              // Error: "age" is not a key of User
```

## 2. Mapped Types

A mapped type iterates over a union of keys to create a new type. The `in` keyword drives the iteration.

```typescript
// This is exactly how TypeScript's built-in Partial<T> works
type MyPartial<T> = {
    [K in keyof T]?: T[K];
};

// This is how Readonly<T> works
type MyReadonly<T> = {
    readonly [K in keyof T]: T[K];
};

interface Config {
    host: string;
    port: number;
}

type PartialConfig = MyPartial<Config>;
// { host?: string; port?: number; }

type ReadonlyConfig = MyReadonly<Config>;
// { readonly host: string; readonly port: number; }
```

### Remapping Key Names with `as`

You can rename keys during mapping using `as` and template literal types.

```typescript
type Getters<T> = {
    [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};

interface Person {
    name: string;
    age: number;
}

type PersonGetters = Getters<Person>;
// {
//   getName: () => string;
//   getAge:  () => number;
// }
```

## 3. Template Literal Types

Template literal types work like template strings but at the type level.

```typescript
type EventName = "click" | "focus" | "blur";
type EventHandler = `on${Capitalize<EventName>}`;
// "onClick" | "onFocus" | "onBlur"

type CSSProperty = "margin" | "padding";
type CSSDirection = "Top" | "Bottom" | "Left" | "Right";
type CSSBoxProperty = `${CSSProperty}${CSSDirection}`;
// "marginTop" | "marginBottom" | ... | "paddingRight"
```

## 4. Conditional Types

Conditional types let you choose a type based on a condition, similar to a ternary operator.

```typescript
// Syntax: T extends U ? TypeIfTrue : TypeIfFalse

type IsString<T> = T extends string ? "yes" : "no";

type A = IsString<string>;  // "yes"
type B = IsString<number>;  // "no"
type C = IsString<"hello">; // "yes" — "hello" is a subtype of string
```

### Practical Example — `NonNullable`

This is how TypeScript's built-in `NonNullable<T>` is implemented.

```typescript
type MyNonNullable<T> = T extends null | undefined ? never : T;

type D = MyNonNullable<string | null | undefined>; // string
type E = MyNonNullable<number | null>;             // number
```

## 5. `infer` — Extracting Types from Conditions

`infer` lets you capture a type variable from within a conditional type. This is how you "unwrap" types.

```typescript
// Extract the return type of any function
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

function fetchUser(): Promise<{ name: string }> {
    return Promise.resolve({ name: "Alice" });
}

type FetchUserReturn = ReturnType<typeof fetchUser>;
// Promise<{ name: string }>

// Unwrap the Promise itself
type Awaited<T> = T extends Promise<infer R> ? R : T;

type UnwrappedUser = Awaited<FetchUserReturn>;
// { name: string }
```

> Note: TypeScript 4.5+ ships `Awaited<T>` as a built-in utility type.

## 6. Putting It Together — A Real-World Example

Here is a utility that builds a type-safe event emitter map from a plain interface.

```typescript
interface AppEvents {
    userLoggedIn: { userId: string; timestamp: Date };
    orderPlaced:  { orderId: number; total: number };
    pageViewed:   { path: string };
}

// Creates { onUserLoggedIn: ..., onOrderPlaced: ..., onPageViewed: ... }
type EventHandlers<T> = {
    [K in keyof T as `on${Capitalize<string & K>}`]: (payload: T[K]) => void;
};

type AppEventHandlers = EventHandlers<AppEvents>;
// {
//   onUserLoggedIn: (payload: { userId: string; timestamp: Date }) => void;
//   onOrderPlaced:  (payload: { orderId: number; total: number }) => void;
//   onPageViewed:   (payload: { path: string }) => void;
// }
```

## Action Item for Hour 8:

1. Using mapped types, build your own `MyPick<T, K extends keyof T>` utility that replicates `Pick<T, K>`.
2. Write a conditional type `IsArray<T>` that resolves to `"yes"` if `T` is an array, and `"no"` otherwise.
3. Write an `ElementType<T>` that uses `infer` to extract the element type from any array (`ElementType<string[]>` → `string`).
